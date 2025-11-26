import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LeaderboardEntry } from "../../services/leaderboard.service";

interface TopEarnersProps {
  earners: LeaderboardEntry[];
  isLoading?: boolean;
}

export const TopEarners: React.FC<TopEarnersProps> = ({
  earners,
  isLoading = false,
}) => {
  const handleLeaderboardsPress = () => {
    router.push("/(tabs)/leaderboard");
  };

  return (
    <View className="bg-white rounded-lg p-4 mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name="people" size={20} color="#3B82F6" />
          <Text className="text-gray-900 text-lg font-outfit-bold ml-2">
            Top earners
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLeaderboardsPress}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Text className="text-blue-500 text-sm font-outfit-semi-bold mr-1">
            Leaderboards
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="py-8 items-center">
          <Text className="text-gray-500 text-sm font-outfit-regular">
            Loading...
          </Text>
        </View>
      ) : earners.length === 0 ? (
        <View className="py-8 items-center">
          <Text className="text-gray-500 text-sm font-outfit-regular">
            No earners yet
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {earners.map((earner, index) => (
            <View
              key={earner.userId}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3">
                  <Ionicons name="person" size={20} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-sm font-outfit-semi-bold">
                    {earner.userName} #{earner.rank}
                  </Text>
                  <Text className="text-gray-600 text-xs font-outfit-regular">
                    Content Creator
                  </Text>
                </View>
              </View>
              <Text className="text-gray-900 text-sm font-outfit-semi-bold">
                {earner.score} Coins
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

