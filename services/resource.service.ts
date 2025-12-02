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
  async uploadFile(
    fileUri: string,
    resourceType: "pdf" | "video" | "note",
    vaultId: string,
    resourceId: string
  ): Promise<string> {
    const formData = new FormData();
    const filename = fileUri.split("/").pop() || "file";
    const match = /\.(\w+)$/.exec(filename);

    // Determine correct MIME type based on file extension and resource type
    let mimeType = "application/octet-stream";
    if (resourceType === "video") {
      mimeType = "video/mp4";
    } else if (resourceType === "pdf") {
      mimeType = "application/pdf";
    } else if (match) {
      const ext = match[1].toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
      }
    }

    formData.append("file", {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);
    formData.append("vaultId", vaultId);
    formData.append("resourceId", resourceId);
    formData.append("type", resourceType); // Add type so multer knows where to save the file

    try {
      const response = await axiosInstance.post<
        ApiResponse<{ fileUrl: string }>
      >("/resources/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000, // 5 minutes for large file uploads
        maxContentLength: 104857600, // 100MB
        maxBodyLength: 104857600, // 100MB
      });
      return response.data.data.fileUrl;
    } catch (error: any) {
      throw error;
    }
  },

  async createResource(data: CreateResourceRequest): Promise<Resource> {
    const response = await axiosInstance.post<ApiResponse<Resource>>(
      "/resources",
      data
    );
    return response.data.data;
  },

  async getVaultResources(
    vaultId: string,
    limit = 20,
    offset = 0
  ): Promise<{ resources: Resource[]; total: number }> {
    const response = await axiosInstance.get<
      ApiResponse<{ resources: Resource[]; total: number }>
    >(`/resources/vault/${vaultId}?limit=${limit}&offset=${offset}`);
    return response.data.data;
  },

  async getResource(id: string): Promise<Resource> {
    const response = await axiosInstance.get<ApiResponse<Resource>>(
      `/resources/${id}`
    );
    return response.data.data;
  },

  async updateResource(
    id: string,
    data: UpdateResourceRequest
  ): Promise<Resource> {
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
