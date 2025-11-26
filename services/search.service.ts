import { AxiosInstance } from "axios";

export interface SearchFilters {
  subject?: string;
  grade?: string;
  area?: string;
  language?: string;
  type?: "pdf" | "video" | "note" | "link";
  tags?: string[];
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: "pdf" | "video" | "note" | "link";
  subject?: string;
  grade?: string;
  area?: string;
  language?: string;
  tags?: string[];
  url?: string;
  createdAt: string;
}

export interface SearchResult {
  resources: Resource[];
  total: number;
  query: string;
  refinedQuery?: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  resultCount: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const createSearchService = (axiosInstance: AxiosInstance) => ({
  async search(data: SearchRequest): Promise<SearchResult> {
    const response = await axiosInstance.post<ApiResponse<SearchResult>>(
      "/search",
      data
    );
    return response.data.data;
  },

  async getSearchHistory(limit: number = 20): Promise<SearchHistoryItem[]> {
    const response = await axiosInstance.get<ApiResponse<SearchHistoryItem[]>>(
      `/search/history?limit=${limit}`
    );
    return response.data.data;
  },
});
