import Constants from "expo-constants";

/**
 * Gets the API base URL from environment configuration
 * Works in both dev and prod environments
 */
/** Set in .env for local dev; for EAS builds set in eas.json or Expo dashboard (Project → Environment variables). */
export const getApiUrl = (): string => {
  const envUrl =
    Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

  if (!envUrl || envUrl.includes("YOUR_BACKEND")) {
    if (__DEV__) {
      throw new Error(
        "EXPO_PUBLIC_API_URL is not set. Add it to .env (see .env.example)."
      );
    }
    // Production build without API URL: avoid crash, show config error in app
    return "https://api-url-not-configured.invalid";
  }
  return envUrl;
};

const NOT_CONFIGURED = "https://api-url-not-configured.invalid";

export const isApiUrlConfigured = (): boolean =>
  getApiUrl() !== NOT_CONFIGURED;

/**
 * Gets the base URL (without /api suffix) for file serving
 */
export const getBaseUrl = (): string => {
  const apiUrl = getApiUrl();
  // Remove /api suffix if present
  return apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
};
