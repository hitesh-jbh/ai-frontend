import { AxiosInstance } from "axios";

export interface Wallet {
  id: string;
  userId: string;
  totalEarnings: string;
  confirmedEarnings?: string;
  pendingEarnings?: string;
  withdrawnAmount?: string;
  availableBalance: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: "earning" | "withdrawal" | "refund";
  amount: string;
  description: string | null;
  createdAt: string;
}

export interface DailyEarnings {
  date: string;
  estimatedEarnings: number;
}

export interface Withdrawal {
  id: string;
  userId: string;
  walletId: string;
  amount: string;
  method: "upi" | "bank_transfer";
  upiId: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankName: string | null;
  accountHolderName: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  adminNotes: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestWithdrawalBody {
  amount: number;
  method: "upi" | "bank_transfer";
  upiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  accountHolderName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createWalletService = (axiosInstance: AxiosInstance) => ({
  async getWallet(): Promise<Wallet> {
    const response = await axiosInstance.get<ApiResponse<Wallet>>("/wallet");
    return response.data.data;
  },

  async getTransactions(limit = 50): Promise<WalletTransaction[]> {
    const response = await axiosInstance.get<{
      success: boolean;
      data: WalletTransaction[];
      pagination?: { total: number; page: number; limit: number; totalPages: number };
    }>("/wallet/transactions", { params: { limit } });
    const data = response.data?.data;
    return Array.isArray(data) ? data : [];
  },

  async getDailyEarnings(): Promise<DailyEarnings> {
    const response = await axiosInstance.get<ApiResponse<DailyEarnings>>(
      "/wallet/daily-earnings"
    );
    return response.data.data;
  },

  async requestWithdrawal(
    body: RequestWithdrawalBody
  ): Promise<Withdrawal> {
    const response = await axiosInstance.post<ApiResponse<Withdrawal>>(
      "/wallet/withdraw",
      body
    );
    return response.data.data;
  },

  async getWithdrawals(): Promise<Withdrawal[]> {
    const response = await axiosInstance.get<ApiResponse<Withdrawal[]>>(
      "/wallet/withdrawals"
    );
    return response.data.data;
  },
});
