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

// NEW: Updated SearchResult to match new backend API
export interface SearchResult {
  answer: string;
  source: "cache" | "web" | "competitive" | "community" | "free_ai" | "paid_ai";
  qualityScore: number;
  upvotes?: number;
  tokensUsed: number;
  layer: string;
  query: string;
  answerId?: string; // For upvoting community answers
}

export interface SearchSuggestion {
  query: string;
  type: "history" | "trending" | "related";
  count?: number;
}

export interface FilterOptions {
  subjects: string[];
  grades: string[];
  languages: string[];
  areas: string[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  resultCount: number;
  answerLayer?: "cache" | "web" | "competitive" | "community" | "free_ai" | "paid_ai";
  tokensUsed: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// NEW: Community answer interfaces
export interface SubmitCommunityAnswerRequest {
  query: string;
  answer: string;
  filters?: Record<string, any>;
}

export interface SubmitCommunityAnswerResponse {
  answerId: string;
  isUpdate: boolean;
}

export interface UpvoteAnswerResponse {
  upvoted: boolean;
}

export const createSearchService = (axiosInstance: AxiosInstance) => ({
  async search(data: SearchRequest): Promise<SearchResult> {
    try {
      const response = await axiosInstance.post<ApiResponse<SearchResult>>(
        "/search",
        data
      );
      return response.data.data;
    } catch (error: any) {
      console.error("SearchService error:", error.response?.data || error.message);
      throw error;
    }
  },

  async getSearchHistory(limit: number = 20): Promise<SearchHistoryItem[]> {
    const response = await axiosInstance.get<ApiResponse<SearchHistoryItem[]>>(
      `/search/history?limit=${limit}`
    );
    return response.data.data;
  },

  async getSuggestions(
    query: string,
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<SearchSuggestion[]>>(
        `/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return [];
    }
  },

  async getFilterOptions(): Promise<FilterOptions> {
    const response = await axiosInstance.get<ApiResponse<FilterOptions>>(
      "/search/filter-options"
    );
    return response.data.data;
  },

  // NEW: Community answer methods
  async submitCommunityAnswer(
    data: SubmitCommunityAnswerRequest
  ): Promise<SubmitCommunityAnswerResponse> {
    const response = await axiosInstance.post<
      ApiResponse<SubmitCommunityAnswerResponse>
    >("/search/community/answer", data);
    return response.data.data;
  },

  async upvoteAnswer(answerId: string): Promise<UpvoteAnswerResponse> {
    const response = await axiosInstance.post<ApiResponse<UpvoteAnswerResponse>>(
      `/search/community/answer/${answerId}/upvote`
    );
    return response.data.data;
  },
});
