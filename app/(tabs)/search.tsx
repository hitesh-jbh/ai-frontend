import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SearchBar } from "../../components/ui/SearchBar";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { useSubscriptionStore } from "../../store/subscription-store";
import { SearchResult } from "../../services/search.service";
import { Ionicons } from "@expo/vector-icons";
import {
  showInfoToast,
  showErrorToast,
  showSuccessToast,
} from "../../utils/toast";

export default function Search() {
  const params = useLocalSearchParams<{ query?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.query || "");
  const [debouncedQuery, setDebouncedQuery] = useState(params.query || "");
  const [showSubmitAnswer, setShowSubmitAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const { search, subscription } = useServices();
  const queryClient = useQueryClient();
  const { subscriptionStatus, setSubscriptionStatus } = useSubscriptionStore();

  // Fetch subscription status on mount
  const { data: currentStatus, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscriptionStatus"],
    queryFn: () => subscription.getCurrentStatus(),
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
  });

  // Update store when status is fetched
  useEffect(() => {
    if (currentStatus) {
      setSubscriptionStatus(currentStatus);
    }
  }, [currentStatus, setSubscriptionStatus]);

  // Check subscription status when component mounts or updates
  useEffect(() => {
    if (!currentStatus) return;

    const subscription = currentStatus.subscription;

    // Check if no subscription
    if (!currentStatus.hasSubscription || !subscription) {
      showInfoToast(
        "Subscription Required",
        "You need an active subscription to search. Please choose a plan to continue."
      );
      setTimeout(() => {
        router.push("/(tabs)/manage-subscriptions" as any);
      }, 1500);
      return;
    }

    // Check if subscription is expired
    if (subscription.expiresAt) {
      const expiresAt = new Date(subscription.expiresAt);
      const now = new Date();
      if (expiresAt < now) {
        showErrorToast(
          "Subscription Expired",
          "Your subscription has expired. Please renew or choose a new plan to continue searching."
        );
        setTimeout(() => {
          router.push("/(tabs)/manage-subscriptions" as any);
        }, 2000);
        return;
      }
    }

    // Check if subscription is exhausted (queries or tokens limit reached)
    // Only check if canSearch is false (meaning limit is reached)
    if (!currentStatus.canSearch) {
      const isQueriesExhausted =
        subscription.queriesUsedToday >= subscription.dailyQueriesLimit;
      const isTokensExhausted =
        subscription.tokensUsedToday >= subscription.dailyTokensLimit;

      let message = "Your daily limit has been reached. ";
      if (isQueriesExhausted && isTokensExhausted) {
        message += "You've used all your queries and tokens for today.";
      } else if (isQueriesExhausted) {
        message += `You've used all ${subscription.dailyQueriesLimit} queries for today.`;
      } else {
        message += `You've used all ${subscription.dailyTokensLimit.toLocaleString()} tokens for today.`;
      }
      message += " Please upgrade your plan or wait for the limit to reset tomorrow.";

      showErrorToast("Daily Limit Reached", message);
      setTimeout(() => {
        router.push("/(tabs)/manage-subscriptions" as any);
      }, 2000);
      return;
    }
  }, [currentStatus]);

  // Update search query when params change - only once
  useEffect(() => {
    if (
      params.query !== undefined &&
      params.query.trim() !== searchQuery.trim()
    ) {
      setSearchQuery(params.query.trim());
      setDebouncedQuery(params.query.trim());
    }
  }, [params.query]); // Only depend on params.query, not searchQuery to avoid loops

  // Debounce search query - 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use memoized active query to prevent unnecessary re-renders
  const activeQuery = useMemo(() => {
    return debouncedQuery.trim();
  }, [debouncedQuery]);

  // Fetch search history
  const { data: searchHistory } = useQuery({
    queryKey: ["searchHistory"],
    queryFn: () => search.getSearchHistory(10),
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch search results - only trigger when activeQuery changes (after debounce)
  const {
    data: searchResult,
    isLoading,
    error,
    refetch,
  } = useQuery<SearchResult>({
    queryKey: ["search", activeQuery],
    queryFn: async () => {
      if (!activeQuery) {
        throw new Error("Query is required");
      }
      return search.search({
        query: activeQuery,
        limit: 20,
        offset: 0,
      });
    },
    enabled: activeQuery.length > 0 && currentStatus?.hasSubscription === true,
    retry: 1,
    staleTime: 30000, // Cache results for 30 seconds to prevent duplicate calls
  });

  // Invalidate subscription status after successful search to update usage
  useEffect(() => {
    if (searchResult) {
      queryClient.invalidateQueries({
        queryKey: ["subscriptionStatus"],
      });
    }
  }, [searchResult, queryClient]);

  // Handle search errors
  useEffect(() => {
    if (error) {
      const errorAny = error as any;
      // Handle subscription-related errors
      if (errorAny?.response?.status === 402) {
        // No subscription
        showInfoToast(
          "Hold on!",
          errorAny?.response?.data?.message ||
            "To continue, please choose a plan.."
        );
        // Navigate after a short delay
        setTimeout(() => {
          router.push("/(tabs)/manage-subscriptions");
        }, 1500);
      } else if (errorAny?.response?.status === 429) {
        // Limit reached
        showErrorToast(
          "Daily Limit Reached",
          errorAny?.response?.data?.message ||
            "You've reached your daily query limit. Please upgrade your plan or wait for the limit to reset."
        );
        // Refresh subscription status
        refetchSubscription();
        // Navigate after a short delay
        setTimeout(() => {
          router.push("/(tabs)/manage-subscriptions");
        }, 2000);
      }
    }
  }, [error, refetchSubscription]);

  // Submit community answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: (answer: string) =>
      search.submitCommunityAnswer({
        query: activeQuery,
        answer,
      }),
    onSuccess: (data: any) => {
      setShowSubmitAnswer(false);
      setUserAnswer("");
      queryClient.invalidateQueries({ queryKey: ["search", activeQuery] });

      // Show toast based on whether it was an update or new submission
      if (data?.isUpdate) {
        showSuccessToast(
          "Success",
          "Your answer has been updated successfully!"
        );
      } else {
        showSuccessToast("Thank you!", "Your answer has been submitted.");
      }
    },
  });

  // Upvote answer mutation
  const upvoteMutation = useMutation({
    mutationFn: (answerId: string) => search.upvoteAnswer(answerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", activeQuery] });
    },
  });

  const handleSuggestionSelect = (suggestion: string) => {
    const trimmed = suggestion.trim();
    if (trimmed) {
      setSearchQuery(trimmed);
      // Debounce will handle the search automatically
    }
  };

  const handleHistorySelect = (historyItem: { query: string }) => {
    setSearchQuery(historyItem.query);
    // Debounce will handle the search automatically
  };

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      cache: "bg-green-100 text-green-700",
      competitive: "bg-blue-100 text-blue-700",
      community: "bg-purple-100 text-purple-700",
      paid_ai: "bg-orange-100 text-orange-700",
      web: "bg-gray-100 text-gray-700",
    };
    return colors[source] || "bg-gray-100 text-gray-700";
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      cache: "Cached",
      competitive: "AI-Free Answer",
      community: "Community",
      paid_ai: "AI Generated",
      web: "Web Search",
    };
    return labels[source] || source;
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Search" showBackButton />
      <View className="px-6 pb-4 border-b border-gray-200">
        <View className="mt-2">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSuggestionSelect={handleSuggestionSelect}
            placeholder="Ask a question..."
            showSuggestions={true}
          />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-4">
        {isLoading && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 text-sm font-outfit-regular mt-4">
              Searching...
            </Text>
          </View>
        )}

        {error && (
          <View className="items-center justify-center py-20">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
              Search failed
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Please try again
            </Text>
          </View>
        )}

        {searchResult && !isLoading && (
          <View className="mt-4">
            {/* Source Badge */}
            <View className="flex-row items-center justify-between mb-3">
              <View
                className={`rounded-full px-3 py-1.5 ${getSourceBadgeColor(
                  searchResult.source
                )}`}
              >
                <Text
                  className={`text-xs font-outfit-semi-bold ${
                    getSourceBadgeColor(searchResult.source).split(" ")[1] ||
                    "text-gray-700"
                  }`}
                >
                  {getSourceLabel(searchResult.source)}
                </Text>
              </View>
              {searchResult.qualityScore > 0 && (
                <View className="flex-row items-center">
                  <Ionicons name="star" size={18} color="#F59E0B" />
                  <Text className="text-gray-700 text-sm font-outfit-semi-bold ml-1">
                    {Math.round(searchResult.qualityScore * 100)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Answer Text - Better formatted */}
            <View className="bg-gray-50 rounded-2xl p-5 mb-4">
              <Text className="text-gray-900 text-lg font-outfit-regular leading-7">
                {searchResult.answer}
              </Text>
            </View>

            {/* Metadata - Cleaner */}
            <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <View className="flex-row items-center gap-4">
                {searchResult.upvotes !== undefined &&
                  searchResult.upvotes > 0 && (
                    <View className="flex-row items-center">
                      <Ionicons name="thumbs-up" size={18} color="#6B7280" />
                      <Text className="text-gray-700 text-sm font-outfit-regular ml-1">
                        {searchResult.upvotes} upvotes
                      </Text>
                    </View>
                  )}
                {searchResult.tokensUsed > 0 && (
                  <View className="flex-row items-center">
                    <Ionicons name="flash" size={16} color="#6B7280" />
                    <Text className="text-gray-600 text-xs font-outfit-regular ml-1">
                      {searchResult.tokensUsed} tokens
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              {searchResult.source === "community" && searchResult.answerId && (
                <TouchableOpacity
                  className="flex-1 bg-purple-500 rounded-xl py-3.5 items-center shadow-sm"
                  onPress={() => {
                    upvoteMutation.mutate(searchResult.answerId!);
                  }}
                  disabled={upvoteMutation.isPending}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="thumbs-up" size={20} color="#FFFFFF" />
                    <Text className="text-white text-base font-outfit-semi-bold ml-2">
                      {upvoteMutation.isPending ? "..." : "Upvote"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-xl py-3.5 items-center shadow-sm"
                onPress={() => setShowSubmitAnswer(true)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                  <Text className="text-white text-base font-outfit-semi-bold ml-2">
                    Contribute Answer
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Help Text */}
            <View className="mt-4 p-3 bg-blue-50 rounded-xl justify-center gap-2">
              <Text className="font-outfit-semi-bold text-blue-800 text-base">
                💡 Contribute Answer:
              </Text>
              <Text className="text-blue-800 text-sm font-outfit-regular pl-5">
                Share your knowledge! Your answer can help others and may appear
                in future searches.
              </Text>
            </View>
          </View>
        )}

        {/* Show subscription required message */}
        {currentStatus && !currentStatus.hasSubscription && (
          <View className="items-center justify-center py-20 px-4">
            <Ionicons name="card-outline" size={64} color="#3B82F6" />
            <Text className="text-gray-900 text-xl font-outfit-bold mt-6 text-center">
              Hold on!
            </Text>
            <Text className="text-gray-600 text-base font-outfit-regular mt-3 text-center">
              To continue, please choose a plan.
            </Text>
            <TouchableOpacity
              className="bg-blue-500 rounded-xl py-4 px-8 mt-6"
              onPress={() => router.push("/(tabs)/manage-subscriptions")}
              activeOpacity={0.7}
            >
              <Text className="text-white text-base font-outfit-semi-bold">
                Choose a Plan
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show search history when no query or when typing */}
        {!activeQuery && !isLoading && currentStatus?.hasSubscription && (
          <View>
            {searchHistory && searchHistory.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-gray-900 text-lg font-outfit-semi-bold">
                    Recent Searches
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                </View>
                <View>
                  {searchHistory.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      className={`bg-gray-50 rounded-xl p-4 flex-row items-center justify-between ${
                        index > 0 ? "mt-2" : ""
                      }`}
                      onPress={() => handleHistorySelect(item)}
                      activeOpacity={0.7}
                    >
                      <View className="flex-1">
                        <Text className="text-gray-900 text-base font-outfit-regular">
                          {item.query}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          {item.resultCount > 0 && (
                            <Text className="text-gray-500 text-xs font-outfit-regular mr-3">
                              {item.resultCount} results
                            </Text>
                          )}
                          <Text className="text-gray-400 text-xs font-outfit-regular">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {(!searchHistory || searchHistory.length === 0) && (
              <View className="items-center justify-center py-20">
                <Ionicons name="search" size={48} color="#9CA3AF" />
                <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
                  Start searching
                </Text>
                <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
                  Enter a question to get an AI-powered answer
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Submit Answer Modal */}
      <Modal
        visible={showSubmitAnswer}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSubmitAnswer(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setShowSubmitAnswer(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 500 }}
          >
            <View className="bg-white rounded-2xl shadow-2xl">
              {/* Header */}
              <View className="p-6 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 text-xl font-outfit-bold">
                    Contribute Answer
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowSubmitAnswer(false);
                      setUserAnswer("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Content with KeyboardAwareScrollView */}
              <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                // bottomOffset={20}
              >
                <View className="p-6">
                  <View className="mb-4">
                    <Text className="text-gray-700 text-sm font-outfit-regular mb-2">
                      Question: {searchQuery}
                    </Text>
                    <Text className="text-gray-900 text-base font-outfit-semi-bold mb-3">
                      Your Answer
                    </Text>
                    <TextInput
                      multiline
                      numberOfLines={8}
                      value={userAnswer}
                      textAlignVertical="top"
                      onChangeText={setUserAnswer}
                      placeholderTextColor="#9CA3AF"
                      placeholder="Enter your answer here..."
                      className="border border-gray-300 rounded-lg p-4 min-h-[200px] text-gray-900 text-base font-outfit-regular"
                    />
                  </View>

                  <TouchableOpacity
                    className="bg-blue-500 rounded-lg py-4 items-center"
                    onPress={() => {
                      if (userAnswer.trim().length >= 10) {
                        submitAnswerMutation.mutate(userAnswer);
                      } else {
                        showErrorToast(
                          "Validation Error",
                          "Answer must be at least 10 characters long"
                        );
                      }
                    }}
                    disabled={submitAnswerMutation.isPending}
                    activeOpacity={0.7}
                  >
                    {submitAnswerMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white text-base font-outfit-semi-bold">
                        Submit Answer
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAwareScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
