import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { useSubscriptionStore } from "../../store/subscription-store";
import { useAuthStore } from "../../store/auth-store";
import { SubscriptionPlan } from "../../services/subscription.service";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import RazorpayCheckout from "react-native-razorpay";

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
          text: "text-gray-800",
        };
      case "smart":
        return {
          bg: "bg-blue-100",
          border: "border-blue-400",
          text: "text-blue-900",
        };
      case "pro":
        return {
          bg: "bg-purple-100",
          border: "border-purple-400",
          text: "text-purple-900",
        };
      case "creator":
        return {
          bg: "bg-amber-100",
          border: "border-amber-400",
          text: "text-amber-900",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-800",
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
        return ["#FEF3C7", "#FDE68A"];
      default:
        return ["#F3F4F6", "#E5E7EB"];
    }
  };

  const colors = getPlanColor(plan.planType);
  const gradient = getPlanGradient(plan.planType);
  const isFree = plan.planType === "free";
  const price = parseFloat(plan.price);

  // Get border color from plan type
  const getBorderColor = () => {
    switch (plan.planType) {
      case "free":
        return "#E5E7EB";
      case "smart":
        return "#60A5FA"; // blue-400 - darker, more visible
      case "pro":
        return "#A78BFA"; // purple-400 - darker, more visible
      case "creator":
        return "#FBBF24"; // amber-400 - darker, more visible
      default:
        return "#E5E7EB";
    }
  };

  // Get icon color from plan type
  const getIconColor = () => {
    switch (plan.planType) {
      case "free":
        return "#1F2937"; // gray-800
      case "smart":
        return "#1E3A8A"; // blue-900
      case "pro":
        return "#581C87"; // purple-900
      case "creator":
        return "#78350F"; // amber-900
      default:
        return "#1F2937";
    }
  };

  const iconColor = getIconColor();

  return (
    <View
      className={`rounded-2xl ${colors.bg} mb-4 overflow-hidden`}
      style={[
        styles.planCard,
        { borderColor: getBorderColor() },
        isCurrentPlan && styles.currentPlanBorder,
      ]}
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
            <Ionicons name="checkmark-circle" size={20} color={iconColor} />
            <Text className={`${colors.text} font-outfit-regular ml-2`}>
              {plan.dailyQueriesLimit} queries/day
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={20} color={iconColor} />
            <Text className={`${colors.text} font-outfit-regular ml-2`}>
              {plan.dailyTokensLimit.toLocaleString()} tokens/day
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {isFree ? (
          <TouchableOpacity
            onPress={onSelectFree}
            disabled={isCurrentPlan || !canBuy}
            className={`rounded-xl py-3 px-4 items-center ${
              isCurrentPlan || !canBuy ? "bg-gray-300" : "bg-gray-800"
            }`}
            activeOpacity={0.7}
          >
            <Text className="text-white font-outfit-semi-bold text-base">
              {isCurrentPlan
                ? "Current Plan"
                : !canBuy
                  ? "Cannot Downgrade"
                  : "Select Free Plan"}
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
  const { setSubscriptionStatus } = useSubscriptionStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch current subscription status
  const { data: currentStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["subscriptionStatus", user?.id], // Include user ID to prevent cache sharing
    queryFn: () => subscription.getCurrentStatus(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
    onSuccess: () => {
      showSuccessToast("Success", "Free subscription activated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["subscriptionStatus", user?.id],
      });
    },
    onError: (error: any) => {
      showErrorToast(
        "Error",
        error?.response?.data?.message || "Failed to activate free subscription"
      );
    },
  });

  // Create Razorpay order mutation
  const createOrderMutation = useMutation({
    mutationFn: (planId: string) => subscription.createOrder(planId),
    onError: (error: any) => {
      showErrorToast(
        "Error",
        error?.response?.data?.message || "Failed to create payment order"
      );
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: (data: {
      planId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }) => subscription.verifyPayment(data),
    onSuccess: () => {
      showSuccessToast(
        "Success",
        "Payment successful! Subscription activated."
      );
      queryClient.invalidateQueries({
        queryKey: ["subscriptionStatus", user?.id],
      });
    },
    onError: (error: any) => {
      showErrorToast(
        "Payment Failed",
        error?.response?.data?.message ||
          "Payment verification failed. Please try again."
      );
    },
  });

  // Check if user can buy a new plan
  const canBuyNewPlan = (planType: string) => {
    if (!currentStatus?.subscription) return true; // No subscription, can buy
    
    const currentPlan = currentStatus.subscription.plan;
    
    // Prevent switching from paid plan to free plan
    if (planType === "free" && currentPlan !== "free") {
      return false; // Cannot downgrade from paid to free
    }
    
    if (planType === "free") return true; // Allow free if already on free or no subscription
    if (currentPlan === "free") return true; // Free users can upgrade

    // For paid plans, check if current is expired or exhausted
    const sub = currentStatus.subscription;
    const isExpired = sub.expiresAt && new Date(sub.expiresAt) < new Date();
    const isExhausted =
      sub.queriesUsedToday >= sub.dailyQueriesLimit ||
      sub.tokensUsedToday >= sub.dailyTokensLimit;

    return isExpired || isExhausted;
  };

  const handleBuyPlan = async (plan: SubscriptionPlan) => {
    if (plan.planType === "free") {
      createFreeMutation.mutate();
      return;
    }

    // For paid plans, initiate Razorpay payment
    try {
      // Check if Razorpay is available
      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== "function") {
        showErrorToast(
          "Payment Unavailable",
          "Razorpay payment is not available in this environment. Please use a development build or contact support."
        );
        return;
      }

      // Create order on backend using plan ID
      const orderData = await createOrderMutation.mutateAsync(plan.id);

      if (!orderData.order || !orderData.keyId) {
        showErrorToast(
          "Error",
          "Failed to initialize payment. Please try again."
        );
        return;
      }

      // Prepare Razorpay options
      const options = {
        description: `${plan.name} Subscription`,
        image: undefined, // Optional: Add your app logo URL
        currency: orderData.plan.currency || "INR",
        key: orderData.keyId,
        amount: orderData.order.amount, // Amount in paise (number, not string)
        name: "Connect Knowledge Vault",
        order_id: orderData.order.id,
        prefill: {
          email: user?.email || "",
          contact: (user as any)?.phone || "",
          name: user?.name || "",
        },
        theme: { color: "#3B82F6" }, // App primary color
      };

      // Open Razorpay checkout
      const razorpayResponse = await RazorpayCheckout.open(options);

      // Verify payment on backend using plan ID
      if (razorpayResponse) {
        await verifyPaymentMutation.mutateAsync({
          planId: plan.id,
          razorpayOrderId: razorpayResponse.razorpay_order_id,
          razorpayPaymentId: razorpayResponse.razorpay_payment_id,
          razorpaySignature: razorpayResponse.razorpay_signature,
        });
      }
    } catch (error: any) {
      // Handle Razorpay errors
      if (error?.code === "BAD_REQUEST_ERROR") {
        showErrorToast(
          "Payment Error",
          error?.description || "Invalid payment details"
        );
      } else if (error?.code === "NETWORK_ERROR") {
        showErrorToast(
          "Network Error",
          "Please check your internet connection"
        );
      } else if (error?.code === "INVALID_OPTIONS") {
        showErrorToast("Payment Error", "Invalid payment configuration");
      } else if (error?.code !== "USER_CANCELLED") {
        // Don't show error if user cancelled
        showErrorToast(
          "Payment Failed",
          error?.response?.data?.message ||
            error?.message ||
            "Payment could not be completed"
        );
      }
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

const styles = StyleSheet.create({
  planCard: {
    borderWidth: 2,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  currentPlanBorder: {
    borderWidth: 3,
    borderColor: "#3B82F6",
  },
});
