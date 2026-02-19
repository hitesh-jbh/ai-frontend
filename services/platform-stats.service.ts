import { AxiosInstance } from "axios";

export interface PlatformStats {
  creators: number;
  vaults: number;
  searches: number;
  paid: number; // Total earnings (INR) across all wallets
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createPlatformStatsService = (axiosInstance: AxiosInstance) => ({
  async getPlatformStats(): Promise<PlatformStats> {
    const response = await axiosInstance.get<ApiResponse<PlatformStats>>(
      "/platform-stats"
    );
    return response.data.data;
  },
});

/**
 * Format a number for display (e.g. 1234 -> "1.2K", 50000 -> "50K+", 1500000 -> "1.5M+")
 */
export function formatStatValue(
  value: number,
  options?: { suffix?: string; compact?: boolean }
): string {
  const { suffix = "+", compact = true } = options ?? {};
  if (!Number.isFinite(value) || value < 0) return "0";
  if (!compact) return value.toLocaleString();
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m >= 1 ? `${m % 1 === 0 ? m : m.toFixed(1)}M${suffix}` : `${value.toLocaleString()}${suffix}`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return k >= 1 ? `${k % 1 === 0 ? k : k.toFixed(1)}K${suffix}` : `${value}${suffix}`;
  }
  return `${value}${suffix}`;
}

/**
 * Format paid amount (INR) for display - e.g. ₹1.2L, ₹5M+
 */
export function formatPaidValue(amountInr: number): string {
  if (!Number.isFinite(amountInr) || amountInr < 0) return "₹0";
  if (amountInr >= 1_00_00_000) {
    const m = amountInr / 1_00_00_000;
    return `₹${m % 1 === 0 ? m : m.toFixed(1)}M+`;
  }
  if (amountInr >= 1_00_000) {
    const l = amountInr / 1_00_000;
    return `₹${l % 1 === 0 ? l : l.toFixed(1)}L+`;
  }
  if (amountInr >= 1_000) {
    const k = amountInr / 1_000;
    return `₹${k % 1 === 0 ? k : k.toFixed(1)}K+`;
  }
  return `₹${Math.round(amountInr)}`;
}
