import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";

export default function Rewards() {
  const { reward } = useServices();
  const { user } = useAuthStore();

  const { data: rewards, isLoading: isLoadingRewards } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => reward.getUserRewards(),
  });

  const { data: points, isLoading: isLoadingPoints } = useQuery({
    queryKey: ["userPoints"],
    queryFn: () => reward.getUserPoints(),
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Rewards" showBackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          {/* Points Summary */}
          <View className="bg-blue-500 rounded-2xl p-6 mb-6">
            <Text className="text-white text-sm font-outfit-regular mb-2">
              Total Points
            </Text>
            <Text className="text-white text-4xl font-outfit-bold mb-1">
              {isLoadingPoints
                ? "..."
                : points?.totalPoints || user?.points || 0}
            </Text>
            <Text className="text-white/80 text-sm font-outfit-regular">
              Available:{" "}
              {isLoadingPoints ? "..." : points?.availablePoints || 0} points
            </Text>
          </View>

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
                          <Text className="text-gray-600 text-sm font-outfit-regular">
                            {reward.reason}
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
    </SafeAreaView>
  );
}
