import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { axiosInstance } from "../lib/axios";
import { authService } from "../services/auth.service";
import { useAuthStore } from "../store/auth-store";
import { toast } from "./use-toast";

const useAxiosPrivate = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const client = useQueryClient();

  useEffect(() => {
    // Request interceptor - add token to requests
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        // Always get the latest token from store to ensure we use the most recent one
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.accessToken) {
          config.headers.Authorization = `Bearer ${currentUser.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh on 401
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only handle 401 errors and avoid infinite retry loops
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            console.log("JWTToken expired");

            // Don't clear query client here - we might succeed in refreshing
            const { data, status } = await authService.refreshToken();

            console.log("Token refresh response:", {
              status,
              hasToken: !!data?.accessToken,
            });

            if (status === 400 || status === 401 || !data?.accessToken) {
              throw new Error("Session expired - refresh token invalid");
            }

            // Get current user state to preserve all user data
            const currentUser = useAuthStore.getState().user;

            // Update user with new tokens - preserve all user data
            if (currentUser) {
              const updatedUser = {
                ...currentUser,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
              };
              // setUser will persist tokens to SecureStore
              await setUser(updatedUser);
              console.log("User tokens updated successfully");
            } else {
              console.warn("No user in store when refreshing token");
              // Still save tokens to SecureStore even if no user in store (SecureStore not available on web)
              if (Platform.OS !== "web") {
                const SecureStoreModule = await import("expo-secure-store");
                const SecureStore =
                  SecureStoreModule.default ?? SecureStoreModule;
                if (SecureStore?.setItemAsync) {
                  await SecureStore.setItemAsync(
                    "accessToken",
                    data.accessToken
                  );
                  await SecureStore.setItemAsync(
                    "refreshToken",
                    data.refreshToken
                  );
                }
              }
            }

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

            // Retry the original request with new token
            console.log("Retrying original request with new token");
            return axiosInstance(originalRequest);
          } catch (err: any) {
            console.error("Token refresh failed:", err);

            // Only clear and logout if refresh actually failed
            client.clear();

            // Clear SecureStore tokens and reset user state
            const authStore = useAuthStore.getState();
            await authStore.resetUser();

            toast({
              title: "Session expired, please login again",
              variant: "destructive",
            });

            // Navigate to login
            router.replace("/(auth)/login");
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - we get fresh state from store in the interceptors

  return axiosInstance;
};

export default useAxiosPrivate;
