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

  async getSavedVaults(
    limit = 20,
    offset = 0
  ): Promise<{ vaults: Vault[]; total: number }> {
    const response = await axiosInstance.get<
      ApiResponse<{ vaults: Vault[]; total: number }>
    >(`/vaults/saved?limit=${limit}&offset=${offset}`);
    return response.data.data;
  },

  async getFollowedVaults(
    limit = 20,
    offset = 0
  ): Promise<{ vaults: Vault[]; total: number }> {
    const response = await axiosInstance.get<
      ApiResponse<{ vaults: Vault[]; total: number }>
    >(`/vaults/followed?limit=${limit}&offset=${offset}`);
    return response.data.data;
  },

  async getVault(id: string): Promise<Vault> {
    const response = await axiosInstance.get<ApiResponse<Vault>>(
      `/vaults/${id}`
    );
    return response.data.data;
  },

  /** Get vault by vaultId (for chat/display; works for any vault). */
  async getVaultById(vaultId: string): Promise<Vault> {
    const response = await axiosInstance.get<ApiResponse<Vault>>(
      `/vaults/by-id/${vaultId}`
    );
    return response.data.data;
  },

  /** Get vault by vaultId with current user's follow/save status (auth required). */
  async getVaultDetailsById(
    vaultId: string
  ): Promise<Vault & { isFollowed: boolean; isSaved: boolean }> {
    const response = await axiosInstance.get<
      ApiResponse<Vault & { isFollowed: boolean; isSaved: boolean }>
    >(`/vaults/by-id/${vaultId}/details`);
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

  async followVault(vaultId: string): Promise<void> {
    await axiosInstance.post(`/vaults/${vaultId}/follow`);
  },

  async unfollowVault(vaultId: string): Promise<void> {
    await axiosInstance.delete(`/vaults/${vaultId}/follow`);
  },

  async saveVault(vaultId: string): Promise<void> {
    await axiosInstance.post(`/vaults/${vaultId}/save`);
  },

  async unsaveVault(vaultId: string): Promise<void> {
    await axiosInstance.delete(`/vaults/${vaultId}/save`);
  },

  async reviewVault(
    vaultId: string,
    opts: { rating?: number; comment?: string }
  ): Promise<void> {
    await axiosInstance.post(`/vaults/${vaultId}/review`, {
      rating: opts.rating ?? 5,
      comment: opts.comment ?? undefined,
    });
  },
});
