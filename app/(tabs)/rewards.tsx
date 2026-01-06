import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Button } from "../../components/ui/Button";
import { useServices } from "../../hooks/useServices";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

export default function Rewards() {
  const { reward, coinRedemption, profile } = useServices();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [coinsToRedeem, setCoinsToRedeem] = useState("");
  const [upiId, setUpiId] = useState("");

  // Fetch user profile to get UPI ID
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.getProfile(),
    enabled: !!user,
  });

  // Fetch rewards
  const { data: rewards, isLoading: isLoadingRewards } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => reward.getUserRewards(),
  });

  // Fetch points
  const { data: points, isLoading: isLoadingPoints } = useQuery({
    queryKey: ["userPoints"],
    queryFn: () => reward.getUserPoints(),
  });

  // Fetch redemption history
  const { data: redemptions, isLoading: isLoadingRedemptions } = useQuery({
    queryKey: ["coinRedemptions"],
    queryFn: () => coinRedemption.getUserRedemptions(),
  });

  // Set UPI ID from profile when modal opens
  React.useEffect(() => {
    if (showRedemptionModal && profileData) {
      setUpiId((profileData as any)?.upiId || "");
    }
  }, [showRedemptionModal, profileData]);

  // Request redemption mutation
  const requestRedemptionMutation = useMutation({
    mutationFn: (data: { coins: number; upiId: string }) =>
      coinRedemption.requestRedemption(data),
    onSuccess: () => {
      setShowRedemptionModal(false);
      setCoinsToRedeem("");
      setUpiId("");
      queryClient.invalidateQueries({ queryKey: ["coinRedemptions"] });
      queryClient.invalidateQueries({ queryKey: ["userPoints"] });
      showSuccessToast("Success", "Redemption request submitted successfully!");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit redemption request";
      showErrorToast("Error", errorMessage);
    },
  });

  const handleRequestRedemption = () => {
    const coins = parseInt(coinsToRedeem, 10);

    if (!coins || coins <= 0) {
      showErrorToast("Error", "Please enter a valid number of coins");
      return;
    }

    const availableCoins = points?.availablePoints || user?.points || 0;
    if (coins > availableCoins) {
      showErrorToast("Error", "You don't have enough coins to redeem");
      return;
    }

    if (!upiId || upiId.trim() === "") {
      showErrorToast("Error", "Please enter your UPI ID");
      return;
    }

    // Basic UPI validation (format: xxx@upi)
    if (!upiId.includes("@")) {
      showErrorToast("Error", "Please enter a valid UPI ID (e.g., yourname@upi)");
      return;
    }

    requestRedemptionMutation.mutate({
      coins,
      upiId: upiId.trim(),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "completed":
        return "Completed";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const availableCoins = points?.availablePoints || user?.points || 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Rewards"
        showBackButton
        onBackPress={() => router.push("/(tabs)/options")}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          {/* Points Summary */}
          <View className="bg-blue-500 rounded-2xl p-6 mb-6">
            <Text className="text-white text-sm font-outfit-regular mb-2">
              Total Points
            </Text>
            <Text className="text-white text-4xl font-outfit-bold mb-1">
              {isLoadingPoints ? "..." : availableCoins}
            </Text>
            <Text className="text-white/80 text-sm font-outfit-regular">
              Available: {isLoadingPoints ? "..." : availableCoins} coins
            </Text>
          </View>

          {/* Redeem Coins Button */}
          <TouchableOpacity
            className="bg-green-500 rounded-xl p-4 mb-6 flex-row items-center justify-center"
            onPress={() => {
              if (!(profileData as any)?.upiId) {
                Alert.alert(
                  "UPI ID Required",
                  "Please add your UPI ID in your profile settings to redeem coins.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Go to Profile",
                      onPress: () => router.push("/(tabs)/edit-profile"),
                    },
                  ]
                );
                return;
              }
              setShowRedemptionModal(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
            <Text className="text-white text-base font-outfit-semi-bold ml-2">
              Redeem Coins
            </Text>
          </TouchableOpacity>

          {/* Redemption History */}
          {redemptions && redemptions.length > 0 && (
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-outfit-bold mb-4">
                Redemption History
              </Text>
              <View className="gap-3">
                {redemptions.map((redemption) => (
                  <View
                    key={redemption.id}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View className="bg-purple-100 rounded-full p-2 mr-3">
                          <Ionicons name="wallet-outline" size={20} color="#9333EA" />
                        </View>
                        <View>
                          <Text className="text-gray-900 text-base font-outfit-semi-bold">
                            {redemption.coins} Coins
                          </Text>
                          <Text className="text-gray-600 text-sm font-outfit-regular">
                            UPI: {redemption.upiId}
                          </Text>
                        </View>
                      </View>
                      <View
                        className={`rounded-full px-3 py-1 ${getStatusColor(
                          redemption.status
                        )}`}
                      >
                        <Text
                          className={`text-xs font-outfit-semi-bold ${
                            getStatusColor(redemption.status).split(" ")[1] ||
                            "text-gray-700"
                          }`}
                        >
                          {getStatusLabel(redemption.status)}
                        </Text>
                      </View>
                    </View>
                    {redemption.adminNotes && (
                      <Text className="text-gray-500 text-xs font-outfit-regular mt-2">
                        Note: {redemption.adminNotes}
                      </Text>
                    )}
                    <Text className="text-gray-500 text-xs font-outfit-regular mt-2">
                      {new Date(redemption.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Rewards History */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-outfit-bold mb-4">
              Reward History
            </Text>

            {isLoadingRewards ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-sm font-outfit-regular">
                  Loading rewards...
                </Text>
              </View>
            ) : rewards && rewards.length > 0 ? (
              <View className="gap-3">
                {rewards.map((reward) => (
                  <View
                    key={reward.id}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View className="bg-green-100 rounded-full p-2 mr-3">
                          <Ionicons name="gift" size={20} color="#10B981" />
                        </View>
                        <View>
                          <Text className="text-gray-900 text-base font-outfit-semi-bold">
                            +{reward.points} Points
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-gray-500 text-xs font-outfit-regular mt-2">
                      {new Date(reward.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-8 items-center">
                <Ionicons name="gift-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
                  No rewards yet
                </Text>
                <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
                  Start creating content to earn rewards!
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Redemption Request Modal */}
      <Modal
        visible={showRedemptionModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRedemptionModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setShowRedemptionModal(false)}
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
                    Redeem Coins
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowRedemptionModal(false);
                      setCoinsToRedeem("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Content */}
              <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="p-6">
                  <View className="mb-4">
                    <Text className="text-gray-700 text-sm font-outfit-regular mb-2">
                      Available Coins: {availableCoins}
                    </Text>
                    <Text className="text-gray-900 text-base font-outfit-semi-bold mb-3">
                      Coins to Redeem
                    </Text>
                    <TextInput
                      value={coinsToRedeem}
                      onChangeText={setCoinsToRedeem}
                      placeholder="Enter amount"
                      keyboardType="number-pad"
                      placeholderTextColor="#9CA3AF"
                      className="border border-gray-300 rounded-lg p-4 text-gray-900 text-base font-outfit-regular"
                    />
                  </View>

                  <View className="mb-6">
                    <Text className="text-gray-900 text-base font-outfit-semi-bold mb-3">
                      UPI ID
                    </Text>
                    <TextInput
                      value={upiId}
                      onChangeText={setUpiId}
                      placeholder="yourname@upi"
                      placeholderTextColor="#9CA3AF"
                      className="border border-gray-300 rounded-lg p-4 text-gray-900 text-base font-outfit-regular"
                    />
                    <Text className="text-gray-500 text-xs font-outfit-regular mt-2">
                      Payment will be sent to this UPI ID after approval
                    </Text>
                  </View>

                  <Button
                    title="Submit Request"
                    onPress={handleRequestRedemption}
                    loading={requestRedemptionMutation.isPending}
                  />
                </View>
              </KeyboardAwareScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
