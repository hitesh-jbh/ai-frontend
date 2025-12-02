import { AxiosInstance } from "axios";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  profilePicture?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
}

export interface UserRankResponse {
  entry: LeaderboardEntry | null;
  totalUsers: number;
}

export const createLeaderboardService = (axiosInstance: AxiosInstance) => ({
  async getTopUsers(
    limit: number = 20,
    offset: number = 0,
    period: "all" | "daily" | "weekly" | "monthly" = "all"
  ): Promise<LeaderboardResponse> {
    const response = await axiosInstance.get<ApiResponse<LeaderboardResponse>>(
      `/leaderboard/top?limit=${limit}&offset=${offset}&period=${period}`
    );
    return response.data.data;
  },

  async getUserRank(
    period: "all" | "daily" | "weekly" | "monthly" = "all"
  ): Promise<UserRankResponse> {
    const response = await axiosInstance.get<ApiResponse<UserRankResponse>>(
      `/leaderboard/rank?period=${period}`
    );
    return response.data.data;
  },
});
