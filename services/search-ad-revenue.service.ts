import { AxiosInstance } from "axios";

export interface TrackAdRevenueRequest {
  searchQueryId?: string;
  query: string;
  searchResultSource:
    | "cache"
    | "web"
    | "competitive"
    | "community"
    | "free_ai"
    | "paid_ai"
    | "vault";
  answerId?: string; // Required if source is "community"
  adType: "rewarded" | "interstitial";
  revenue: number; // Ad revenue in INR
}

export interface AdRevenueStats {
  totalRevenue: number;
  totalCoinsEarned: number;
  totalAdEvents: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createSearchAdRevenueService = (axiosInstance: AxiosInstance) => ({
  async trackAdRevenue(data: TrackAdRevenueRequest): Promise<void> {
    await axiosInstance.post<ApiResponse<null>>(
      "/search-ad-revenue/track",
      data
    );
  },

  async getAdRevenueStats(): Promise<AdRevenueStats> {
    const response = await axiosInstance.get<ApiResponse<AdRevenueStats>>(
      "/search-ad-revenue/stats"
    );
    return response.data.data;
  },
});
