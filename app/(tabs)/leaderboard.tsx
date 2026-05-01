import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
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
        className={`text-base font-outfit-semi-bold ${
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
          <Text className="text-white text-sm font-outfit-bold">#{rank}</Text>
        </View>
      </View>
      <Text
        className="text-gray-900 text-base font-outfit-semi-bold mb-1"
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
          className="text-base font-outfit-semi-bold ml-1"
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
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;
  const contentPaddingX = isNarrow ? 16 : 24;

  // Fetch user rank
  const { data: userRankData } = useQuery({
    queryKey: ["userRank", selectedPeriod],
    queryFn: () => leaderboard.getUserRank(selectedPeriod),
    enabled: !!user,
  });

  // Infinite query for leaderboard entries
  // First page fetches top 3 (for cards), subsequent pages fetch 20 at a time
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["leaderboard", selectedPeriod],
    queryFn: ({ pageParam = 0 }) => {
      // First page: get top 3 for cards
      // Subsequent pages: get 20 at a time for list
      const limit = pageParam === 0 ? 3 : 20;
      const offset = pageParam === 0 ? 0 : 3 + (pageParam - 1) * 20;
      return leaderboard.getTopUsers(limit, offset, selectedPeriod);
    },
    getNextPageParam: (lastPage, allPages) => {
      // Calculate total entries loaded so far
      const totalLoaded = allPages.reduce(
        (sum, page) => sum + page.entries.length,
        0
      );
      // If we've loaded less than total, return next page number
      if (totalLoaded < lastPage.total) {
        return allPages.length; // Next page number
      }
      return undefined; // No more pages
    },
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const allEntries = data?.pages.flatMap((page) => page.entries) || [];
  // Top 3 are always from the first page (which fetches 3 entries)
  const topThree = data?.pages[0]?.entries.slice(0, 3) || [];
  // Remaining entries are from all pages, excluding the first 3
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

  const topCardWidth = Math.max(
    108,
    Math.floor((width - contentPaddingX * 2 - 8 * 2) / 3)
  );

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
          <UserListItem entry={item} index={topThree.length + index + 1} />
        )}
        ListHeaderComponent={
          <View className="pb-3">
            {/* Period Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              className="mb-6"
            >
              {periods.map((period) => (
                <TabButton
                  key={period.key}
                  label={period.label}
                  isActive={selectedPeriod === period.key}
                  onPress={() => handlePeriodChange(period.key)}
                />
              ))}
            </ScrollView>

            {/* Your Rank Section */}
            {userRankData?.entry && (
              <View className="bg-blue-500 rounded-2xl p-6 mb-6">
                <Text className="text-white text-2xl font-outfit-bold mb-2">
                  Your Rank
                </Text>
                <Text className="text-white/90 text-base font-outfit-regular mb-6">
                  Here's where you stand in the competition
                </Text>

                <View className="flex-row flex-wrap gap-3 mb-4">
                  <View
                    className="bg-white/20 rounded-lg p-4"
                    style={{
                      flexGrow: 1,
                      flexBasis: isNarrow ? "48%" : "30%",
                    }}
                  >
                    <Text className="text-white text-2xl font-outfit-bold mb-1">
                      #{userRankData.entry.rank}
                    </Text>
                    <Text className="text-white/80 text-sm font-outfit-regular">
                      Out of {userRankData.totalUsers} users
                    </Text>
                  </View>
                  <View
                    className="bg-white/20 rounded-lg p-4"
                    style={{
                      flexGrow: 1,
                      flexBasis: isNarrow ? "48%" : "30%",
                    }}
                  >
                    <Text className="text-white text-2xl font-outfit-bold mb-1">
                      {userRankData.entry.score}
                    </Text>
                    <Text className="text-white/80 text-sm font-outfit-regular">
                      Coins earned
                    </Text>
                  </View>
                  <View
                    className="bg-white/20 rounded-lg p-4"
                    style={{
                      flexGrow: 1,
                      flexBasis: isNarrow ? "48%" : "30%",
                    }}
                  >
                    <Text className="text-white text-2xl font-outfit-bold mb-1">
                      #{Math.max(1, userRankData.entry.rank - 1)}
                    </Text>
                    <Text className="text-white/80 text-sm font-outfit-regular">
                      Climb higher!
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Ionicons name="flame" size={16} color="#FFFFFF" />
                  <Text className="text-white text-base font-outfit-medium ml-1">
                    Amazing! You're on the podium!
                  </Text>
                </View>
              </View>
            )}

            {/* Top Contributors */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <Ionicons name="people" size={20} color="#3B82F6" />
                <Text className="text-gray-900 text-xl font-outfit-bold ml-2">
                  Our top contributors
                </Text>
              </View>

              {isLoading && topThree.length === 0 ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              ) : topThree.length > 0 ? (
                <View className="flex-row justify-between">
                  {topThree.map((entry, index) => (
                    <View
                      key={entry.userId}
                      style={{ width: topCardWidth }}
                    >
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

            {/* User List Header */}
            {remainingEntries.length > 0 && (
              <View className="px-2">
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
        contentContainerStyle={{ paddingHorizontal: contentPaddingX, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
