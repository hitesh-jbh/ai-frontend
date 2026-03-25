import { AxiosInstance } from "axios";

export interface SearchFilters {
  subject?: string;
  grade?: string;
  area?: string;
  language?: string;
  type?: "pdf" | "video" | "note" | "link";
  tags?: string[];
}

export type AiPreference = "short" | "medium" | "deep_search";

export interface SearchRequest {
  query: string;
  threadId: string;
  filters?: SearchFilters;
  aiPreference?: AiPreference;
  limit?: number;
  offset?: number;
  name?: string;
  email?: string;
  number?: string;
}

export interface CreateThreadResponse {
  threadId: string;
}

export interface ThreadListItem {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  total: number
}

export interface ThreadMessage {
  role: "user" | "assistant";
  content: string;
  source?: string;
  qualityScore?: number;
  tokensUsed?: number;
  answerId?: string;
  answerUserId?: string;
  communityAnswers?: any[];
  matchedResources?: any[];
}

export interface ThreadWithMessages {
  id: string;
  userId: string;
  title: string | null;
  createdAt: string;
  messages?: ThreadMessage[];
}

// NEW: Updated SearchResult to match new backend API
export interface SearchResult {
  answer: string; // Primary answer (for backward compatibility)
  source: "vault" | "cache" | "web" | "competitive" | "community" | "free_ai" | "paid_ai";
  qualityScore: number;
  upvotes?: number;
  tokensUsed: number;
  layer: string;
  query: string;
  answerId?: string; // For upvoting community answers (primary answer)
  answerUserId?: string | null; // User ID of the answer creator (to check if current user is owner)
  webResults?: { title: string; snippet: string; url: string }[]; // For competitive layer: top 3 raw web results
  vaultId?: string;
  resourceId?: string;
  matchedResources?: {
    // For community layer: matched vault resources
    id: string;
    title: string;
    type: "pdf" | "video" | "note" | "link";
    fileUrl?: string;
    userId: string;
    vaultId: string;
    views?: number; // View count as proxy for likes/popularity
  }[];
  communityAnswers?: {
    // All community answers for the query
    answer: string;
    answerId: string;
    answerUserId: string;
    upvotes: number;
    qualityScore: number;
  }[];

  vaultContributions?: {
    vaultId: string;
    resourceId: string;
    answer: string;
    weight: number;
    ownerId: string;
  }[];
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
  async createThread(): Promise<CreateThreadResponse> {
    const response = await axiosInstance.post<ApiResponse<CreateThreadResponse>>(
      "/threads/new",
      {}
    );
    return response.data.data;
  },

  async getAllThreads(limit = 50, offset = 0): Promise<ThreadListItem[]> {
    const response = await axiosInstance.get<{ success: boolean; data: ThreadListItem[] }>(
      `/threads?limit=${limit}&offset=${offset}`
    );
    return response.data.data ?? [];
  },

  async getThreadById(threadId: string): Promise<ThreadWithMessages> {
    const response = await axiosInstance.get<ApiResponse<ThreadWithMessages>>(
      `/threads/${threadId}`
    );
    return response.data.data;
  },

  async search(data: SearchRequest): Promise<SearchResult> {
    try {
      // Map deep_search to deepSearch for backend compatibility
      const body = {
        ...data,
        aiPreference: data.aiPreference === "deep_search" ? "deepSearch" : data.aiPreference,
      };
      const response = await axiosInstance.post<ApiResponse<SearchResult>>(
        "/search",
        body
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
