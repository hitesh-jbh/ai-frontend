import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { LeaderboardEntry } from "../../services/leaderboard.service";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";

type Period = "all" | "daily" | "weekly" | "monthly";

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full ${
        isActive ? "bg-blue-500" : "bg-white"
      }`}
      activeOpacity={0.7}
    >
      <Text
        className={`text-sm font-outfit-semi-bold ${
          isActive ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface TopContributorCardProps {
  entry: LeaderboardEntry;
  rank: number;
}

const TopContributorCard: React.FC<TopContributorCardProps> = ({
  entry,
  rank,
}) => {
  const isTopTwo = rank <= 2;
  const badgeColor =
    rank === 1 ? "#F59E0B" : rank === 2 ? "#F59E0B" : "#F97316";

  return (
    <View className="bg-white rounded-lg p-4 mb-4 items-center">
      {isTopTwo ? (
        <Ionicons
          name="trophy"
          size={24}
          color="#F59E0B"
          style={{ marginBottom: 8 }}
        />
      ) : (
        <Ionicons
          name="medal"
          size={24}
          color="#F97316"
          style={{ marginBottom: 8 }}
        />
      )}
      <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-2 relative">
        <Ionicons name="person" size={32} color="#6B7280" />
        <View
          className="absolute bottom-0 right-0 bg-yellow-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white"
          style={{ backgroundColor: badgeColor }}
        >
          <Text className="text-white text-xs font-outfit-bold">#{rank}</Text>
        </View>
      </View>
      <Text className="text-gray-900 text-base font-outfit-semi-bold mb-1">
        {entry.userName}
      </Text>
      <View className="flex-row items-center">
        <Ionicons
          name="logo-bitcoin"
          size={16}
          color={isTopTwo ? "#F59E0B" : "#F97316"}
        />
        <Text
          className="text-sm font-outfit-semi-bold ml-1"
          style={{ color: isTopTwo ? "#F59E0B" : "#F97316" }}
        >
          {entry.score}
        </Text>
      </View>
    </View>
  );
};

export default function Leaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all");
  const { user } = useAuthStore();
  const { leaderboard } = useServices();

  const { data: topUsers, isLoading } = useQuery({
    queryKey: ["leaderboard", selectedPeriod],
    queryFn: () => leaderboard.getTopUsers(10),
  });

  const { data: userRank } = useQuery({
    queryKey: ["userRank"],
    queryFn: () => leaderboard.getUserRank(),
    enabled: !!user,
  });

  const periods: { key: Period; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Leaderboard" showBackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          {/* Period Tabs */}
          <View className="flex-row gap-2 mb-6">
            {periods.map((period) => (
              <TabButton
                key={period.key}
                label={period.label}
                isActive={selectedPeriod === period.key}
                onPress={() => setSelectedPeriod(period.key)}
              />
            ))}
          </View>

          {/* Your Rank Section */}
          {userRank && (
            <View className="bg-blue-500 rounded-2xl p-6 mb-6">
              <Text className="text-white text-xl font-outfit-bold mb-2">
                Your Rank
              </Text>
              <Text className="text-white/90 text-sm font-outfit-regular mb-6">
                Here's where you stand in the competition
              </Text>

              <View className="flex-row gap-4 mb-4">
                <View className="flex-1 bg-white/20 rounded-lg p-4">
                  <Text className="text-white text-2xl font-outfit-bold mb-1">
                    #{userRank.rank}
                  </Text>
                  <Text className="text-white/80 text-xs font-outfit-regular">
                    Out of 10 users
                  </Text>
                </View>
                <View className="flex-1 bg-white/20 rounded-lg p-4">
                  <Text className="text-white text-2xl font-outfit-bold mb-1">
                    {userRank.score}
                  </Text>
                  <Text className="text-white/80 text-xs font-outfit-regular">
                    Coins earned
                  </Text>
                </View>
                <View className="flex-1 bg-white/20 rounded-lg p-4">
                  <Text className="text-white text-2xl font-outfit-bold mb-1">
                    #{userRank.rank - 1}
                  </Text>
                  <Text className="text-white/80 text-xs font-outfit-regular">
                    Climb higher!
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="flame" size={16} color="#FFFFFF" />
                <Text className="text-white text-sm font-outfit-medium ml-1">
                  Amazing! You're on the podium!
                </Text>
              </View>
            </View>
          )}

          {/* Top Contributors */}
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Ionicons name="people" size={20} color="#3B82F6" />
              <Text className="text-gray-900 text-lg font-outfit-bold ml-2">
                Our top contributors
              </Text>
            </View>

            {isLoading ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-sm font-outfit-regular">
                  Loading...
                </Text>
              </View>
            ) : topUsers && topUsers.length > 0 ? (
              <View className="flex-row flex-wrap justify-between">
                {topUsers.slice(0, 3).map((entry, index) => (
                  <View key={entry.userId} className="w-[48%]">
                    <TopContributorCard entry={entry} rank={index + 1} />
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-sm font-outfit-regular">
                  No contributors yet
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
