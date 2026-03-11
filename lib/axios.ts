// lib/axios.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Update this with your actual backend URL
// For development: http://192.168.X.X:5000 (your machine's local IP)
// For production: https://your-api.com
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.29.98:5000";

// log to help debug connection issues
console.log("[axios] using base URL:", BASE_URL);

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach token
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (token) {

      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.log("[axios] 401 unauthorized for", error.config?.method, error.config?.url);
    }
    return Promise.reject(error);
  }
);

export const axiosRefreshInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});