import { AxiosInstance } from "axios";

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
  profilePicture?: string;
  upiId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createProfileService = (axiosInstance: AxiosInstance) => ({
  async getProfile() {
    const response = await axiosInstance.get<ApiResponse<any>>("/auth/profile");
    return response.data.data;
  },

  async uploadProfilePicture(fileUri: string): Promise<string> {
    const formData = new FormData();
    const filename = fileUri.split("/").pop() || "profile.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const mimeType = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append("file", {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);
    formData.append("isProfilePicture", "true");

    const response = await axiosInstance.post<ApiResponse<{ profilePicture: string }>>(
      "/auth/profile/upload-picture",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data.profilePicture;
  },

  async updateProfile(data: UpdateProfileRequest) {
    const response = await axiosInstance.put<ApiResponse<any>>(
      "/auth/profile",
      data
    );
    return response.data.data;
  },
});
