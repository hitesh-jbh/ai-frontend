import { AxiosInstance } from "axios";

export interface CoinRedemption {
  id: string;
  userId: string;
  coins: number;
  upiId: string;
  status: "pending" | "approved" | "rejected" | "completed";
  adminNotes?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestRedemptionRequest {
  coins: number;
  upiId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createCoinRedemptionService = (axiosInstance: AxiosInstance) => ({
  async requestRedemption(data: RequestRedemptionRequest): Promise<CoinRedemption> {
    const response = await axiosInstance.post<ApiResponse<CoinRedemption>>(
      "/coin-redemptions/request",
      data
    );
    return response.data.data;
  },

  async getUserRedemptions(): Promise<CoinRedemption[]> {
    const response = await axiosInstance.get<ApiResponse<CoinRedemption[]>>(
      "/coin-redemptions/my-redemptions"
    );
    return response.data.data;
  },
});