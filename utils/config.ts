import Constants from "expo-constants";

/**
 * Gets the API base URL from environment configuration
 * Works in both dev and prod environments
 */
export const getApiUrl = (): string => {
  // First, try to get from expo config extra or env
  const envUrl =
    Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

  if (!envUrl) {
    throw new Error("API_URL is not defined");
  }
  return envUrl;
};

/**
 * Gets the base URL (without /api suffix) for file serving
 */
export const getBaseUrl = (): string => {
  const apiUrl = getApiUrl();
  // Remove /api suffix if present
  return apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
};
