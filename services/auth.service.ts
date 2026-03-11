import * as SecureStore from "expo-secure-store";
import { axiosInstance, axiosRefreshInstance } from "../lib/axios";

let refreshPromise: Promise<{ data: { accessToken: string; refreshToken: string }; status: number }> | null = null;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  points: number;
  createdAt: string;
  upiId?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseWithTokens extends AuthResponse {
  user: User & {
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Helper to clear tokens
const clearTokens = async () => {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
};

// Helper to update user in store
const updateUserInStore = async (userData: Partial<User>) => {
  try {
    const { useAuthStore } = await import("../store/auth-store");
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      useAuthStore.getState().setUser({
        ...currentUser,
        ...userData,
      });
    }
  } catch (error: any) {
    // Ignore store errors
    console.log("Failed to update user in store:", error);
  }
};

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponseWithTokens> {
    try {
      console.log("[authService] login request to", axiosInstance.defaults.baseURL + "/auth/login", credentials.email);
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        credentials
      );

      const { accessToken, refreshToken, user } = response.data.data;
      return { accessToken, refreshToken, user } as AuthResponseWithTokens;
    } catch (error: any) {
      console.log("[authService] login error", error.response?.status, error.response?.data, error.message);
      throw error;
    }

  },

  async register(data: RegisterRequest): Promise<AuthResponseWithTokens> {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      data
    );

    const { accessToken, refreshToken, user } = response.data.data;

    // Store tokens in SecureStore
    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);

    // Create user object with tokens
    const userWithTokens = {
      ...user,
      accessToken,
      refreshToken,
    };

    // Update auth store
    try {
      const { useAuthStore } = await import("../store/auth-store");
      useAuthStore.getState().setUser(userWithTokens);
    } catch (error) {
      console.log("Failed to update auth store:", error);
    }

    return {
      ...response.data.data,
      user: userWithTokens,
    };
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await axiosInstance.post<ApiResponse<null>>("/auth/forgot-password", data);
  },

  async logout(): Promise<void> {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");

    if (refreshToken) {
      try {
        await axiosInstance.post("/auth/logout", { refreshToken });
      } catch (error) {
        // Ignore logout API errors
      }
    }

    // Clear tokens from SecureStore
    await clearTokens();

    // Clear user from store
    try {
      const { useAuthStore } = await import("../store/auth-store");
      useAuthStore.getState().logout?.();
    } catch (error) {
      console.log("Failed to logout from store:", error);
    }
  },

  async refreshToken(): Promise<{
    data: { accessToken: string; refreshToken: string };
    status: number;
  }> {
    // If a refresh is already in progress, return that promise
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        // Get refresh token from SecureStore (primary source)
        let refreshToken = await SecureStore.getItemAsync("refreshToken");

        // If not in SecureStore, try to get from user object in store (fallback)
        if (!refreshToken) {
          try {
            const { useAuthStore } = await import("../store/auth-store");

        
            const user = useAuthStore.getState().user;
            refreshToken = user?.refreshToken || null;
          } catch {
            // Store import failed – ignore
          }
        }

        // If still no refresh token, user must log in again
        if (!refreshToken) {
          console.error("No refresh token available – logging out");
          
          // Clear any leftover tokens
          await clearTokens();
          
          // Reset the auth store
          try {
            const { useAuthStore } = await import("../store/auth-store");
            useAuthStore.getState().logout?.();
          } catch {
            // Ignore store errors
          }

          throw new Error("NO_REFRESH_TOKEN");
        }

        console.log("Refreshing JWT Token");

        // Call refresh endpoint
        const response = await axiosRefreshInstance.post<
          ApiResponse<{ accessToken: string; refreshToken: string }>
        >("/auth/refresh", { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens in SecureStore
        await SecureStore.setItemAsync("accessToken", accessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync("refreshToken", newRefreshToken);
        }

        // Update user object in store with new tokens
        try {
          const { useAuthStore } = await import("../store/auth-store");
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.getState().setUser({
              ...currentUser,
              accessToken,
              refreshToken: newRefreshToken || refreshToken,
            });
          }
        } catch {
          // Ignore store errors
        }

        console.log("JWT Token refreshed successfully");

        return {
          data: {
            accessToken,
            refreshToken: newRefreshToken || refreshToken,
          },
          status: response.status,
        };
      } catch (error: any) {
        console.error("Token refresh error:", error?.response?.data || error?.message);
        
        // If it's an auth error, clear tokens
        if (error?.response?.status === 401 || error?.message === "NO_REFRESH_TOKEN") {
          await clearTokens();
          try {
            const { useAuthStore } = await import("../store/auth-store");
            useAuthStore.getState().logout?.();
          } catch {
            // Ignore store errors
          }
        }
        
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  async getProfile(): Promise<
    User & { bio?: string; profilePicture?: string; upiId?: string; phone?: string }
  > {
    const accessToken = await SecureStore.getItemAsync("accessToken");

    const response = await axiosInstance.get<
      ApiResponse<User & { bio?: string; profilePicture?: string; upiId?: string; phone?: string }>
    >("/auth/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profileData = response.data.data;

    // Update user in store with profile data
    try {
      const { useAuthStore } = await import("../store/auth-store");
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          ...profileData,
        });
      }
    } catch {
      // Ignore store errors
    }

    return profileData;
  },

  // Helper method to check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    return !!accessToken;
  },

  // Helper method to get current tokens
  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync("accessToken"),
      SecureStore.getItemAsync("refreshToken"),
    ]);
    
    return { accessToken, refreshToken };
  },
};