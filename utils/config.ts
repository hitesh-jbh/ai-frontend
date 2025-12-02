import Constants from "expo-constants";

/**
 * Gets the API base URL from environment configuration
 * Works in both dev and prod environments
 */
export const getApiUrl = (): string => {
  // First, try to get from expo config extra or env
  const envUrl =
    Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    return envUrl;
  }

  // Fallback defaults (should not be reached if env is properly configured)
  return __DEV__
    ? "http://localhost:8080/api" // Development default
    : "http://localhost:8080/api"; // Production default (should be overridden)
};

/**
 * Gets the base URL (without /api suffix) for file serving
 */
export const getBaseUrl = (): string => {
  const apiUrl = getApiUrl();
  // Remove /api suffix if present
  return apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
};

