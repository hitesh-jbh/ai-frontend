import { axiosInstance, axiosRefreshInstance } from "../lib/axios";
import * as SecureStore from "expo-secure-store";

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
  email: string;
  role: string;
  points: number;
  createdAt: string;
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
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    if (!refreshToken) {
      console.error("No refresh token available in SecureStore");
      throw new Error("No refresh token available");
    }

    console.log("Attempting to refresh token...");

    try {
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

      console.log("Tokens refreshed and saved successfully");

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
    }
  },

  async getProfile(): Promise<
    User & { bio?: string; profilePicture?: string }
  > {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    const response = await axiosInstance.get<
      ApiResponse<User & { bio?: string; profilePicture?: string }>
    >("/auth/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },
};
