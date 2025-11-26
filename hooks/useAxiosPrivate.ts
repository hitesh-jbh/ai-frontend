import { useEffect } from "react";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/auth-store";
import { authService } from "../services/auth.service";
import { toast } from "./use-toast";

const useAxiosPrivate = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const resetUser = useAuthStore((state) => state.resetUser);
  const client = useQueryClient();

  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        if (user?.accessToken) {
          config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Don't clear query client here - we might succeed in refreshing
            const { data, status } = await authService.refreshToken();

            if (status === 400 || status === 401 || !data?.accessToken) {
              throw new Error("Session expired");
            }

            // Update user with new tokens
            if (user) {
              setUser({
                ...user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
              });
            }

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

            // Retry the original request with new token
            return axiosInstance(originalRequest);
          } catch (err) {
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
  }, [user, setUser, resetUser, client]);

  return axiosInstance;
};

export default useAxiosPrivate;
