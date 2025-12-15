import { create } from "zustand";
import { authService } from "../services/auth.service";
import * as SecureStore from "expo-secure-store";
import { useSubscriptionStore } from "./subscription-store";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  createdAt: string;
  bio?: string;
  profilePicture?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (
    user: User,
    accessToken: string,
    refreshToken: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  resetUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,

  login: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync("accessToken", accessToken);
    await SecureStore.setItemAsync("refreshToken", refreshToken);
    set({
      isAuthenticated: true,
      user: { ...user, accessToken, refreshToken },
    });
  },

  logout: async () => {
    try {
      // Loading state
      set({ isLoading: true });
      await authService.logout();
    } catch (error) {
      console.error("Logout service error:", error);
      // Continue with logout even if API call fails
    } finally {
      set({ isAuthenticated: false, user: null, isLoading: false });
      // Clear subscription store on logout
      useSubscriptionStore.getState().clearSubscription();
      // Note: React Query cache should be cleared in the component that calls logout
      // (e.g., options.tsx already does queryClient.clear())
    }
  },

  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (accessToken && refreshToken) {
        // Fetch user profile to get latest data including bio and profilePicture
        try {
          const profile = await authService.getProfile();
          set({
            isAuthenticated: true,
            user: { ...profile, accessToken, refreshToken },
            isLoading: false,
          });

          // Fetch subscription status after profile is loaded
          // This will be handled by components that use subscription store
        } catch (error: any) {
          // If profile fetch fails with 401, try to refresh token
          if (error?.response?.status === 401) {
            try {
              const { data } = await authService.refreshToken();
              if (data?.accessToken) {
                const profile = await authService.getProfile();
                set({
                  isAuthenticated: true,
                  user: {
                    ...profile,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                  },
                  isLoading: false,
                });

                // Fetch subscription status after profile is loaded
              } else {
                // Refresh failed, clear tokens
                await SecureStore.deleteItemAsync("accessToken");
                await SecureStore.deleteItemAsync("refreshToken");
                set({ isAuthenticated: false, isLoading: false });
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens
              await SecureStore.deleteItemAsync("accessToken");
              await SecureStore.deleteItemAsync("refreshToken");
              set({ isAuthenticated: false, isLoading: false });
            }
          } else {
            // Other error, still set as authenticated with token
            set({ isAuthenticated: true, isLoading: false });
          }
        }
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  resetUser: async () => {
    // Clear SecureStore tokens when resetting user
    try {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
    set({ user: null, isAuthenticated: false });
  },
}));
