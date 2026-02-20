import { create } from "zustand";
import { authService } from "../services/auth.service";
import * as SecureStore from "expo-secure-store";
import { useSubscriptionStore } from "./subscription-store";
import { useSearchPreferencesStore } from "./search-preferences-store";

interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: string;
  points: number;
  createdAt: string;
  bio?: string;
  profilePicture?: string;
  upiId?: string;
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
  setUser: (user: User | null) => Promise<void>;
  resetUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
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
      // Clear search preferences on logout
      useSearchPreferencesStore.getState().clearPreferences();
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
          // Use setUser to persist tokens properly
          const setUserFn = get().setUser;
          await setUserFn({ ...profile, accessToken, refreshToken });
          set({ isLoading: false });

          // Fetch subscription status after profile is loaded
          // This will be handled by components that use subscription store
        } catch (error: any) {
          // If profile fetch fails with 401, try to refresh token
          if (error?.response?.status === 401) {
            try {
              const { data } = await authService.refreshToken();
              if (data?.accessToken) {
                const profile = await authService.getProfile();
                // Use setUser to persist tokens properly
                const setUserFn = get().setUser;
                await setUserFn({
                  ...profile,
                  accessToken: data.accessToken,
                  refreshToken: data.refreshToken,
                });
                set({ isLoading: false });

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
            // Use setUser to ensure tokens are persisted
            const setUserFn = get().setUser;
            const currentUser = get().user;
            if (currentUser) {
              await setUserFn({ ...currentUser, accessToken, refreshToken });
            }
            set({ isLoading: false });
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

  setUser: async (user) => {
    // Always preserve existing tokens if new user object doesn't have them
    // This is important when updating user profile data (which may not include tokens)
    let tokensToStore = { accessToken: user?.accessToken, refreshToken: user?.refreshToken };
    
    // If tokens are missing from user object, try to get them from SecureStore
    if (!tokensToStore.accessToken || !tokensToStore.refreshToken) {
      try {
        const existingAccessToken = tokensToStore.accessToken || await SecureStore.getItemAsync("accessToken");
        const existingRefreshToken = tokensToStore.refreshToken || await SecureStore.getItemAsync("refreshToken");
        tokensToStore = {
          accessToken: existingAccessToken || tokensToStore.accessToken,
          refreshToken: existingRefreshToken || tokensToStore.refreshToken,
        };
        // Update user object with preserved tokens
        if (user && (existingAccessToken || existingRefreshToken)) {
          user = {
            ...user,
            accessToken: existingAccessToken || user.accessToken,
            refreshToken: existingRefreshToken || user.refreshToken,
          };
        }
      } catch (error) {
        console.error("Error reading tokens from SecureStore in setUser:", error);
      }
    }
    
    // Persist tokens to SecureStore if we have them
    if (tokensToStore.accessToken) {
      await SecureStore.setItemAsync("accessToken", tokensToStore.accessToken);
    }
    if (tokensToStore.refreshToken) {
      await SecureStore.setItemAsync("refreshToken", tokensToStore.refreshToken);
    }
    
    // If user is null, clear SecureStore tokens
    if (!user) {
      try {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
      } catch (error) {
        console.error("Error clearing tokens in setUser:", error);
      }
    }
    
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
