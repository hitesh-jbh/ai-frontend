import { axiosInstance, axiosRefreshInstance } from "../lib/axios";
import * as SecureStore from "expo-secure-store";

// Lock to prevent multiple simultaneous refresh attempts
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

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponseWithTokens> {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );
    const { accessToken, refreshToken, user } = response.data.data;

    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);

    return {
      ...response.data.data,
      user: { ...user, accessToken, refreshToken },
    };
  },

  async register(data: RegisterRequest): Promise<AuthResponseWithTokens> {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      data
    );
    const { accessToken, refreshToken, user } = response.data.data;

    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);

    return {
      ...response.data.data,
      user: { ...user, accessToken, refreshToken },
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
        // Continue with logout even if API call fails
        // Logout API error - continue with local logout
      }
    }

    // Clear tokens
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
  },

  async refreshToken(): Promise<{
    data: { accessToken: string; refreshToken: string };
    status: number;
  }> {
    // If a refresh is already in progress, wait for it instead of starting a new one
    if (refreshPromise) {
      return refreshPromise;
    }

    // Create the refresh promise
    refreshPromise = (async () => {
      try {
        // Try to get refresh token from user store first (more reliable)
        // Fallback to SecureStore if not in store
        let refreshToken: string | null = null;
        
        try {
          // Try to get from store first (if available)
          const { useAuthStore } = await import("../store/auth-store.js");
          const user = useAuthStore.getState().user;
          refreshToken = user?.refreshToken || null;
        } catch (error) {
          // Store not available, continue to SecureStore
        }
        
        // Fallback to SecureStore if not in user store
        if (!refreshToken) {
          refreshToken = await SecureStore.getItemAsync("refreshToken");
        }
        
        if (!refreshToken) {
          console.error("No refresh token available in SecureStore or user store");
          throw new Error("No refresh token available");
        }

        console.log("Refreshing JWT Token");

        // Use axiosRefreshInstance which doesn't have interceptors
        // This avoids circular dependency when refreshing tokens
        const response = await axiosRefreshInstance.post<
          ApiResponse<{ accessToken: string; refreshToken: string }>
        >("/auth/refresh", { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        if (!accessToken) {
          console.error("No access token in refresh response");
          throw new Error("Invalid refresh response - no access token");
        }

        // Store new tokens in SecureStore
        await SecureStore.setItemAsync("accessToken", accessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync("refreshToken", newRefreshToken);
        } else {
          // If no new refresh token, keep the old one
          console.warn("No new refresh token provided, keeping existing one");
        }

        console.log("JWT Token refreshed");

        return {
          data: {
            accessToken,
            refreshToken: newRefreshToken || refreshToken, // Fallback to old token if new one not provided
          },
          status: response.status,
        };
      } catch (error: any) {
        console.error(
          "Token refresh error:",
          error?.response?.data || error?.message
        );
        throw error;
      } finally {
        // Clear the promise so a new refresh can be attempted if needed
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
    return response.data.data;
  },
};
