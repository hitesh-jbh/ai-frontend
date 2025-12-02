import { AxiosInstance } from "axios";

export interface CreateVaultRequest {
  title: string;
  description?: string;
}

export interface UpdateVaultRequest {
  title?: string;
  description?: string;
}

export interface Vault {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  vaults?: T[];
  resources?: T[];
  total: number;
}

export const createVaultService = (axiosInstance: AxiosInstance) => ({
  async createVault(data: CreateVaultRequest): Promise<Vault> {
    const response = await axiosInstance.post<ApiResponse<Vault>>(
      "/vaults",
      data
    );
    return response.data.data;
  },

  async getUserVaults(
    limit = 20,
    offset = 0
  ): Promise<{ vaults: Vault[]; total: number }> {
    const response = await axiosInstance.get<
      ApiResponse<PaginatedResponse<Vault>>
    >(`/vaults?limit=${limit}&offset=${offset}`);
    return response.data.data;
  },

  async getVault(id: string): Promise<Vault> {
    const response = await axiosInstance.get<ApiResponse<Vault>>(
      `/vaults/${id}`
    );
    return response.data.data;
  },

  async updateVault(id: string, data: UpdateVaultRequest): Promise<Vault> {
    const response = await axiosInstance.put<ApiResponse<Vault>>(
      `/vaults/${id}`,
      data
    );
    return response.data.data;
  },

  async deleteVault(id: string): Promise<void> {
    await axiosInstance.delete(`/vaults/${id}`);
  },
});
