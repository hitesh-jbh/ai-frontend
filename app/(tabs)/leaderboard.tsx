import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { LeaderboardEntry } from "../../services/leaderboard.service";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { router } from "expo-router";

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
        isActive ? "bg-blue-500" : "bg-gray-100"
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
  const [imageError, setImageError] = React.useState(false);
  const isTopTwo = rank <= 2;
  const badgeColor =
    rank === 1 ? "#F59E0B" : rank === 2 ? "#F59E0B" : "#F97316";
  const cardBgColor = isTopTwo ? "#FEF3C7" : "#FED7AA";
  const normalizedProfilePicture = entry.profilePicture
    ? normalizeImageUrl(entry.profilePicture)
    : null;

  return (
    <View
      className="rounded-2xl p-4 items-center mx-1"
      style={{ backgroundColor: cardBgColor }}
    >
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
        {normalizedProfilePicture && !imageError ? (
          <Image
            source={{ uri: normalizedProfilePicture }}
            style={{ width: 80, height: 80, borderRadius: 40 }}
            contentFit="cover"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <Ionicons name="person" size={32} color="#6B7280" />
        )}
        <View
          className="absolute bottom-0 right-0 rounded-full w-6 h-6 items-center justify-center border-2 border-white"
          style={{ backgroundColor: badgeColor }}
        >
          <Text className="text-white text-xs font-outfit-bold">#{rank}</Text>
        </View>
      </View>
      <Text
        className="text-gray-900 text-sm font-outfit-semi-bold mb-1"
        numberOfLines={1}
      >
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

interface UserListItemProps {
  entry: LeaderboardEntry;
  index: number;
}

const UserListItem: React.FC<UserListItemProps> = ({ entry, index }) => {
  const [imageError, setImageError] = React.useState(false);
  const normalizedProfilePicture = entry.profilePicture
    ? normalizeImageUrl(entry.profilePicture)
    : null;

  return (
    <View className="bg-gray-50 rounded-lg p-4 mb-3 flex-row items-center">
      <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center mr-3 relative overflow-hidden">
        {normalizedProfilePicture && !imageError ? (
          <Image
            source={{ uri: normalizedProfilePicture }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <Ionicons name="person" size={24} color="#6B7280" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 text-base font-outfit-semi-bold">
          {entry.userName} #{entry.rank}
        </Text>
        <Text className="text-gray-600 text-sm font-outfit-regular">
          Content Creator
        </Text>
      </View>
      <View className="flex-row items-center">
        <Ionicons name="logo-bitcoin" size={18} color="#F59E0B" />
        <Text className="text-gray-900 text-base font-outfit-semi-bold ml-1">
          {entry.score} Coins
        </Text>
      </View>
    </View>
  );
};

export default function Leaderboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all");
  const { user } = useAuthStore();
  const { leaderboard } = useServices();

  // Fetch user rank
  const { data: userRankData } = useQuery({
    queryKey: ["userRank", selectedPeriod],
    queryFn: () => leaderboard.getUserRank(selectedPeriod),
    enabled: !!user,
  });

  // Infinite query for leaderboard entries
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["leaderboard", selectedPeriod],
    queryFn: ({ pageParam = 0 }) =>
      leaderboard.getTopUsers(20, pageParam, selectedPeriod),
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (sum, page) => sum + page.entries.length,
        0
      );
      return totalLoaded < lastPage.total ? totalLoaded : undefined;
    },
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const allEntries = data?.pages.flatMap((page) => page.entries) || [];
  const topThree = allEntries.slice(0, 3);
  const remainingEntries = allEntries.slice(3);

  const periods: { key: Period; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    refetch();
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Leaderboard"
        showBackButton
        onBackPress={() => router.push("/(tabs)/home")}
      />

      <FlatList
        data={remainingEntries}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => (
          <UserListItem entry={item} index={index + 4} />
        )}
        ListHeaderComponent={
          <View className="pb-6">
            {/* Period Tabs */}
            <View className="flex-row gap-2 mb-6">
              {periods.map((period) => (
                <TabButton
                  key={period.key}
                  label={period.label}
                  isActive={selectedPeriod === period.key}
                  onPress={() => handlePeriodChange(period.key)}
                />
              ))}
            </View>

            {/* Your Rank Section */}
            {userRankData?.entry && (
              <View className="bg-blue-500 rounded-2xl p-6 mb-6">
                <Text className="text-white text-2xl font-outfit-bold mb-2">
                  Your Rank
                </Text>
                <Text className="text-white/90 text-sm font-outfit-regular mb-6">
                  Here's where you stand in the competition
                </Text>

                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1 bg-white/20 rounded-lg p-4">
                    <Text className="text-white text-2xl font-outfit-bold mb-1">
                      #{userRankData.entry.rank}
                    </Text>
                    <Text className="text-white/80 text-xs font-outfit-regular">
                      Out of {userRankData.totalUsers} users
                    </Text>
                  </View>
                  <View className="flex-1 bg-white/20 rounded-lg p-4">
                    <Text className="text-white text-2xl font-outfit-bold mb-1">
                      {userRankData.entry.score}
                    </Text>
                    <Text className="text-white/80 text-xs font-outfit-regular">
                      Coins earned
                    </Text>
                  </View>
                  <View className="flex-1 bg-white/20 rounded-lg p-4">
                    <Text className="text-white text-2xl font-outfit-bold mb-1">
                      #{Math.max(1, userRankData.entry.rank - 1)}
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
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              ) : topThree.length > 0 ? (
                <View className="flex-row justify-between">
                  {topThree.map((entry, index) => (
                    <TopContributorCard
                      key={entry.userId}
                      entry={entry}
                      rank={index + 1}
                    />
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

            {/* User List Header */}
            {remainingEntries.length > 0 && (
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-gray-900 text-base font-outfit-semi-bold">
                    User
                  </Text>
                  <Text className="text-gray-900 text-base font-outfit-semi-bold">
                    Coins
                  </Text>
                </View>
              </View>
            )}
          </View>
        }
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        contentContainerClassName="px-6 pb-6"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
