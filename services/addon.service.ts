import { AxiosInstance } from "axios";

export interface AddonUsage {
  subscription: { queriesRemaining: number; tokensRemaining: number };
  addon: { queriesRemaining: number; tokensRemaining: number };
  spaceExtension: { storageRemainingGb: number };
}

export interface AddonPack {
  id: string;
  extraQueries: number;
  extraTokens: number;
  queriesUsed: number;
  tokensUsed: number;
  expiresAt: string;
  createdAt: string;
}

export interface AddonCreateOrderResponse {
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    createdAt: string;
  };
  keyId: string;
  product: {
    name: string;
    price: number;
    currency: string;
    extraQueries?: number;
    extraTokens?: number;
    validityHours?: number;
    storageGb?: number;
    yearly?: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createAddonService = (axiosInstance: AxiosInstance) => ({
  /**
   * Get available usage (subscription + addon remaining)
   */
  async getUsage(): Promise<AddonUsage> {
    const response = await axiosInstance.get<ApiResponse<AddonUsage>>("/addons/usage");
    return response.data.data;
  },

  /**
   * Create Razorpay order for Recharge Pack (₹49) or Space Extension (₹99/1GB or ₹499/15GB)
   */
  async createOrder(body?: {
    product?: "recharge_pack" | "space_extension_per_gb" | "space_extension_yearly";
  }): Promise<AddonCreateOrderResponse> {
    const response = await axiosInstance.post<ApiResponse<AddonCreateOrderResponse>>(
      "/addons/create-order",
      body ?? {}
    );
    return response.data.data;
  },

  /**
   * Verify payment and activate Recharge Pack
   */
  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<AddonPack> {
    const response = await axiosInstance.post<ApiResponse<AddonPack>>(
      "/addons/verify-payment",
      data
    );
    return response.data.data;
  },

  /**
   * Create Recharge Pack without payment (testing only)
   */
  async recharge(): Promise<AddonPack> {
    const response = await axiosInstance.post<ApiResponse<AddonPack>>(
      "/addons/recharge",
      {}
    );
    return response.data.data;
  },
});
