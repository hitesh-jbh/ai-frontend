import { AxiosInstance } from "axios";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  score: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createLeaderboardService = (axiosInstance: AxiosInstance) => ({
  async getTopUsers(limit: number = 10): Promise<LeaderboardEntry[]> {
    const response = await axiosInstance.get<ApiResponse<LeaderboardEntry[]>>(
      `/leaderboard/top?limit=${limit}`
    );
    return response.data.data;
  },

  async getUserRank(): Promise<LeaderboardEntry | null> {
    const response = await axiosInstance.get<ApiResponse<LeaderboardEntry>>(
      "/leaderboard/rank"
    );
    return response.data.data;
  },
});
