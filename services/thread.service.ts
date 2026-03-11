import { AxiosInstance } from "axios";

export interface ThreadListItem {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
}

export const createThreadService = (axiosInstance: AxiosInstance) => ({
  createThread: async (): Promise<{ data: { threadId: string } }> => {
    const response = await axiosInstance.post("/threads/new");
    return response.data;
  },

  getAllThreads: async (
    limit = 50,
    offset = 0
  ): Promise<ThreadListItem[]> => {
    const response = await axiosInstance.get(
      `/threads?limit=${limit}&offset=${offset}`
    );
    return response.data?.data ?? [];
  },

  getThreadById: async (threadId: string) => {
    const response = await axiosInstance.get(`/threads/${threadId}`);
    return response.data;
  },
});
