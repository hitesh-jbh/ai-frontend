import { AxiosInstance } from "axios";

export interface Reward {
  id: string;
  userId: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface UserPoints {
  totalPoints: number;
  availablePoints: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createRewardService = (axiosInstance: AxiosInstance) => ({
  async getUserRewards(): Promise<Reward[]> {
    const response = await axiosInstance.get<ApiResponse<Reward[]>>("/rewards");
    return response.data.data;
  },

  async getUserPoints(): Promise<UserPoints> {
    const response = await axiosInstance.get<ApiResponse<{ points: UserPoints }>>("/rewards/points");
    return response.data.data.points;
  },
});

