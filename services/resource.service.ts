import { AxiosInstance } from "axios";

export interface CreateResourceRequest {
  vaultId: string;
  type: "pdf" | "video" | "note" | "link";
  title: string;
  fileUrl?: string;
  tags?: string[];
  subject?: string;
  grade?: string;
  area?: string;
  language?: string;
}

export interface UpdateResourceRequest {
  title?: string;
  fileUrl?: string;
  tags?: string[];
  subject?: string;
  grade?: string;
  area?: string;
  language?: string;
}

export interface Resource {
  id: string;
  vaultId: string;
  userId: string;
  type: "pdf" | "video" | "note" | "link";
  fileUrl?: string;
  title: string;
  tags: string[];
  subject?: string;
  grade?: string;
  area?: string;
  language?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createResourceService = (axiosInstance: AxiosInstance) => ({
  async uploadFile(fileUri: string, resourceType: "pdf" | "video" | "note"): Promise<string> {
    const formData = new FormData();
    const filename = fileUri.split("/").pop() || "file";
    const match = /\.(\w+)$/.exec(filename);
    const mimeType = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append("file", {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);
    formData.append("type", resourceType);

    const response = await axiosInstance.post<ApiResponse<{ fileUrl: string }>>(
      "/resources/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data.fileUrl;
  },

  async createResource(data: CreateResourceRequest): Promise<Resource> {
    const response = await axiosInstance.post<ApiResponse<Resource>>(
      "/resources",
      data
    );
    return response.data.data;
  },

  async getVaultResources(vaultId: string): Promise<Resource[]> {
    const response = await axiosInstance.get<ApiResponse<Resource[]>>(
      `/resources/vault/${vaultId}`
    );
    return response.data.data;
  },

  async getResource(id: string): Promise<Resource> {
    const response = await axiosInstance.get<ApiResponse<Resource>>(
      `/resources/${id}`
    );
    return response.data.data;
  },

  async updateResource(id: string, data: UpdateResourceRequest): Promise<Resource> {
    const response = await axiosInstance.put<ApiResponse<Resource>>(
      `/resources/${id}`,
      data
    );
    return response.data.data;
  },

  async deleteResource(id: string): Promise<void> {
    await axiosInstance.delete(`/resources/${id}`);
  },
});
