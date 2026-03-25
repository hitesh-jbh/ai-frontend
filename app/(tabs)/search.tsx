import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { VaultCard } from "../../components/chat/VaultCard";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { SearchBar } from "../../components/ui/SearchBar";
import { useServices } from "../../hooks/useServices";
import { SearchResult, ThreadListItem } from "../../services/search.service";
import { useAuthStore } from "../../store/auth-store";
import { useSubscriptionStore } from "../../store/subscription-store";
import { scaleFont, scaleLineHeight } from "../../utils/font-scale";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../../utils/toast";
import * as DocumentPicker from "expo-document-picker";

interface PendingAdTracking {
  query: string;
  adType: "rewarded" | "interstitial";
  revenue: number;
}

export default function Search() {
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.assets && result.assets.length > 0) {
      setResourceValue(result.assets[0].uri);
    }
  };

  const params = useLocalSearchParams<{ query?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.query || "");
  const [debouncedQuery, setDebouncedQuery] = useState(params.query || "");
  const [searchTrigger, setSearchTrigger] = useState<string | null>(
    params.query || null,
  );
  const [showSubmitAnswer, setShowSubmitAnswer] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [aiPreference, setAiPreference] = useState<"short" | "medium" | "deep_search">("medium");
  const [showThreadsModal, setShowThreadsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPreferenceMenu, setShowPreferenceMenu] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [resourceType, setResourceType] = useState<"link" | "pdf" | "video">(
    "link",
  );
  const [resourceValue, setResourceValue] = useState("");
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [pendingAdTracking, setPendingAdTracking] =
    useState<PendingAdTracking | null>(null);
  const [isUpvoted, setIsUpvoted] = useState<boolean>(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [fetchedResources, setFetchedResources] = useState<any[] | null>(null);
  const [isFetchingResources, setIsFetchingResources] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const threeDotsRef = useRef<View>(null);

  // State for follow/save of the main vault
  const [isFollowed, setIsFollowed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [savePending, setSavePending] = useState(false);

  const services = useServices();
  const { search, subscription, searchAdRevenue, vault, resource, thread } =
    services;
  const queryClient = useQueryClient();
  const { subscriptionStatus, setSubscriptionStatus } = useSubscriptionStore();
  const { user } = useAuthStore();

  // Fetch subscription status on mount
  const { data: currentStatus, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscriptionStatus", user?.id],
    queryFn: () => subscription.getCurrentStatus(),
    enabled: !!user?.id,
    staleTime: 30000,
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

    if (!currentStatus.hasSubscription || !subscription) {
      showInfoToast(
        "Subscription Required",
        "You need an active subscription to search. Please choose a plan to continue.",
      );
      setTimeout(
        () => router.push("/(tabs)/manage-subscriptions" as any),
        3000,
      );
      return;
    }

    if (
      subscription.expiresAt &&
      new Date(subscription.expiresAt) < new Date()
    ) {
      showErrorToast(
        "Subscription Expired",
        "Your subscription has expired. Please renew or choose a new plan to continue searching.",
      );
      setTimeout(
        () => router.push("/(tabs)/manage-subscriptions" as any),
        5000,
      );
      return;
    }

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
      message +=
        " Please upgrade your plan or wait for the limit to reset tomorrow.";
      showErrorToast("Daily Limit Reached", message);
      setTimeout(
        () => router.push("/(tabs)/manage-subscriptions" as any),
        5000,
      );
    }
  }, [currentStatus]);

  // Auto-focus search input
  useFocusEffect(
    React.useCallback(() => {
      if (currentStatus?.canSearch && searchInputRef.current) {
        const timer = setTimeout(() => searchInputRef.current?.focus(), 300);
        return () => clearTimeout(timer);
      }
    }, [currentStatus?.canSearch]),
  );

  // Update search query when params change
  useEffect(() => {
    if (
      params.query !== undefined &&
      params.query.trim() !== searchQuery.trim()
    ) {
      const trimmedQuery = params.query.trim();
      setSearchQuery(trimmedQuery);
      setDebouncedQuery(trimmedQuery);
      if (trimmedQuery.length > 0) setSearchTrigger(trimmedQuery);
    }
  }, [params.query]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Clear search results when input is cleared
  useEffect(() => {
    if (searchQuery.trim().length === 0 && searchTrigger)
      setSearchTrigger(null);
  }, [searchQuery, searchTrigger]);

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length === 0) return;

    if (!currentStatus?.hasSubscription) {
      showInfoToast(
        "Subscription Required",
        "You need an active subscription to search. Please choose a plan to continue.",
      );
      return;
    }

    if (!threadId) {
      try {
        const res = await search.createThread();
        setThreadId(res.threadId);

        setSearchTrigger(trimmedQuery);
      } catch (err) {
        console.log("Thread creation failed:", err);
        return;
      }
    } else {
      setSearchTrigger(trimmedQuery);
    }
  };

  const activeQuery = searchTrigger || "";

  // Create thread when first search
  useEffect(() => {
    if (
      activeQuery.length > 0 &&
      !threadId &&
      currentStatus?.hasSubscription === true
    ) {
      let cancelled = false;
      search
        .createThread()
        .then((res) => {
          if (!cancelled) setThreadId(res.threadId);
        })
        .catch((err) => console.error("Error creating thread:", err));
      return () => {
        cancelled = true;
      };
    }
  }, [activeQuery, threadId, currentStatus?.hasSubscription, search]);

  // Fetch search history
  const { data: searchHistory } = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: () => thread.getAllThreads(10, 0),
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Fetch search results
  const {
    data: searchResult,
    isLoading,
    error,
    refetch,
  } = useQuery<SearchResult, Error>({
    queryKey: ["search", activeQuery, threadId, aiPreference],
    queryFn: async () => {
      if (!activeQuery || !threadId)
        throw new Error("Query and threadId are required");
      return search.search({
        query: activeQuery,
        threadId,
        aiPreference,
        limit: 20,
        offset: 0,
      });
    },
    enabled:
      activeQuery.length > 0 &&
      !!threadId &&
      currentStatus?.hasSubscription === true &&
      !!aiPreference,
    retry: 1,
    staleTime: 30000,
  });

  // Sorted vault contributions
  const sortedVaultContributions = useMemo(() => {
    const contributions = searchResult?.vaultContributions;
    if (
      !contributions ||
      !Array.isArray(contributions) ||
      contributions.length === 0
    )
      return undefined;
    return [...contributions].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  }, [searchResult?.vaultContributions]);

  const displayResult = useMemo(() => {
    if (!searchResult) return null;

    const anyResult = searchResult as any;
    const answer =
      searchResult.answer ??
      anyResult.data?.answer ??
      anyResult.result?.answer ??
      "";

    const result = {
      ...searchResult,
      answer,
      vaultContributions:
        sortedVaultContributions ?? searchResult.vaultContributions,
    };

    return result;
  }, [searchResult, sortedVaultContributions]);

  // Safety: if we already have a result, never keep the UI stuck behind the ad/loading gate.
  useEffect(() => {
    if (searchResult && isShowingAd) setIsShowingAd(false);
  }, [searchResult, isShowingAd]);

  // Extract resourceIds
  useEffect(() => {
    if (!searchResult) {
      setResourceIds([]);
      setFetchedResources(null);
      return;
    }
    const ids: string[] = [];
    const anyResult = searchResult as any;
    if (Array.isArray(anyResult.resourceIds))
      ids.push(...anyResult.resourceIds);
    if (typeof anyResult.resourceId === "string" && anyResult.resourceId)
      ids.push(anyResult.resourceId);
    if (Array.isArray(anyResult.vaultContributions)) {
      ids.push(
        ...anyResult.vaultContributions
          .map((c: any) => c?.resourceId)
          .filter((x: any) => typeof x === "string" && x),
      );
    }
    setResourceIds([...new Set(ids)]);
    setFetchedResources(null);
  }, [searchResult]);

  // Invalidate subscription status after successful search
  useEffect(() => {
    if (searchResult) {
      queryClient.invalidateQueries({
        queryKey: ["subscriptionStatus", user?.id],
      });
    }
  }, [searchResult, queryClient, user?.id]);

  // Track ad revenue
  useEffect(() => {
    if (searchResult && pendingAdTracking && searchAdRevenue) {
      searchAdRevenue
        .trackAdRevenue({
          query: pendingAdTracking.query,
          searchResultSource: searchResult.source,
          answerId: searchResult.answerId,
          adType: pendingAdTracking.adType,
          revenue: pendingAdTracking.revenue,
        })
        .catch(() => {});
      setPendingAdTracking(null);
    }
  }, [searchResult, pendingAdTracking, searchAdRevenue]);

  // Handle search errors
  useEffect(() => {
    if (error) {
      const errorAny = error as any;
      if (errorAny?.response?.status === 402) {
        showInfoToast(
          "Hold on!",
          errorAny?.response?.data?.message ||
            "To continue, please choose a plan..",
        );
        setTimeout(() => router.push("/(tabs)/manage-subscriptions"), 1500);
      } else if (errorAny?.response?.status === 429) {
        showErrorToast(
          "Daily Limit Reached",
          errorAny?.response?.data?.message ||
            "You've reached your daily query limit. Please upgrade or wait for reset.",
        );
        refetchSubscription();
        setTimeout(() => router.push("/(tabs)/manage-subscriptions"), 2000);
      }
    }
  }, [error, refetchSubscription]);

  // Submit community answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: (answer: string) =>
      search.submitCommunityAnswer({ query: activeQuery, answer }),
    onSuccess: (data: any) => {
      setShowSubmitAnswer(false);
      setUserAnswer("");
      queryClient.invalidateQueries({
        queryKey: ["search", activeQuery, threadId],
      });
      showSuccessToast(
        "Thank you!",
        data?.isUpdate
          ? "Your answer has been updated!"
          : "Your answer has been submitted.",
      );
    },
  });

  // Fetch vault by vaultId (for description and follow/save state)
  const vaultIdFromResult = searchResult?.vaultId;
  const { data: vaultData } = useQuery({
    queryKey: ["vaultById", vaultIdFromResult],
    queryFn: () => vault.getVaultById(vaultIdFromResult!),
    enabled: !!vaultIdFromResult,
  });

  // Fetch vault details for follow/save state
  const { data: vaultDetails } = useQuery({
    queryKey: ["vaultDetails", vaultIdFromResult],
    queryFn: () => vault.getVaultDetailsById(vaultIdFromResult!),
    enabled: !!vaultIdFromResult,
    staleTime: 60000,
    retry: 1,
  });

  useEffect(() => {
    if (vaultDetails) {
      setIsFollowed(vaultDetails.isFollowed);
      setIsSaved(vaultDetails.isSaved);
    }
  }, [vaultDetails]);

  const handleFollowToggle = async () => {
    if (followPending || !vaultIdFromResult) return;
    const next = !isFollowed;
    setIsFollowed(next);
    setFollowPending(true);
    try {
      if (next) await vault.followVault(vaultIdFromResult);
      else await vault.unfollowVault(vaultIdFromResult);
    } catch {
      setIsFollowed(!next);
      showErrorToast("Error", "Failed to update follow state.");
    } finally {
      setFollowPending(false);
    }
  };

  const handleSaveToggle = async () => {
    if (savePending || !vaultIdFromResult) return;
    const next = !isSaved;
    setIsSaved(next);
    setSavePending(true);
    try {
      if (next) await vault.saveVault(vaultIdFromResult);
      else await vault.unsaveVault(vaultIdFromResult);
    } catch {
      setIsSaved(!next);
      showErrorToast("Error", "Failed to update save state.");
    } finally {
      setSavePending(false);
    }
  };

  // Upvote answer mutation
  const upvoteMutation = useMutation({
    mutationFn: (answerId: string) => search.upvoteAnswer(answerId),
    onSuccess: (data) => {
      setIsUpvoted(data.upvoted);
      queryClient.invalidateQueries({
        queryKey: ["search", activeQuery, threadId],
      });
    },
    onError: (error: any) => {
      showErrorToast(
        "Error",
        error?.response?.data?.message || "Failed to upvote answer",
      );
    },
  });

  // Reset upvote state when search result changes
  useEffect(() => {
    if (searchResult?.answerId) setIsUpvoted(false);
  }, [searchResult?.answerId]);

  const handleSuggestionSelect = (suggestion: string) => {
    const trimmed = suggestion.trim();
    if (trimmed) setSearchQuery(trimmed);
  };

  const handleHistorySelect = async (historyItem: {
    query: string;
    threadId?: string;
    title?: string;
  }) => {
    const trimmedQuery = (historyItem.query || historyItem.title || "").trim();
    if (trimmedQuery.length === 0) return;

    if (!currentStatus?.hasSubscription) {
      showInfoToast(
        "Subscription Required",
        "You need an active subscription to search. Please choose a plan to continue.",
      );
      return;
    }

    // if threadId exists → go to chat screen
    if (historyItem.threadId) {
      router.push({
        pathname: "/(tabs)/chat",
        params: { threadId: historyItem.threadId },
      });
      setShowHistoryModal(false);
      return;
    }

    setSearchQuery(trimmedQuery);

    const isFreePlan = currentStatus.subscription?.plan === "free";

    if (!isFreePlan) {
      setSearchTrigger(trimmedQuery);
      return;
    }

    setIsShowingAd(true);

    try {
      const { adMobAdManager } = await import("../../lib/admob-ad-manager");
      const adResult = await adMobAdManager.showInterstitialAd();

      setIsShowingAd(false);

      if (adResult.success && adResult.revenue != null) {
        setPendingAdTracking({
          query: trimmedQuery,
          adType: "interstitial",
          revenue: adResult.revenue,
        });
      }

      setSearchTrigger(trimmedQuery);
    } catch (error) {
      console.error("Error showing ad:", error);
      setIsShowingAd(false);
      setSearchTrigger(trimmedQuery);
    }
  };

  const getSourceBorderColor = (source: string) => {
    const colors: Record<string, string> = {
      vault: "border-indigo-300",
      cache: "border-green-300",
      competitive: "border-blue-300",
      community: "border-purple-300",
      free_ai: "border-orange-300",
      paid_ai: "border-orange-300",
      web: "border-gray-300",
    };
    return colors[source] || "border-gray-300";
  };

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      vault: "bg-indigo-100 text-indigo-700",
      cache: "bg-green-100 text-green-700",
      competitive: "bg-blue-100 text-blue-700",
      community: "bg-purple-100 text-purple-700",
      free_ai: "bg-orange-100 text-orange-700",
      paid_ai: "bg-orange-100 text-orange-700",
      web: "bg-gray-100 text-gray-700",
    };
    return colors[source] || "bg-gray-100 text-gray-700";
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      vault: "Vault",
      cache: "Cached",
      competitive: "Competitive",
      community: "Community",
      free_ai: "AI Generated",
      paid_ai: "AI Generated",
      web: "Web Search",
    };
    return labels[source] || source;
  };

  // Fetch threads when modal is open
  const { data: threads = [] } = useQuery<ThreadListItem[]>({
    queryKey: ["threads"],
    queryFn: () => search.getAllThreads(50, 0),
    enabled: showThreadsModal && !!user?.id,
    staleTime: 10000,
  });

  // Back button handling
  const handleBackPress = React.useCallback(() => {
    if (searchTrigger || threadId) {
      setSearchTrigger(null);
      setThreadId(null);
      setSearchQuery("");
      setDebouncedQuery("");
    } else {
      router.back();
    }
  }, [searchTrigger, threadId]);

  // Android hardware back
  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (searchTrigger || threadId) {
          handleBackPress();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [searchTrigger, threadId, handleBackPress]),
  );

  const handleOpenResources = React.useCallback(async () => {
    if (!resourceIds || resourceIds.length === 0) return;
    setIsFetchingResources(true);
    try {
      const results = await Promise.all(
        resourceIds.map((id) => resource.getResource(id)),
      );
      setFetchedResources(results);
      setShowResourcesModal(true);
    } catch (e: any) {
      showErrorToast("Error", e?.message || "Failed to fetch resources");
    } finally {
      setIsFetchingResources(false);
    }
  }, [resourceIds, resource]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Search"
        showBackButton
        onBackPress={handleBackPress}
        rightElement={
          <View className="flex-row items-center gap-3">
            {/* Chat icon - navigates to Chat screen */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/chat")}
              className="w-10 h-10 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#3B82F6" />
            </TouchableOpacity>

            {/* Time icon - opens search history modal */}
            <TouchableOpacity
              onPress={() => setShowHistoryModal(true)}
              className="w-10 h-10 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={22} color="#3B82F6" />
            </TouchableOpacity>

            {/* NEW: Threads icon - chatbubbles-outline (opens threads modal) */}
            <TouchableOpacity
              onPress={() => setShowThreadsModal(true)}
              className="w-10 h-10 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubbles-outline" size={22} color="#3B82F6" />
            </TouchableOpacity>

            {/* Three‑dots icon for AI preference with popup menu */}
            <View ref={threeDotsRef}>
              <TouchableOpacity
                onPress={() => setShowPreferenceMenu(!showPreferenceMenu)}
                className="w-10 h-10 rounded-full items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="ellipsis-vertical" size={22} color="#3B82F6" />
              </TouchableOpacity>
              {showPreferenceMenu && (
                <>
                  <TouchableOpacity
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                    activeOpacity={1}
                    onPress={() => setShowPreferenceMenu(false)}
                  />
                  <View
                    className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                    style={{
                      top: 40,
                      right: 0,
                      width: 160,
                    }}
                  >
                    {["short", "medium", "deep_search"].map((pref) => (
                      <TouchableOpacity
                        key={pref}
                        onPress={() => {
                          setAiPreference(pref as any);
                          setShowPreferenceMenu(false);
                        }}
                        className={`py-3 px-4 ${aiPreference === pref ? "bg-blue-100" : ""}`}
                      >
                        <Text
                          className={`font-outfit-regular ${
                            aiPreference === pref
                              ? "text-blue-800 font-semibold"
                              : "text-gray-800"
                          }`}
                        >
                          {pref === "short"
                            ? "Short (Quick)"
                            : pref === "medium"
                            ? "Medium (Balanced)"
                            : "Deep (Detailed)"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        }
      />
      <View className="px-6 pb-4 border-b border-gray-200">
        <View className="flex-row items-center gap-3 mt-2">
          <View className="flex-1">
            <SearchBar
              inputRef={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSearch={handleSearch}
              onSuggestionSelect={handleSuggestionSelect}
              placeholder="Ask a question..."
              showSuggestions={false}
            />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-4">
        {/* Loading, error, and content sections */}
        {(isLoading ||
          isShowingAd ||
          (activeQuery && !threadId && currentStatus?.hasSubscription)) &&
          !searchResult && (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text
                className="text-gray-600 font-outfit-regular mt-4"
                style={{
                  fontSize: scaleFont(12),
                  lineHeight: scaleLineHeight(scaleFont(12), 1.4),
                }}
              >
                {isShowingAd
                  ? "Loading..."
                  : !threadId
                    ? "Preparing..."
                    : "Searching..."}
              </Text>
            </View>
          )}

        {error && (
          <View className="items-center justify-center py-20">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text
              className="text-gray-900 font-outfit-semi-bold mt-4"
              style={{
                fontSize: scaleFont(18),
                lineHeight: scaleLineHeight(scaleFont(18), 1.3),
              }}
            >
              Search failed
            </Text>
            <Text
              className="text-gray-600 font-outfit-regular mt-2 text-center"
              style={{
                fontSize: scaleFont(12),
                lineHeight: scaleLineHeight(scaleFont(12), 1.4),
              }}
            >
              Please try again
            </Text>
          </View>
        )}

        {searchResult && displayResult && !isLoading && (
          <View className="mt-4">
            {/* Vault Tag (Source Badge) + Follow/Save Icons */}
            <View className="flex-row items-center justify-between mb-3">
              <View
                className={`rounded-full px-3 py-1.5 ${getSourceBadgeColor(displayResult.source)}`}
              >
                <Text
                  className={`font-outfit-semi-bold ${
                    getSourceBadgeColor(displayResult.source).split(" ")[1] ||
                    "text-gray-700"
                  }`}
                  style={{
                    fontSize: scaleFont(10),
                    lineHeight: scaleLineHeight(scaleFont(10), 1.5),
                  }}
                >
                  {getSourceLabel(displayResult.source)}
                </Text>
              </View>

              {vaultIdFromResult && (
                <View className="flex-row items-center gap-3">
                  {/* FOLLOW BUTTON */}
                  <TouchableOpacity
                    onPress={handleFollowToggle}
                    disabled={followPending}
                    activeOpacity={0.8}
                    className={`flex-row items-center px-3 py-1.5 rounded-full ${
                      isFollowed ? "bg-indigo-500" : "bg-gray-200"
                    }`}
                  >
                    {followPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name={isFollowed ? "heart" : "heart-outline"}
                          size={16}
                          color={isFollowed ? "#fff" : "#374151"}
                        />
                        <Text
                          className={`ml-1 text-xs font-semibold ${
                            isFollowed ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {isFollowed ? "Following" : "Follow"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* SAVE BUTTON */}
                  <Pressable
                    onPress={handleSaveToggle}
                    disabled={savePending}
                    style={({ pressed }) => ({
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    })}
                    className={`flex-row items-center px-3 py-1.5 rounded-full ${
                      isSaved ? "bg-amber-500" : "bg-gray-200"
                    }`}
                  >
                    {savePending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name={isSaved ? "bookmark" : "bookmark-outline"}
                          size={16}
                          color={isSaved ? "#fff" : "#374151"}
                        />
                        <Text
                          className={`ml-1 text-xs font-semibold ${
                            isSaved ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {isSaved ? "Saved" : "Save"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </View>

            {/* Vault description */}
            {vaultData?.description && (
              <View className="mb-3 px-1">
                <Text
                  className="text-gray-600 font-outfit-regular"
                  style={{
                    fontSize: scaleFont(13),
                    lineHeight: scaleLineHeight(scaleFont(13), 1.4),
                  }}
                >
                  {vaultData.description}
                </Text>
              </View>
            )}

            {/* Vault Answer */}
            <View className="bg-gray-50 rounded-2xl p-5 mb-4">
              <Text
                className="text-gray-900 font-outfit-regular"
                style={{
                  fontSize: scaleFont(18),
                  lineHeight: scaleLineHeight(scaleFont(18), 1.3),
                }}
              >
                {displayResult.answer ?? (displayResult as any).data?.answer ?? ""}
              </Text>
            </View>

            {/* Vault Contributions Section */}
            {displayResult.vaultContributions &&
              displayResult.vaultContributions.length > 0 && (
                <View className="mb-4 pb-6">
                  <Text
                    className="text-gray-900 font-outfit-semi-bold mb-3"
                    style={{
                      fontSize: scaleFont(16),
                      lineHeight: scaleLineHeight(scaleFont(16), 1.3),
                    }}
                  >
                    Vault Contributions
                  </Text>
                  {displayResult.vaultContributions.map((contribution, idx) => (
                    <View
                      key={`${contribution.vaultId}-${contribution.resourceId}-${idx}`}
                      className="mb-3"
                    >
                      <VaultCard
                        content={contribution.answer}
                        resourceId={contribution.resourceId}
                        vaultId={contribution.vaultId}
                        weight={contribution.weight}
                        onViewResource={() =>
                          router.push(
                            `/(tabs)/view-resource?id=${contribution.resourceId}` as any,
                          )
                        }
                      />
                    </View>
                  ))}
                </View>
              )}

            {/* All Community Answers */}
            {displayResult.communityAnswers &&
              displayResult.communityAnswers.length > 1 && (
                <View className="mb-4">
                  <Text
                    className="text-gray-900 font-outfit-semi-bold mb-3"
                    style={{
                      fontSize: scaleFont(16),
                      lineHeight: scaleLineHeight(scaleFont(16), 1.3),
                    }}
                  >
                    Other Community Answers (
                    {displayResult.communityAnswers.length - 1})
                  </Text>
                  {displayResult.communityAnswers
                    .slice(1)
                    .map((communityAnswer) => (
                      <View
                        key={communityAnswer.answerId}
                        className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
                      >
                        <Text
                          className="text-gray-900 font-outfit-regular mb-3"
                          style={{
                            fontSize: scaleFont(16),
                            lineHeight: scaleLineHeight(scaleFont(16), 1.3),
                          }}
                        >
                          {communityAnswer.answer}
                        </Text>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            {communityAnswer.upvotes > 0 && (
                              <View className="flex-row items-center mr-3">
                                <Ionicons
                                  name="thumbs-up"
                                  size={16}
                                  color="#6B7280"
                                />
                                <Text
                                  className="text-gray-700 font-outfit-regular ml-1"
                                  style={{
                                    fontSize: scaleFont(12),
                                    lineHeight: scaleLineHeight(
                                      scaleFont(12),
                                      1.4,
                                    ),
                                  }}
                                >
                                  {communityAnswer.upvotes} upvotes
                                </Text>
                              </View>
                            )}
                          </View>
                          {communityAnswer.answerUserId !== user?.id && (
                            <TouchableOpacity
                              className="bg-purple-500 rounded-lg px-4 py-2"
                              onPress={() =>
                                upvoteMutation.mutate(communityAnswer.answerId)
                              }
                              disabled={upvoteMutation.isPending}
                              activeOpacity={0.8}
                            >
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="thumbs-up"
                                  size={16}
                                  color="#FFFFFF"
                                />
                                <Text
                                  className="text-white font-outfit-semi-bold ml-1"
                                  style={{
                                    fontSize: scaleFont(12),
                                    lineHeight: scaleLineHeight(
                                      scaleFont(12),
                                      1.4,
                                    ),
                                  }}
                                >
                                  Upvote
                                </Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                </View>
              )}

            {/* Metadata: upvotes only */}
            {displayResult.upvotes !== undefined &&
              displayResult.upvotes > 0 && (
                <View className="flex-row items-center mb-4">
                  <View className="flex-row items-center">
                    <Ionicons name="thumbs-up" size={18} color="#6B7280" />
                    <Text
                      className="text-gray-700 font-outfit-regular ml-1"
                      style={{
                        fontSize: scaleFont(12),
                        lineHeight: scaleLineHeight(scaleFont(12), 1.4),
                      }}
                    >
                      {displayResult.upvotes} upvotes
                    </Text>
                  </View>
                </View>
              )}

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              {resourceIds.length > 0 && (
                <TouchableOpacity
                  className="flex-1 rounded-xl py-3.5 items-center shadow-sm bg-gray-200"
                  onPress={handleOpenResources}
                  activeOpacity={0.8}
                  disabled={isFetchingResources}
                  style={{ opacity: isFetchingResources ? 0.5 : 1 }}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="folder-open-outline"
                      size={20}
                      color="#374151"
                    />
                    <Text
                      className="text-gray-800 font-outfit-semi-bold ml-2"
                      style={{
                        fontSize: scaleFont(14),
                        lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                      }}
                    >
                      {isFetchingResources ? "Loading..." : "Resources"}
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
                  <Text
                    className="text-white font-outfit-semi-bold ml-2"
                    style={{
                      fontSize: scaleFont(14),
                      lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                    }}
                  >
                    Contribute Answer
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {(searchResult as any)?.email && (searchResult as any)?.number && (
              <TouchableOpacity
                className="flex-1 bg-green-500 rounded-xl py-3.5 items-center shadow-sm"
                onPress={() => setShowPaymentModal(true)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <Ionicons name="call-outline" size={20} color="#FFFFFF" />
                  <Text className="text-white font-outfit-semi-bold ml-2">
                    Talk to Expert
                  </Text>
                </View>
              </TouchableOpacity>
            )}

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

        {/* Fallback: if we ever have a searchResult but the main UI conditions fail,
            still show the raw answer so the user never sees an empty state. */}
        {searchResult && !isLoading && !displayResult && (
          <View className="mt-4 bg-gray-50 rounded-2xl p-5">
            <Text
              className="text-gray-900 font-outfit-regular"
              style={{
                fontSize: scaleFont(18),
                lineHeight: scaleLineHeight(scaleFont(18), 1.3),
              }}
            >
              {searchResult.answer}
            </Text>
          </View>
        )}

        {/* Resources Modal */}
        {showPaymentModal && (
          <Modal
            visible={showPaymentModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowPaymentModal(false)}
          >
            <View className="flex-1 bg-black/60 justify-center items-center px-4">
              <View className="bg-white rounded-2xl p-6 w-full max-w-md items-center">
                <Text className="text-lg font-bold mb-2">
                  Unlock Expert Contact
                </Text>

                <Text className="text-gray-600 mb-4 text-center">
                  Pay ₹49 to view expert contact details
                </Text>

                {/* PAY BUTTON */}
                <TouchableOpacity
                  className="bg-green-500 rounded-lg py-3 px-6 w-full items-center mb-3"
                  onPress={async () => {
                    try {
                      const RazorpayCheckout = (
                        await import("react-native-razorpay")
                      ).default;

                      // 🔴 STEP 1: call your backend
                      const res = await fetch(
                        "https://knowvaults.com/api/payments/create-contact-expert-order",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${user?.accessToken}`, // required
                          },
                          body: JSON.stringify({}),
                        },
                      );
                      const result = await res.json();
                      console.log("FULL RESPONSE:", result);
                      const order = result.data.order;
                      const key = result.data.keyId;

                      // 🔴 STEP 2: create options
                      const options = {
                        description: "Unlock Expert Contact",
                        currency: "INR",
                        key: key,
                        amount: order.amount,
                        order_id: order.id,
                        name: "KnowVault",
                        prefill: {
                          email: user?.email || "",
                          contact: user?.phone || "",
                          name: user?.name || "",
                        },
                        theme: { color: "#3B82F6" },
                      };

                      RazorpayCheckout.open(options)
                        .then(async (response: any) => {
                          try {
                            // ✅ call unlock API
                            await fetch(
                              "https://knowvaults.com/api/payments/unlock-contact",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${user?.accessToken}`,
                                },
                                body: JSON.stringify({
                                  vaultId: searchResult?.vaultId, // 🔴 important
                                  razorpayPaymentId:
                                    response.razorpay_payment_id,
                                }),
                              },
                            );

                            // ✅ show contact after unlock
                            setShowPaymentModal(false);
                            setShowContactModal(true);
                          } catch (err) {
                            console.log(err);
                            showErrorToast("Error", "Failed to unlock contact");
                          }
                        })
                        .catch((error: any) => {
                          console.log("RAZORPAY ERROR FULL:", error);
                          showErrorToast(
                            "Failed",
                            error?.description ||
                              error?.error?.description ||
                              "Payment failed",
                          );
                        });
                    } catch (err) {
                      console.log(err);
                      showErrorToast("Error", "Payment failed");
                    }
                  }}
                >
                  <Text className="text-white font-semibold">Pay ₹49</Text>
                </TouchableOpacity>

                {/* CANCEL */}
                <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                  <Text className="text-gray-500">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {showContactModal && (
          <Modal
            visible={showContactModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowContactModal(false)}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-4">
              <View className="bg-white rounded-2xl p-6 w-full max-w-md">
                <Text className="text-lg font-bold mb-4 text-center">
                  Expert Contact
                </Text>

                <Text className="mb-2">
                  Name: {(searchResult as any)?.name || "N/A"}
                </Text>

                <Text className="mb-2">
                  Email: {(searchResult as any)?.email}
                </Text>

                <Text className="mb-4">
                  Mobile: {(searchResult as any)?.number}
                </Text>

                <TouchableOpacity
                  className="bg-blue-500 rounded-lg py-3 items-center"
                  onPress={() => setShowContactModal(false)}
                >
                  <Text className="text-white font-semibold">Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {showResourcesModal && searchResult && displayResult && (
          <Modal
            visible={showResourcesModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowResourcesModal(false)}
          >
            <View className="flex-1 bg-black/50 justify-end">
              <TouchableOpacity
                className="flex-1"
                activeOpacity={1}
                onPress={() => setShowResourcesModal(false)}
              />
              <View
                className="bg-white rounded-t-3xl max-h-[80%]"
                style={{ paddingBottom: 32 }}
              >
                <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                  <Text
                    className="text-gray-900 font-outfit-semi-bold"
                    style={{
                      fontSize: scaleFont(18),
                      lineHeight: scaleLineHeight(scaleFont(18), 1.3),
                    }}
                  >
                    Resources
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowResourcesModal(false)}
                    className="p-2"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <ScrollView className="px-4 pt-2">
                  {Array.isArray(fetchedResources) &&
                  fetchedResources.length > 0 ? (
                    <View className="mb-4">
                      {fetchedResources.map((r, idx) => (
                        <View
                          key={`${idx}`}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3"
                        >
                          <Text
                            className="text-gray-900 font-outfit-semi-bold"
                            style={{
                              fontSize: scaleFont(14),
                              lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                            }}
                            numberOfLines={2}
                          >
                            {typeof (r as any)?.title === "string"
                              ? (r as any).title
                              : "Untitled resource"}
                          </Text>
                          <View className="flex-row items-center mt-2 flex-wrap">
                            {typeof (r as any)?.type === "string" &&
                              (r as any).type.length > 0 && (
                                <View className="rounded px-2 py-0.5 mr-2 mb-2 bg-blue-100">
                                  <Text
                                    className="text-xs font-outfit-semi-bold text-blue-700 uppercase"
                                    style={{ fontSize: scaleFont(10) }}
                                  >
                                    {(r as any).type}
                                  </Text>
                                </View>
                              )}
                            {typeof (r as any)?.subject === "string" &&
                              (r as any).subject.length > 0 && (
                                <View className="rounded px-2 py-0.5 mr-2 mb-2 bg-gray-200">
                                  <Text
                                    className="text-xs font-outfit-semi-bold text-gray-700"
                                    style={{ fontSize: scaleFont(10) }}
                                  >
                                    {(r as any).subject}
                                  </Text>
                                </View>
                              )}
                          </View>
                          {Array.isArray((r as any)?.tags) &&
                            (r as any).tags.length > 0 && (
                              <View className="flex-row flex-wrap mt-1">
                                {(r as any).tags
                                  .filter(
                                    (t: any) =>
                                      typeof t === "string" &&
                                      t.trim().length > 0,
                                  )
                                  .slice(0, 12)
                                  .map((tag: string, tIdx: number) => (
                                    <View
                                      key={`${idx}-tag-${tIdx}`}
                                      className="rounded-full px-2 py-1 bg-indigo-100 mr-2 mb-2"
                                    >
                                      <Text
                                        className="text-xs font-outfit-semi-bold text-indigo-700"
                                        style={{ fontSize: scaleFont(10) }}
                                      >
                                        {tag}
                                      </Text>
                                    </View>
                                  ))}
                              </View>
                            )}
                          {typeof (r as any)?.fileUrl === "string" &&
                            (r as any).fileUrl.length > 0 && (
                              <TouchableOpacity
                                className="bg-blue-500 rounded-lg px-3 py-2 mt-3 self-start"
                                onPress={async () => {
                                  try {
                                    const url = (r as any).fileUrl as string;
                                    const { Linking } =
                                      await import("react-native");
                                    const can = await Linking.canOpenURL(url);
                                    if (!can) {
                                      showErrorToast(
                                        "Error",
                                        "Cannot open this resource link",
                                      );
                                      return;
                                    }
                                    await Linking.openURL(url);
                                  } catch (e: any) {
                                    showErrorToast(
                                      "Error",
                                      e?.message || "Failed to open resource",
                                    );
                                  }
                                }}
                                activeOpacity={0.8}
                              >
                                <Text
                                  className="text-white font-outfit-semi-bold"
                                  style={{
                                    fontSize: scaleFont(12),
                                    lineHeight: scaleLineHeight(
                                      scaleFont(12),
                                      1.4,
                                    ),
                                  }}
                                >
                                  Open Resource
                                </Text>
                              </TouchableOpacity>
                            )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View className="py-8 items-center">
                      <Ionicons
                        name="folder-open-outline"
                        size={48}
                        color="#9CA3AF"
                      />
                      <Text
                        className="text-gray-500 font-outfit-regular mt-3 text-center"
                        style={{
                          fontSize: scaleFont(14),
                          lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                        }}
                      >
                        No resources for this answer
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Subscription required message */}
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
              <Text
                className="text-white font-outfit-semi-bold"
                style={{
                  fontSize: scaleFont(14),
                  lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                }}
              >
                Choose a Plan
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search history */}
        {!activeQuery &&
          !isLoading &&
          !isShowingAd &&
          currentStatus?.hasSubscription && (
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
                        className={`bg-gray-50 rounded-xl p-4 flex-row items-center justify-between ${index > 0 ? "mt-2" : ""}`}
                        onPress={() =>
                          router.navigate({
                            pathname: "/(tabs)/chat",
                            params: { threadId: item.id },
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <View className="flex-1">
                          <Text
                            className="text-gray-900 font-outfit-regular"
                            style={{
                              fontSize: scaleFont(14),
                              lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                            }}
                          >
                            {item.title}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            {(item as any).total !== undefined && (item as any).total > 0 && (
                              <Text
                                className="text-gray-500 font-outfit-regular mr-3"
                                style={{
                                  fontSize: scaleFont(10),
                                  lineHeight: scaleLineHeight(
                                    scaleFont(10),
                                    1.5,
                                  ),
                                }}
                              >
                                {(item as any).total} results
                              </Text>
                            )}
                            <Text
                              className="text-gray-400 font-outfit-regular"
                              style={{
                                fontSize: scaleFont(10),
                                lineHeight: scaleLineHeight(scaleFont(10), 1.5),
                              }}
                            >
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

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowHistoryModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl max-h-[70%]"
          >
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 text-xl font-outfit-bold">
                  Recent Searches
                </Text>
                <TouchableOpacity
                  onPress={() => setShowHistoryModal(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              className="max-h-96"
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {searchHistory && searchHistory.length > 0 ? (
                <View className="p-4">
                  {searchHistory.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      className="bg-gray-50 rounded-xl p-4 mb-2"
                      onPress={() => {
                        // Pass correctly shaped object to handleHistorySelect
                    handleHistorySelect({
  query: item.title ?? "",    // ensures query is always a string
  threadId: item.id,
  title: item.title ?? "",
});
                        setShowHistoryModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        className="text-gray-900 font-outfit-regular"
                        style={{
                          fontSize: scaleFont(14),
                          lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                        }}
                      >
                        {item.title}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        {(item as any).total !== undefined && (item as any).total > 0 && (
                          <Text
                            className="text-gray-500 font-outfit-regular mr-3"
                            style={{
                              fontSize: scaleFont(10),
                              lineHeight: scaleLineHeight(scaleFont(10), 1.5),
                            }}
                          >
                            {(item as any).total} results
                          </Text>
                        )}
                        <Text
                          className="text-gray-400 font-outfit-regular"
                          style={{
                            fontSize: scaleFont(10),
                            lineHeight: scaleLineHeight(scaleFont(10), 1.5),
                          }}
                        >
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="p-8 items-center">
                  <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                  <Text
                    className="text-gray-500 font-outfit-regular mt-4 text-center"
                    style={{
                      fontSize: scaleFont(14),
                      lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                    }}
                  >
                    No recent searches
                  </Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Threads Modal */}
      <Modal
        visible={showThreadsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowThreadsModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowThreadsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl max-h-[70%]"
          >
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 text-xl font-outfit-bold">
                  Your Threads
                </Text>
                <TouchableOpacity
                  onPress={() => setShowThreadsModal(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              className="max-h-96"
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {threads.length === 0 ? (
                <View className="p-8 items-center">
                  <Ionicons
                    name="chatbubbles-outline"
                    size={48}
                    color="#9CA3AF"
                  />
                  <Text
                    className="text-gray-500 font-outfit-regular mt-4 text-center"
                    style={{
                      fontSize: scaleFont(14),
                      lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                    }}
                  >
                    No threads yet. Start a search to create one.
                  </Text>
                </View>
              ) : (
                <View className="p-4">
                  {threads.map((thread) => (
                    <TouchableOpacity
                      key={thread.id}
                      className={`rounded-xl p-4 mb-2 ${
                        threadId === thread.id
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-gray-50"
                      }`}
                      onPress={() => {
                        setThreadId(thread.id);
                        setShowThreadsModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        className="text-gray-900 font-outfit-semi-bold"
                        style={{
                          fontSize: scaleFont(14),
                          lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                        }}
                        numberOfLines={2}
                      >
                        {thread.title || "New conversation"}
                      </Text>
                      <Text
                        className="text-gray-500 font-outfit-regular mt-1"
                        style={{
                          fontSize: scaleFont(11),
                          lineHeight: scaleLineHeight(scaleFont(11), 1.4),
                        }}
                      >
                        {new Date(thread.createdAt).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Submit Answer Modal */}
      <Modal
        visible={showSubmitAnswer}
        animationType="fade"
        transparent
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
              <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <View className="p-6">
                  <View className="mb-4">
                    <Text
                      className="text-gray-700 font-outfit-regular mb-2"
                      style={{
                        fontSize: scaleFont(12),
                        lineHeight: scaleLineHeight(scaleFont(12), 1.4),
                      }}
                    >
                      Question: {searchQuery}
                    </Text>
                    <Text
                      className="text-gray-900 font-outfit-semi-bold mb-3"
                      style={{
                        fontSize: scaleFont(14),
                        lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                      }}
                    >
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
                    <View className="mt-3">
                      {/* FILE PICK */}
                      <TouchableOpacity
                        onPress={pickFile}
                        className="mt-2 bg-[#99c2ff] rounded-lg py-2 items-center"
                      >
                        <Text>Add File</Text>
                      </TouchableOpacity>

                      {/* TYPE SELECT */}
                      <View className="mb-4">
                        <View className="flex-row gap-2 mt-4">
                          {["link", "pdf", "video"].map((type) => (
                            <TouchableOpacity
                              key={type}
                              className={`px-3 py-1.5 rounded-full ${
                                resourceType === type
                                  ? "bg-blue-500"
                                  : "bg-gray-200"
                              }`}
                              onPress={() => setResourceType(type as any)}
                            >
                              <Text
                                className={`text-xs ${
                                  resourceType === type
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}
                              >
                                {type.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* INPUT */}
                        <TextInput
                          value={resourceValue}
                          onChangeText={setResourceValue}
                          placeholder={
                            resourceType === "link"
                              ? "Paste link..."
                              : resourceType === "pdf"
                                ? "Paste PDF URL..."
                                : "Paste video URL..."
                          }
                          className="border border-gray-300 rounded-lg p-3 mt-3 text-gray-900"
                        />
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-blue-500 rounded-lg py-4 items-center"
                    onPress={() => {
                      if (userAnswer.trim().length >= 10) {
                        submitAnswerMutation.mutate(userAnswer);
                      } else {
                        showErrorToast(
                          "Validation Error",
                          "Answer must be at least 10 characters long",
                        );
                      }
                    }}
                    disabled={submitAnswerMutation.isPending}
                    activeOpacity={0.7}
                  >
                    {submitAnswerMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text
                        className="text-white font-outfit-semi-bold"
                        style={{
                          fontSize: scaleFont(14),
                          lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                        }}
                      >
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