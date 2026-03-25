import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import {
  ActivityIndicator,
  BackHandler,
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
  /** Sorted desc by weight (safe copy, not mutating API response) */
  vaultContributions?: {
    vaultId: string;
    resourceId: string;
    answer: string;
    weight: number;
    ownerId: string;
  }[];
  vaultId?: string;
  resourceId?: string;
  /** Vault metadata merged from GET /vaults/:vaultId (persisted in thread state) */
  vaultTitle?: string;
  vaultDescription?: string;
  name?: string;
  email?: string;
  number?: string;
};

export default function Chat() {
  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.assets && result.assets.length > 0) {
      setResourceValue(result.assets[0].uri);
    }
  };

  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const params = useLocalSearchParams<{ threadId?: string }>();
  const [aiPreference, setAiPreference] = useState<
    "short" | "medium" | "deep_search"
  >("medium");
  const [inputText, setInputText] = useState("");
  const [showThreadsModal, setShowThreadsModal] = useState(false);
  const [showSubmitAnswer, setShowSubmitAnswer] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [contributeQuery, setContributeQuery] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState("");
  const [resourceType, setResourceType] = useState<
    "link" | "pdf" | "video" | "image"
  >("link");
  const [resourceValue, setResourceValue] = useState("");
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
  const threeDotsRef = useRef<View>(null);
  const [showPreferenceMenu, setShowPreferenceMenu] = useState(false);

  const services = useServices();
  const { search, subscription, thread, vault, resource } = services;
  const queryClient = useQueryClient();
  const { setSubscriptionStatus } = useSubscriptionStore();
  const { user } = useAuthStore();

  // Ad revenue tracking (keep commented if needed)
  // const searchAdRevenue = (services as { searchAdRevenue?: { trackAdRevenue: (opts: any) => Promise<void> } }).searchAdRevenue;
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.push("/(tabs)/search");
        return true;
      };

      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => sub.remove();
    }, []),
  );

  useEffect(() => {
    if (!params.threadId) return;

    (async () => {
      try {
        const response = await thread.getThreadById(params.threadId as string);

        const rawMessages = response?.data?.thread ?? [];

        const mappedMessages: ChatMessage[] = rawMessages.map(
          (msg: { role: string; message: string }) => {
            const raw = msg.message;

            let parsed: any = null;
            try {
              if (typeof raw === "string" && raw.trim().startsWith("{")) {
                parsed = JSON.parse(raw);
              }
            } catch {}

            if (parsed && typeof parsed === "object" && parsed.content) {
              return {
                role: msg.role as "user" | "assistant",
                content: parsed.content,
                source: parsed.source,
                vaultId: parsed.vaultId,
                resourceId: parsed.resourceId,
                qualityScore: parsed.qualityScore,
                vaultTitle: parsed.vaultTitle,
                vaultDescription: parsed.vaultDescription,
                vaultContributions: parsed.vaultContributions,
              };
            }

            return {
              role: msg.role as "user" | "assistant",
              content: raw,
            };
          },
        );

        setThreadId(params.threadId as string);
        setMessages(mappedMessages);
      } catch (err) {
        console.error("Error loading thread:", err);
        showErrorToast("Error", "Failed to load thread. Please try again.");
      }
    })();
  }, [params.threadId, thread]);

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
        3000,
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
          5000,
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
        5000,
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
      // API returns { success, data: { answer, source, vaultId, resourceId, vaultContributions, ... } } – read from response.data
      const data = (response as { data?: typeof response })?.data ?? response;
      const rawContributions = data.vaultContributions;
      const sortedVaultContributions = rawContributions?.length
        ? [...rawContributions].sort(
            (a, b) => (b.weight ?? 0) - (a.weight ?? 0),
          )
        : undefined;
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.answer,
        source: data.source,
        qualityScore: data.qualityScore,
        tokensUsed: data.tokensUsed,
        answerId: data.answerId,
        answerUserId: data.answerUserId ?? undefined,
        communityAnswers: data.communityAnswers,
        matchedResources: data.matchedResources,
        vaultContributions: sortedVaultContributions,
        vaultId: data.vaultId,
        resourceId: data.resourceId,
        name: (data as any).name,
        email: (data as any).email,
        number: (data as any).number,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      // When source is vault: fetch vault details in background and merge into message (non-blocking)
      if (data.source === "vault" && data.vaultId) {
        vault
          .getVaultById(data.vaultId)
          .then((v) => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (
                last?.role === "assistant" &&
                last.source === "vault" &&
                last.vaultId === data.vaultId
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
              vaultContributions?: ChatMessage["vaultContributions"];
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
              vaultContributions: p.vaultContributions,
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
          showBackButton
          onBackPress={() => router.push("/(tabs)/search")}
          rightElement={
            <View className="flex-row items-center gap-2">
             
              {/* Threads icon (replaces time-outline) */}
              <TouchableOpacity
                onPress={() => setShowThreadsModal(true)}
                className="w-10 h-10 rounded-full items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubbles-outline" size={22} color="#3B82F6" />
              </TouchableOpacity>

              {/* Three-dots icon for AI preference */}
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

        <View className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 16 }}
            onContentSizeChange={() => {
              if (isSending) {
                scrollToBottom();
              }
            }}
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
                <View key={`user-${index}`} className="px-4 my-2 items-end">
                  <View className="bg-blue-500 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
                    <Text className="text-white text-[15px] leading-[20px]">
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  key={`assistant-${index}`}
                  className="px-4 my-2 items-start"
                >
                  {/* MESSAGE CONTAINER */}
                  <View className="max-w-[80%]">
                    {/* SOURCE TAG */}
                    {msg.source && (
                      <View
                        className={`mb-1 self-start px-2 py-0.5 rounded-full ${getSourceBadgeColor(msg.source)}`}
                      >
                        <Text className="text-[10px] font-semibold">
                          {getSourceLabel(msg.source)}
                        </Text>
                      </View>
                    )}

                    {/* CONTENT */}
                    {msg.source === "vault" ? (
                      <VaultCard
                        content={msg.content}
                        qualityScore={msg.qualityScore}
                        tokensUsed={msg.tokensUsed}
                        resourceId={msg.resourceId!}
                        vaultId={msg.vaultId!}
                        vaultTitle={msg.vaultTitle}
                        vaultDescription={msg.vaultDescription}
                        onViewResource={() =>
                          router.push(
                            `/(tabs)/view-resource?id=${msg.resourceId}` as any,
                          )
                        }
                      />
                    ) : (
                      <View className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                        <Text className="text-gray-900 text-[15px] leading-[20px]">
                          {msg.content}
                        </Text>
                      </View>
                    )}

                    {/* ACTION BUTTONS (CHATGPT STYLE) */}
                    <View className="flex-row items-center gap-2 mt-2">
                      {/* CONTRIBUTE */}
                      <TouchableOpacity
                        className="flex-1 rounded-lg py-2 bg-blue-500 flex-row items-center justify-center"
                        onPress={() => {
                          const query =
                            index > 0 ? messages[index - 1].content : "";
                          openContributeAnswer(query);
                        }}
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text className="text-white ml-1 text-xs">
                          Contribute
                        </Text>
                      </TouchableOpacity>

                      {/* TALK TO EXPERT */}
                      {(msg.email || msg.number) && (
                        <TouchableOpacity
                          className="flex-1 rounded-lg py-2 bg-green-500 flex-row items-center justify-center"
                          onPress={() => {
                            setSelectedContact(msg);
                            setShowPaymentModal(true);
                          }}
                        >
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color="#FFFFFF"
                          />
                          <Text className="text-white ml-1 text-xs">
                            Connect with Expert
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
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

                  {/* ✅ FILE PICK BUTTON */}
                  <TouchableOpacity
                    onPress={pickFile}
                    className="mt-2 bg-[#99c2ff] rounded-lg py-2 items-center"
                  >
                    <Text>Add File</Text>
                  </TouchableOpacity>

                  {/* ✅ RESOURCE TYPE SELECT */}
                  <View className="flex-row gap-2 mt-4">
                    {["link", "pdf", "video"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        className={`px-3 py-1.5 rounded-full ${
                          resourceType === type ? "bg-blue-500" : "bg-gray-200"
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

                  {/* ✅ RESOURCE INPUT */}
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
      {showPaymentModal && selectedContact && (
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

                    if (!RazorpayCheckout) {
                      showErrorToast("Error", "Payment SDK not loaded");
                      return;
                    }

                    // 🔴 call backend
                    const res = await fetch(
                      "https://knowvaults.com/api/payments/create-contact-expert-order",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${user?.accessToken}`,
                        },
                        body: JSON.stringify({}),
                      },
                    );

                    const result = await res.json();
                    const order = result.data.order;
                    const key = result.data.keyId;

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
                          await fetch(
                            "https://knowvaults.com/api/payments/unlock-contact",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${user?.accessToken}`,
                              },
                              body: JSON.stringify({
                                vaultId: selectedContact?.vaultId,
                                razorpayPaymentId: response.razorpay_payment_id,
                              }),
                            },
                          );

                          setShowPaymentModal(false);
                          setShowContactModal(true);
                        } catch (err) {
                          showErrorToast("Error", "Failed to unlock contact");
                        }
                      })
                      .catch((error: any) => {
                        showErrorToast(
                          "Failed",
                          error?.description || "Payment failed",
                        );
                      });
                  } catch (err) {
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
      {showContactModal && selectedContact && (
        <Modal
          visible={showContactModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowContactModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center px-4">
            <View className="bg-white rounded-2xl p-6 w-full max-w-md">
              <Text className="text-lg font-bold mb-4 text-center">
                Expert Contact
              </Text>

              <Text className="mb-2">
                Name: {selectedContact?.name || "N/A"}
              </Text>

              <Text className="mb-2">Email: {selectedContact?.email}</Text>

              <Text className="mb-4">Mobile: {selectedContact?.number}</Text>

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
    </SafeAreaView>
  );
}