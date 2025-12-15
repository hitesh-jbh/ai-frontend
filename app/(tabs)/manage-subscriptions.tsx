import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { useSubscriptionStore } from "../../store/subscription-store";
import { SubscriptionPlan, SubscriptionStatus } from "../../services/subscription.service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { showSuccessToast, showErrorToast, showInfoToast } from "../../utils/toast";

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  canBuy: boolean;
  onBuy: () => void;
  onSelectFree: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan,
  canBuy,
  onBuy,
  onSelectFree,
}) => {
  const getPlanColor = (planType: string) => {
    switch (planType) {
      case "free":
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-700",
        };
      case "smart":
        return {
          bg: "bg-blue-50",
          border: "border-blue-300",
          text: "text-blue-700",
        };
      case "pro":
        return {
          bg: "bg-purple-50",
          border: "border-purple-300",
          text: "text-purple-700",
        };
      case "creator":
        return {
          bg: "bg-orange-50",
          border: "border-orange-300",
          text: "text-orange-700",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-700",
        };
    }
  };

  const getPlanGradient = (planType: string): [string, string] => {
    switch (planType) {
      case "free":
        return ["#F3F4F6", "#E5E7EB"];
      case "smart":
        return ["#DBEAFE", "#BFDBFE"];
      case "pro":
        return ["#E9D5FF", "#DDD6FE"];
      case "creator":
        return ["#FED7AA", "#FED7AA"];
      default:
        return ["#F3F4F6", "#E5E7EB"];
    }
  };

  const colors = getPlanColor(plan.planType);
  const gradient = getPlanGradient(plan.planType);
  const isFree = plan.planType === "free";
  const price = parseFloat(plan.price);

  return (
    <View
      className={`rounded-2xl border-2 ${colors.border} ${colors.bg} mb-4 overflow-hidden ${
        isCurrentPlan ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-6"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text
              className={`text-2xl font-outfit-bold ${colors.text} uppercase`}
            >
              {plan.name}
            </Text>
            {plan.description && (
              <Text
                className={`text-sm font-outfit-regular ${colors.text} opacity-80 mt-1`}
              >
                {plan.description}
              </Text>
            )}
          </View>
          {isCurrentPlan && (
            <View className="bg-green-500 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-outfit-semi-bold">
                Current
              </Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View className="mb-4">
          {isFree ? (
            <Text className={`text-3xl font-outfit-bold ${colors.text}`}>
              Free
            </Text>
          ) : (
            <View className="flex-row items-baseline">
              <Text className={`text-3xl font-outfit-bold ${colors.text}`}>
                ₹{price.toFixed(0)}
              </Text>
              <Text
                className={`text-base font-outfit-regular ${colors.text} opacity-70 ml-2`}
              >
                /month
              </Text>
            </View>
          )}
        </View>

        {/* Features */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.text.split("-")[1]}
            />
            <Text className={`${colors.text} font-outfit-regular ml-2`}>
              {plan.dailyQueriesLimit} queries/day
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.text.split("-")[1]}
            />
            <Text className={`${colors.text} font-outfit-regular ml-2`}>
              {plan.dailyTokensLimit.toLocaleString()} tokens/day
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {isFree ? (
          <TouchableOpacity
            onPress={onSelectFree}
            disabled={isCurrentPlan}
            className={`rounded-xl py-3 px-4 items-center ${
              isCurrentPlan ? "bg-gray-300" : "bg-gray-800"
            }`}
            activeOpacity={0.7}
          >
            <Text className="text-white font-outfit-semi-bold text-base">
              {isCurrentPlan ? "Current Plan" : "Select Free Plan"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onBuy}
            disabled={!canBuy || isCurrentPlan}
            className={`rounded-xl py-3 px-4 items-center ${
              !canBuy || isCurrentPlan ? "bg-gray-300" : "bg-blue-600"
            }`}
            activeOpacity={0.7}
          >
            <Text className="text-white font-outfit-semi-bold text-base">
              {isCurrentPlan
                ? "Current Plan"
                : !canBuy
                  ? "Upgrade Later"
                  : "Buy Now"}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

export default function ManageSubscriptions() {
  const { subscription } = useServices();
  const { subscriptionStatus, setSubscriptionStatus } = useSubscriptionStore();
  const queryClient = useQueryClient();

  // Fetch current subscription status
  const {
    data: currentStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["subscriptionStatus"],
    queryFn: () => subscription.getCurrentStatus(),
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch available plans with infinite scroll
  const {
    data: plansData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPlans,
    error: plansError,
  } = useInfiniteQuery({
    queryKey: ["subscriptionPlans"],
    queryFn: async ({ pageParam = 1 }) => {
      return subscription.getPlans(pageParam, 10);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const plans = plansData?.pages.flatMap((page) => page.plans) || [];

  // Update store when status is fetched
  useEffect(() => {
    if (currentStatus) {
      setSubscriptionStatus(currentStatus);
    }
  }, [currentStatus, setSubscriptionStatus]);

  // Create free subscription mutation
  const createFreeMutation = useMutation({
    mutationFn: () => subscription.createFreeSubscription(),
    onSuccess: (newSubscription) => {
      // Show success toast
      showSuccessToast("Success", "Free subscription activated successfully!");
      
      // Manually update the store with the new subscription to avoid refetch
      // This prevents navigation context issues
      const updatedStatus: SubscriptionStatus = {
        hasSubscription: true,
        subscription: newSubscription,
        canSearch: true,
        usage: {
          queriesUsedToday: newSubscription.queriesUsedToday,
          dailyQueriesLimit: newSubscription.dailyQueriesLimit,
          tokensUsedToday: newSubscription.tokensUsedToday,
          dailyTokensLimit: newSubscription.dailyTokensLimit,
        },
      };
      
      // Update store directly
      setSubscriptionStatus(updatedStatus);
      
      // Update query cache optimistically without triggering refetch
      queryClient.setQueryData(["subscriptionStatus"], updatedStatus);
    },
    onError: (error: any) => {
      showErrorToast(
        "Error",
        error?.response?.data?.message || "Failed to activate free subscription"
      );
    },
  });

  // Check if user can buy a new plan
  const canBuyNewPlan = (planType: string) => {
    if (!currentStatus?.subscription) return true; // No subscription, can buy
    if (planType === "free") return true; // Always allow free
    if (currentStatus.subscription.plan === "free") return true; // Free users can upgrade

    // For paid plans, check if current is expired or exhausted
    const sub = currentStatus.subscription;
    const isExpired = sub.expiresAt && new Date(sub.expiresAt) < new Date();
    const isExhausted =
      sub.queriesUsedToday >= sub.dailyQueriesLimit ||
      sub.tokensUsedToday >= sub.dailyTokensLimit;

    return isExpired || isExhausted;
  };

  const handleBuyPlan = (plan: SubscriptionPlan) => {
    if (plan.planType === "free") {
      createFreeMutation.mutate();
    } else {
      // For paid plans, show info toast that payment integration is needed
      showInfoToast(
        "Payment Integration",
        "Payment integration with Razorpay will be implemented. For now, please contact support."
      );
    }
  };

  const handleSelectFree = () => {
    createFreeMutation.mutate();
  };

  const currentPlan = currentStatus?.subscription;
  const isLoading = isLoadingStatus || isLoadingPlans;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Manage Subscriptions" showBackButton />

      <View className="flex-1">
        {/* Current Plan Status - Fixed Header */}
        {currentStatus && (
          <View className="px-6 pt-4 pb-2">
            <View className="bg-blue-50 rounded-2xl p-5 mb-4 border border-blue-200">
              <Text className="text-blue-900 text-lg font-outfit-bold mb-2">
                Current Plan Status
              </Text>
              {currentStatus.hasSubscription && currentPlan ? (
                <View>
                  <Text className="text-blue-800 text-base font-outfit-semi-bold capitalize">
                    {currentPlan.plan} Plan
                  </Text>
                  <View className="mt-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-blue-700 text-sm font-outfit-regular">
                        Queries Used
                      </Text>
                      <Text className="text-blue-900 text-sm font-outfit-semi-bold">
                        {currentPlan.queriesUsedToday} /{" "}
                        {currentPlan.dailyQueriesLimit}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-blue-700 text-sm font-outfit-regular">
                        Tokens Used
                      </Text>
                      <Text className="text-blue-900 text-sm font-outfit-semi-bold">
                        {currentPlan.tokensUsedToday.toLocaleString()} /{" "}
                        {currentPlan.dailyTokensLimit.toLocaleString()}
                      </Text>
                    </View>
                    {currentPlan.expiresAt && (
                      <View className="flex-row items-center justify-between">
                        <Text className="text-blue-700 text-sm font-outfit-regular">
                          Expires On
                        </Text>
                        <Text className="text-blue-900 text-sm font-outfit-semi-bold">
                          {new Date(currentPlan.expiresAt).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!currentStatus.canSearch && (
                    <View className="mt-3 bg-red-100 rounded-lg p-3">
                      <Text className="text-red-800 text-sm font-outfit-regular">
                        ⚠️ Your daily limit has been reached. Please upgrade or
                        wait for reset.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text className="text-blue-800 text-sm font-outfit-regular">
                  No active subscription. Please select a plan below.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 text-sm font-outfit-regular mt-4">
              Loading plans...
            </Text>
          </View>
        )}

        {/* Error State */}
        {plansError && (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
              Failed to load plans
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Please try again later
            </Text>
          </View>
        )}

        {/* Plans List with Infinite Scroll */}
        {!isLoading && !plansError && (
          <FlatList
            data={plans}
            renderItem={({ item: plan }) => (
              <View className="px-6">
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={currentPlan?.plan === plan.planType}
                  canBuy={canBuyNewPlan(plan.planType)}
                  onBuy={() => handleBuyPlan(plan)}
                  onSelectFree={handleSelectFree}
                />
              </View>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListHeaderComponent={
              plans.length > 0 ? (
                <View className="px-6 pb-4">
                  <Text className="text-gray-900 text-xl font-outfit-bold">
                    Available Plans
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20 px-6">
                <Ionicons name="card-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
                  No plans available
                </Text>
              </View>
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#3B82F6" />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
