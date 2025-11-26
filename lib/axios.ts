import axios from "axios";
import Constants from "expo-constants";

// Get API URL from environment or use defaults
const getApiUrl = (): string => {
  // First, try to get from expo config extra or env
  const envUrl =
    Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl;
  }

  return __DEV__
    ? "https://r2zjcv4s-8080.inc1.devtunnels.ms/api" // Android emulator
    : "http://localhost:8080/api"; // Production (adjust as needed)
};

const API_URL = getApiUrl();

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout
});

// Create a separate axios instance for refresh token calls
// This avoids circular dependency with interceptors
export const axiosRefreshInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});
