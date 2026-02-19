import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { useServices } from "../../hooks/useServices";
import { ThreadListItem } from "../../services/thread.service";
import { useAuthStore } from "../../store/auth-store";
import { useSubscriptionStore } from "../../store/subscription-store";
import { scaleFont, scaleLineHeight } from "../../utils/font-scale";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../../utils/toast";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  source?: string;
  qualityScore?: number;
  tokensUsed?: number;
  answerId?: string;
  answerUserId?: string;
  communityAnswers?: any[];
  matchedResources?: any[];
  vaultId?: string;
  resourceId?: string;
  /** Vault metadata merged from GET /vaults/:vaultId (persisted in thread state) */
  vaultTitle?: string;
  vaultDescription?: string;
};

export default function Chat() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiPreference, setAiPreference] = useState<
    "short" | "medium" | "deep_search"
  >("medium");
  const [inputText, setInputText] = useState("");
  const [showThreadsModal, setShowThreadsModal] = useState(false);
  const [showSubmitAnswer, setShowSubmitAnswer] = useState(false);
  const [contributeQuery, setContributeQuery] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [upvotedAnswerIds, setUpvotedAnswerIds] = useState<Set<string>>(
    new Set(),
  );
  const [vaultUpvotedResourceIds, setVaultUpvotedResourceIds] = useState<
    Set<string>
  >(new Set());
  const [vaultDownvotedResourceIds, setVaultDownvotedResourceIds] = useState<
    Set<string>
  >(new Set());
  const [followedVaultIds, setFollowedVaultIds] = useState<Set<string>>(
    new Set(),
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const services = useServices();
  const { search, subscription, thread, vault, resource } = services;
  const queryClient = useQueryClient();
  const { setSubscriptionStatus } = useSubscriptionStore();
  const { user } = useAuthStore();

  // Ad revenue tracking (keep commented if needed)
  // const searchAdRevenue = (services as { searchAdRevenue?: { trackAdRevenue: (opts: any) => Promise<void> } }).searchAdRevenue;

  const { data: currentStatus, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscriptionStatus", user?.id],
    queryFn: () => subscription.getCurrentStatus(),
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 1,
  });

  useEffect(() => {
    if (currentStatus) {
      setSubscriptionStatus(currentStatus);
    }
  }, [currentStatus, setSubscriptionStatus]);

  useEffect(() => {
    if (!currentStatus) return;
    const sub = currentStatus.subscription;
    if (!currentStatus.hasSubscription || !sub) {
      showInfoToast(
        "Subscription Required",
        "You need an active subscription to chat. Please choose a plan to continue.",
      );
      setTimeout(
        () => router.push("/(tabs)/manage-subscriptions" as any),
        1500,
      );
      return;
    }
    if (sub.expiresAt) {
      const expiresAt = new Date(sub.expiresAt);
      if (expiresAt < new Date()) {
        showErrorToast(
          "Subscription Expired",
          "Your subscription has expired. Please renew or choose a new plan.",
        );
        setTimeout(
          () => router.push("/(tabs)/manage-subscriptions" as any),
          2000,
        );
        return;
      }
    }
    if (!currentStatus.canSearch) {
      const isQueriesExhausted = sub.queriesUsedToday >= sub.dailyQueriesLimit;
      const isTokensExhausted = sub.tokensUsedToday >= sub.dailyTokensLimit;
      let message = "Your daily limit has been reached. ";
      if (isQueriesExhausted && isTokensExhausted) {
        message += "You've used all your queries and tokens for today.";
      } else if (isQueriesExhausted) {
        message += `You've used all ${sub.dailyQueriesLimit} queries for today.`;
      } else {
        message += `You've used all ${sub.dailyTokensLimit.toLocaleString()} tokens for today.`;
      }
      message +=
        " Please upgrade your plan or wait for the limit to reset tomorrow.";
      showErrorToast("Daily Limit Reached", message);
      setTimeout(
        () => router.push("/(tabs)/manage-subscriptions" as any),
        2000,
      );
    }
  }, [currentStatus]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;
    if (!currentStatus?.hasSubscription) {
      showInfoToast(
        "Subscription Required",
        "You need an active subscription to chat.",
      );
      return;
    }

    let currentThreadId = threadId;
    if (!currentThreadId) {
      try {
        const newThread = await thread.createThread();
        const newId = newThread.data.threadId;
        setThreadId(newId);
        currentThreadId = newId;
      } catch (err) {
        console.error("Error creating thread:", err);
        showErrorToast("Error", "Failed to start conversation.");
        return;
      }
    }

    setInputText("");
    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    scrollToBottom();

    try {
      const response = await search.search({
        query: trimmed,
        threadId: currentThreadId,
        aiPreference,
      });
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.answer,
        source: response.source,
        qualityScore: response.qualityScore,
        tokensUsed: response.tokensUsed,
        answerId: response.answerId,
        answerUserId: response.answerUserId ?? undefined,
        communityAnswers: response.communityAnswers,
        matchedResources: response.matchedResources,
        vaultId: response.vaultId,
        resourceId: response.resourceId,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      // When source is vault: fetch vault details in background and merge into message (non-blocking)
      if (response.source === "vault" && response.vaultId) {
        vault
          .getVaultById(response.vaultId)
          .then((v) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (
                last?.role === "assistant" &&
                last.source === "vault" &&
                last.vaultId === response.vaultId
              ) {
                next[next.length - 1] = {
                  ...last,
                  vaultTitle: v.title,
                  vaultDescription: v.description,
                };
              }
              return next;
            });
          })
          .catch(() => {});
      }
      queryClient.invalidateQueries({
        queryKey: ["subscriptionStatus", user?.id],
      });
      scrollToBottom();
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 402) {
        showInfoToast(
          "Hold on!",
          error?.response?.data?.message ||
            "To continue, please choose a plan.",
        );
        setTimeout(
          () => router.push("/(tabs)/manage-subscriptions" as any),
          1500,
        );
      } else if (status === 429) {
        showErrorToast(
          "Daily Limit Reached",
          error?.response?.data?.message ||
            "You've reached your daily limit. Please upgrade or wait for reset.",
        );
        refetchSubscription();
        setTimeout(
          () => router.push("/(tabs)/manage-subscriptions" as any),
          2000,
        );
      } else {
        showErrorToast("Error", "Failed to get a response. Please try again.");
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsSending(false);
    }
  };

  const submitAnswerMutation = useMutation({
    mutationFn: (answer: string) =>
      search.submitCommunityAnswer({
        query: contributeQuery,
        answer,
      }),
    onSuccess: (data: any) => {
      setShowSubmitAnswer(false);
      setUserAnswer("");
      setContributeQuery("");
      if (data?.isUpdate) {
        showSuccessToast(
          "Success",
          "Your answer has been updated successfully!",
        );
      } else {
        showSuccessToast("Thank you!", "Your answer has been submitted.");
      }
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: (answerId: string) => search.upvoteAnswer(answerId),
    onSuccess: (data: any, answerId: string) => {
      setUpvotedAnswerIds((prev) => {
        const next = new Set(prev);
        if (data.upvoted) next.add(answerId);
        else next.delete(answerId);
        return next;
      });
    },
    onError: (error: any) => {
      showErrorToast(
        "Error",
        error?.response?.data?.message || "Failed to upvote answer",
      );
    },
  });

  const resourceUpvoteMutation = useMutation({
    mutationFn: (resourceId: string) => resource.upvoteResource(resourceId),
    onMutate: async (resourceId: string) => {
      setVaultUpvotedResourceIds((prev) => new Set(prev).add(resourceId));
      setVaultDownvotedResourceIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    },
    onSuccess: (data: { upvoted: boolean }, resourceId: string) => {
      if (!data.upvoted) {
        setVaultUpvotedResourceIds((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
      }
    },
    onError: (error: any, resourceId: string) => {
      setVaultUpvotedResourceIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
      showErrorToast(
        "Error",
        error?.response?.data?.message || "Failed to upvote resource",
      );
    },
  });

  const resourceDownvoteMutation = useMutation({
    mutationFn: (resourceId: string) => resource.downvoteResource(resourceId),
    onMutate: async (resourceId: string) => {
      setVaultDownvotedResourceIds((prev) => new Set(prev).add(resourceId));
      setVaultUpvotedResourceIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    },
    onSuccess: (data: { downvoted: boolean }, resourceId: string) => {
      if (!data.downvoted) {
        setVaultDownvotedResourceIds((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
      }
    },
    onError: (error: any, resourceId: string) => {
      setVaultDownvotedResourceIds((prev) => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
      showErrorToast(
        "Error",
        error?.response?.data?.message || "Failed to downvote resource",
      );
    },
  });

  const followVaultMutation = useMutation({
    mutationFn: (vaultId: string) => vault.followVault(vaultId),
    onSuccess: (_, vaultId: string) => {
      setFollowedVaultIds((prev) => new Set(prev).add(vaultId));
      showSuccessToast("Success", "You are now following this vault.");
    },
    onError: (error: any) => {
      showErrorToast(
        "Error",
        error?.response?.data?.message || "Failed to follow vault",
      );
    },
  });

  const reviewVaultMutation = useMutation({
    mutationFn: ({ vaultId, review }: { vaultId: string; review: string }) =>
      vault.reviewVault(vaultId, { comment: review }),
    onSuccess: () => {
      showSuccessToast("Thank you!", "Your review has been submitted.");
    },
    onError: (error: any) => {
      showErrorToast(
        "Error",
        error?.response?.data?.message || "Failed to submit review",
      );
    },
  });

  const getSourceBadgeColor = (source: string) => {
    const colors: Record<string, string> = {
      cache: "bg-green-100 text-green-700",
      competitive: "bg-blue-100 text-blue-700",
      community: "bg-purple-100 text-purple-700",
      paid_ai: "bg-orange-100 text-orange-700",
      web: "bg-gray-100 text-gray-700",
      free_ai: "bg-gray-100 text-gray-700",
      vault: "bg-indigo-100 text-indigo-700",
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
      free_ai: "AI",
      vault: "Vault",
    };
    return labels[source] || source;
  };

  const { data: threads = [] } = useQuery<ThreadListItem[]>({
    queryKey: ["threads"],
    queryFn: () => thread.getAllThreads(50, 0),
    enabled: showThreadsModal && !!user?.id,
    staleTime: 10000,
  });

  const handleThreadSelect = async (threadItem: ThreadListItem) => {
    setThreadId(threadItem.id);
    setShowThreadsModal(false);
    try {
      const response = await thread.getThreadById(threadItem.id);
      const rawMessages = response?.data?.thread ?? [];
      const mappedMessages: ChatMessage[] = rawMessages.map(
        (msg: { role: string; message: string }) => {
          const raw = msg.message;
          let parsed: unknown = null;
          try {
            if (typeof raw === "string" && raw.trim().startsWith("{")) {
              parsed = JSON.parse(raw);
            }
          } catch {
            /* ignore */
          }
          if (
            parsed &&
            typeof parsed === "object" &&
            "content" in (parsed as object) &&
            typeof (parsed as { content: string }).content === "string"
          ) {
            const p = parsed as {
              content: string;
              source?: string;
              vaultId?: string;
              resourceId?: string;
              qualityScore?: number;
              vaultTitle?: string;
              vaultDescription?: string;
            };
            return {
              role: msg.role as "user" | "assistant",
              content: p.content,
              source: p.source,
              vaultId: p.vaultId,
              resourceId: p.resourceId,
              qualityScore: p.qualityScore,
              vaultTitle: p.vaultTitle,
              vaultDescription: p.vaultDescription,
            };
          }
          return {
            role: msg.role as "user" | "assistant",
            content: raw,
          };
        },
      );
      setMessages(mappedMessages);
      // Fetch vault details in background for vault messages missing title/description
      mappedMessages.forEach((msg, index) => {
        if (
          msg.role === "assistant" &&
          msg.source === "vault" &&
          msg.vaultId &&
          (msg.vaultTitle === undefined || msg.vaultDescription === undefined)
        ) {
          vault
            .getVaultById(msg.vaultId)
            .then((v) => {
              setMessages((prev) => {
                const next = [...prev];
                if (next[index]?.vaultId === msg.vaultId) {
                  next[index] = {
                    ...next[index],
                    vaultTitle: v.title,
                    vaultDescription: v.description,
                  };
                }
                return next;
              });
            })
            .catch(() => {});
        }
      });
    } catch (err) {
      console.error("Error loading thread:", err);
      setMessages([]);
    }
  };

  const openContributeAnswer = (query: string) => {
    setContributeQuery(query);
    setShowSubmitAnswer(true);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white" edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScreenHeader
          title="Chat"
          showBackButton={false}
          rightElement={
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  setThreadId(null);
                  setMessages([]);
                  setAiPreference("medium");
                }}
                className="w-10 h-10 rounded-full items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color="#3B82F6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowThreadsModal(true)}
                className="w-10 h-10 rounded-full items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={22} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          }
        />

        <View className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 16 }}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 &&
              !isSending &&
              currentStatus?.hasSubscription && (
                <View className="items-center justify-center py-20">
                  <Ionicons
                    name="chatbubbles-outline"
                    size={56}
                    color="#9CA3AF"
                  />
                  <Text
                    className="text-gray-900 font-outfit-semi-bold mt-4 text-center"
                    style={{
                      fontSize: scaleFont(18),
                      lineHeight: scaleLineHeight(scaleFont(18), 1.3),
                    }}
                  >
                    Start a conversation
                  </Text>
                  <Text
                    className="text-gray-500 font-outfit-regular mt-2 text-center px-6"
                    style={{
                      fontSize: scaleFont(14),
                      lineHeight: scaleLineHeight(scaleFont(14), 1.4),
                    }}
                  >
                    Ask a question to get an AI-powered answer
                  </Text>
                </View>
              )}

            {messages.map((msg, index) =>
              msg.role === "user" ? (
                <View
                  key={`user-${index}`}
                  className="flex-row justify-end my-2"
                >
                  <View className="bg-blue-500 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                    <Text
                      className="text-white font-outfit-regular"
                      style={{
                        fontSize: scaleFont(15),
                        lineHeight: scaleLineHeight(scaleFont(15), 1.4),
                      }}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ) : msg.source === "vault" && msg.resourceId && msg.vaultId ? (
                <View
                  key={`assistant-${index}`}
                  className="flex-row justify-start my-2"
                >
                  <View>
                    <VaultCard
                      content={msg.content}
                      qualityScore={msg.qualityScore}
                      tokensUsed={msg.tokensUsed}
                      resourceId={msg.resourceId}
                      vaultId={msg.vaultId}
                      vaultTitle={msg.vaultTitle}
                      vaultDescription={msg.vaultDescription}
                      onViewResource={() =>
                        router.push(
                          `/(tabs)/view-resource?id=${msg.resourceId}` as any,
                        )
                      }
                    />
                    <TouchableOpacity
                      className="mt-2 self-start rounded-lg px-3 py-1.5 bg-blue-500 flex-row items-center"
                      onPress={() => {
                        const query =
                          index > 0 ? messages[index - 1].content : "";
                        openContributeAnswer(query);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text
                        className="text-white font-outfit-semi-bold ml-1 text-xs"
                        style={{ fontSize: scaleFont(12) }}
                      >
                        Contribute Answer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View
                  key={`assistant-${index}`}
                  className="flex-row justify-start my-2"
                >
                  <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    {msg.source && (
                      <View
                        className={`self-start rounded-full px-2 py-1 mb-2 ${getSourceBadgeColor(msg.source)}`}
                      >
                        <Text
                          className="font-outfit-semi-bold text-xs"
                          style={{ fontSize: scaleFont(10) }}
                        >
                          {getSourceLabel(msg.source)}
                        </Text>
                      </View>
                    )}
                    <Text
                      className="text-gray-900 font-outfit-regular"
                      style={{
                        fontSize: scaleFont(15),
                        lineHeight: scaleLineHeight(scaleFont(15), 1.4),
                      }}
                    >
                      {msg.content}
                    </Text>
                    {(msg.qualityScore != null && msg.qualityScore > 0) ||
                    (msg.tokensUsed != null && msg.tokensUsed > 0) ? (
                      <View className="flex-row items-center gap-3 mt-2 flex-wrap">
                        {msg.qualityScore != null && msg.qualityScore > 0 && (
                          <View className="flex-row items-center">
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text
                              className="text-gray-600 font-outfit-semi-bold ml-1 text-xs"
                              style={{ fontSize: scaleFont(10) }}
                            >
                              {Math.round(msg.qualityScore * 100)}%
                            </Text>
                          </View>
                        )}
                        {msg.tokensUsed != null && msg.tokensUsed > 0 && (
                          <View className="flex-row items-center">
                            <Ionicons name="flash" size={14} color="#6B7280" />
                            <Text
                              className="text-gray-600 font-outfit-regular ml-1 text-xs"
                              style={{ fontSize: scaleFont(10) }}
                            >
                              {msg.tokensUsed} tokens
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : null}
                    {msg.source === "community" &&
                      msg.answerId &&
                      msg.answerUserId !== user?.id && (
                        <TouchableOpacity
                          className={`mt-2 self-start rounded-lg px-3 py-1.5 flex-row items-center ${
                            upvotedAnswerIds.has(msg.answerId!)
                              ? "bg-green-500"
                              : "bg-purple-500"
                          }`}
                          onPress={() => upvoteMutation.mutate(msg.answerId!)}
                          disabled={upvoteMutation.isPending}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={
                              upvotedAnswerIds.has(msg.answerId!)
                                ? "checkmark-circle"
                                : "thumbs-up"
                            }
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text
                            className="text-white font-outfit-semi-bold ml-1 text-xs"
                            style={{ fontSize: scaleFont(12) }}
                          >
                            {upvoteMutation.isPending
                              ? "..."
                              : upvotedAnswerIds.has(msg.answerId!)
                                ? "Upvoted"
                                : "Upvote"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    {(msg.source !== "competitive" &&
                      msg.source !== "paid_ai") && (
                      <TouchableOpacity
                        className="mt-2 self-start rounded-lg px-3 py-1.5 bg-blue-500 flex-row items-center"
                        onPress={() => {
                          const query =
                            index > 0 ? messages[index - 1].content : "";
                          openContributeAnswer(query);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text
                          className="text-white font-outfit-semi-bold ml-1 text-xs"
                          style={{ fontSize: scaleFont(12) }}
                        >
                          Contribute Answer
                        </Text>
                      </TouchableOpacity>
                    )}
                    {msg.communityAnswers &&
                      msg.communityAnswers.length > 1 && (
                        <View className="mt-3 pt-2 border-t border-gray-200">
                          <Text
                            className="text-gray-700 font-outfit-semi-bold mb-2 text-xs"
                            style={{ fontSize: scaleFont(12) }}
                          >
                            Other Community Answers (
                            {msg.communityAnswers.length - 1})
                          </Text>
                          {msg.communityAnswers.slice(1).map((ca: any) => (
                            <View
                              key={ca.answerId}
                              className="bg-white border border-gray-200 rounded-lg p-3 mb-2"
                            >
                              <Text
                                className="text-gray-900 font-outfit-regular text-xs"
                                style={{
                                  fontSize: scaleFont(12),
                                  lineHeight: scaleLineHeight(
                                    scaleFont(12),
                                    1.4,
                                  ),
                                }}
                              >
                                {ca.answer}
                              </Text>
                              {ca.answerUserId !== user?.id && (
                                <TouchableOpacity
                                  className="mt-2 self-start rounded px-2 py-1 bg-purple-500 flex-row items-center"
                                  onPress={() =>
                                    upvoteMutation.mutate(ca.answerId)
                                  }
                                  disabled={upvoteMutation.isPending}
                                >
                                  <Ionicons
                                    name="thumbs-up"
                                    size={14}
                                    color="#FFFFFF"
                                  />
                                  <Text
                                    className="text-white font-outfit-semi-bold ml-1 text-xs"
                                    style={{ fontSize: scaleFont(10) }}
                                  >
                                    Upvote
                                    {ca.upvotes > 0 ? ` (${ca.upvotes})` : ""}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    {msg.matchedResources &&
                      msg.matchedResources.length > 0 && (
                        <View className="mt-3 pt-2 border-t border-gray-200">
                          <Text
                            className="text-gray-700 font-outfit-semi-bold mb-2 text-xs"
                            style={{ fontSize: scaleFont(12) }}
                          >
                            Related Resources
                          </Text>
                          {msg.matchedResources.map((resource: any) => (
                            <TouchableOpacity
                              key={resource.id}
                              className="bg-white border border-gray-200 rounded-lg p-3 mb-2 flex-row items-center"
                              onPress={() =>
                                router.push(
                                  `/(tabs)/view-resource?id=${resource.id}` as any,
                                )
                              }
                              activeOpacity={0.7}
                            >
                              <View
                                className="rounded-lg p-2 mr-2"
                                style={{
                                  backgroundColor:
                                    resource.type === "video"
                                      ? "#3B82F620"
                                      : resource.type === "pdf"
                                        ? "#EF444420"
                                        : resource.type === "note"
                                          ? "#10B98120"
                                          : "#F59E0B20",
                                }}
                              >
                                <Ionicons
                                  name={
                                    resource.type === "video"
                                      ? "videocam"
                                      : resource.type === "pdf"
                                        ? "document-text"
                                        : resource.type === "note"
                                          ? "document"
                                          : "link"
                                  }
                                  size={20}
                                  color={
                                    resource.type === "video"
                                      ? "#3B82F6"
                                      : resource.type === "pdf"
                                        ? "#EF4444"
                                        : resource.type === "note"
                                          ? "#10B981"
                                          : "#F59E0B"
                                  }
                                />
                              </View>
                              <Text
                                className="flex-1 text-gray-900 font-outfit-semi-bold text-xs"
                                numberOfLines={2}
                                style={{ fontSize: scaleFont(12) }}
                              >
                                {resource.title}
                              </Text>
                              <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#9CA3AF"
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                  </View>
                </View>
              ),
            )}

            {isSending && (
              <View className="flex-row justify-start my-2">
                <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text
                    className="text-gray-500 font-outfit-regular mt-2 text-xs"
                    style={{ fontSize: scaleFont(12) }}
                  >
                    Thinking...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View className="px-4 py-3 border-t border-gray-200 bg-white">
            <View className="flex-row items-end gap-2">
              <TextInput
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-gray-900 font-outfit-regular max-h-24"
                style={{
                  fontSize: scaleFont(15),
                  lineHeight: scaleLineHeight(scaleFont(15), 1.4),
                }}
                placeholder="Ask a question..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={2000}
                editable={!isSending && !!currentStatus?.hasSubscription}
              />
              <TouchableOpacity
                className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center"
                onPress={handleSend}
                disabled={
                  isSending ||
                  !inputText.trim() ||
                  !currentStatus?.hasSubscription
                }
                activeOpacity={0.7}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={22} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {currentStatus && !currentStatus.hasSubscription && (
        <View className="absolute inset-0 bg-white/95 justify-center items-center px-6">
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
                    No threads yet. Start a conversation to create one.
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
                      onPress={() => handleThreadSelect(thread)}
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
        onRequestClose={() => {
          setShowSubmitAnswer(false);
          setUserAnswer("");
          setContributeQuery("");
        }}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => {
            setShowSubmitAnswer(false);
            setUserAnswer("");
            setContributeQuery("");
          }}
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
                      setContributeQuery("");
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
                      Question: {contributeQuery}
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
