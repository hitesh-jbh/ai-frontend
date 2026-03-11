import { getBaseUrl } from "./config";

/**
 * Normalizes image URLs to ensure they use the correct base URL
 * - Replaces localhost URLs with the configured base URL (for backward compatibility)
 * - Handles relative URLs by making them absolute
 * - Works in both dev and prod environments
 */
export const normalizeImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;

  // If URL contains localhost, replace it with the correct base URL
  // This handles old URLs in the database that might have localhost
  if (url.includes("localhost:8080")) {
    const baseUrl = getBaseUrl();
    
    // Replace localhost:8080 (both http and https) with the correct base URL
    const normalizedUrl = url.replace(
      /https?:\/\/localhost:8080/g,
      baseUrl
    );
    
    return normalizedUrl;
  }

  // Return URL as-is if it's already a valid absolute URL
  return url;
};

