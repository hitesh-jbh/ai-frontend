import axios from "axios";
import { getApiUrl } from "../utils/config";

const API_URL = getApiUrl();

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000, // 5 minutes timeout (for large file uploads)
  maxContentLength: 104857600, // 100MB max content length
  maxBodyLength: 104857600, // 100MB max body length
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
