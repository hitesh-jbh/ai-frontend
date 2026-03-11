import { AxiosInstance } from "axios";

export interface Subscription {
  id: string;
  userId: string;
  planId: string | null;
  plan: "free" | "smart" | "pro" | "creator";
  status: "active" | "expired" | "cancelled";
  dailyQueriesLimit: number;
  dailyTokensLimit: number;
  queriesUsedToday: number;
  tokensUsedToday: number;
  lastResetDate: string;
  startsAt: string;
  expiresAt: string | null;
  price: string;
  paymentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  planType: "free" | "smart" | "pro" | "creator";
  name: string;
  description: string | null;
  dailyQueriesLimit: number;
  dailyTokensLimit: number;
  price: string;
  currency: string;
  status: "active" | "deleted";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: Subscription | null;
  canSearch: boolean;
  usage?: {
    queriesUsedToday: number;
    dailyQueriesLimit: number;
    tokensUsedToday: number;
    dailyTokensLimit: number;
  };
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateOrderResponse {
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    createdAt: string;
  };
  keyId: string;
  plan: {
    id: string;
    planType: string;
    name: string;
    price: string;
    currency: string;
  };
}

export const createSubscriptionService = (axiosInstance: AxiosInstance) => ({
  /**
   * Get current subscription status
   */
  async getCurrentStatus(): Promise<SubscriptionStatus> {
    const response = await axiosInstance.get<ApiResponse<SubscriptionStatus>>(
      "/subscriptions/current/status"
    );
    return response.data.data;
  },

  /**
   * Get all available subscription plans with pagination
   */
  async getPlans(page: number = 1, limit: number = 10): Promise<{
    plans: SubscriptionPlan[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await axiosInstance.get<{
      success: boolean;
      message: string;
      data: SubscriptionPlan[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/subscription-plans?page=${page}&limit=${limit}`);
    
    // Handle paginated response
    if (Array.isArray(response.data.data) && response.data.pagination) {
      return {
        plans: response.data.data,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
      };
    }
    
    return {
      plans: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  },

  /**
   * Create or update free subscription
   */
  async createFreeSubscription(): Promise<Subscription> {
    const response = await axiosInstance.post<ApiResponse<Subscription>>(
      "/subscriptions/free"
    );
    return response.data.data;
  },

  /**
   * Create Razorpay order for paid subscription
   */
  async createOrder(planId: string): Promise<CreateOrderResponse> {
    const response = await axiosInstance.post<ApiResponse<CreateOrderResponse>>(
      "/payments/create-order",
      { planId }
    );
    return response.data.data;
  },

  /**
   * Verify payment and activate subscription
   */
  async verifyPayment(data: {
    planId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<Subscription> {
    const response = await axiosInstance.post<ApiResponse<Subscription>>(
      "/payments/verify",
      data
    );
    return response.data.data;
  },

  /**
   * Create subscription plan (admin only)
   */
  async createPlan(data: {
    planType: "free" | "smart" | "pro" | "creator";
    name: string;
    description?: string;
    dailyQueriesLimit: number;
    dailyTokensLimit: number;
    price: string;
    currency?: string;
  }): Promise<SubscriptionPlan> {
    const response = await axiosInstance.post<ApiResponse<SubscriptionPlan>>(
      "/subscription-plans",
      data
    );
    return response.data.data;
  },

  /**
   * Update subscription plan (admin only)
   */
  async updatePlan(
    id: string,
    data: {
      name?: string;
      description?: string;
      dailyQueriesLimit?: number;
      dailyTokensLimit?: number;
      price?: string;
      currency?: string;
      status?: "active" | "deleted";
      isActive?: boolean;
    }
  ): Promise<SubscriptionPlan> {
    const response = await axiosInstance.put<ApiResponse<SubscriptionPlan>>(
      `/subscription-plans/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete subscription plan (admin only, soft delete)
   */
  async deletePlan(id: string): Promise<SubscriptionPlan> {
    const response = await axiosInstance.delete<ApiResponse<SubscriptionPlan>>(
      `/subscription-plans/${id}`
    );
    return response.data.data;
  },
});

