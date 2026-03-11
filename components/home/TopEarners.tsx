import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LeaderboardEntry } from "../../services/leaderboard.service";
import { normalizeImageUrl } from "../../utils/imageUrl";

interface TopEarnersProps {
  earners: LeaderboardEntry[];
  isLoading?: boolean;
}

export const TopEarners: React.FC<TopEarnersProps> = ({
  earners = [],
  isLoading = false,
}) => {
  const handleLeaderboardsPress = () => {
    router.push("/(tabs)/leaderboard");
  };

  // Ensure earners is always an array
  const safeEarners = Array.isArray(earners) ? earners : [];

  return (
    <View className="bg-white rounded-lg p-4 mb-6">
      <View className="flex-row justify-between items-center mb-8">
        <View className="flex-row items-center">
          <Ionicons name="people" size={20} color="#3B82F6" />
          <Text className="text-gray-900 text-xl font-outfit-bold ml-2">
            Top earners
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLeaderboardsPress}
          className="flex-row items-center"
          activeOpacity={0.7}
        >
          <Text className="text-blue-500 text-base font-outfit-semi-bold mr-1">
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
      ) : safeEarners.length === 0 ? (
        <View className="py-8 items-center">
          <Text className="text-gray-500 text-sm font-outfit-regular">
            No earners yet
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {safeEarners.map((earner, index) => {
            const [imageError, setImageError] = React.useState(false);
            const normalizedProfilePicture = earner.profilePicture
              ? normalizeImageUrl(earner.profilePicture)
              : null;

            return (
              <View
                key={earner.userId}
                className="flex-row items-center justify-between bg-gray-100 rounded-2xl p-4"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-14 h-14 bg-gray-200 rounded-full items-center justify-center mr-3 overflow-hidden">
                    {normalizedProfilePicture && !imageError ? (
                      <Image
                        source={{ uri: normalizedProfilePicture }}
                        style={{ width: 42, height: 42, borderRadius: 20 }}
                        contentFit="cover"
                        transition={200}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <Ionicons name="person" size={20} color="#6B7280" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 text-base font-outfit-semi-bold">
                      {earner.userName} #{earner.rank}
                    </Text>
                    <Text className="text-gray-600 text-sm font-outfit-regular">
                      Content Creator
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-900 text-base font-outfit-semi-bold">
                  {earner.score} Coins
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};
