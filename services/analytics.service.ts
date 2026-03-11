import { AxiosInstance } from "axios";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AnalyticsDataPoint {
  name: string;
  value: number;
}

export const createAnalyticsService = (axiosInstance: AxiosInstance) => ({
  async getTopCreatorsForChart(
    limit: number = 5,
    period: "all" | "daily" | "weekly" | "monthly" = "all"
  ): Promise<AnalyticsDataPoint[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<{ entries: any[]; total: number }>>(
        `/leaderboard/top?limit=${limit}&offset=0&period=${period}`
      );
      
      // Transform leaderboard entries to chart data points
      return response.data.data.entries.map((entry) => ({
        name: entry.userName,
        value: entry.score,
      }));
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      return [];
    }
  },
});

