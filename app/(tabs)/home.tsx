import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "../../components/ui/SearchBar";
import { StatCard } from "../../components/ui/StatCard";
import { TrendingBanner } from "../../components/home/TrendingBanner";
import { AnalyticsChart } from "../../components/home/AnalyticsChart";
import { TopEarners } from "../../components/home/TopEarners";
import { useServices } from "../../hooks/useServices";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { normalizeImageUrl } from "../../utils/imageUrl";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [profileImageError, setProfileImageError] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { leaderboard, profile } = useServices();

  // Fetch latest profile data to get profile picture
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.getProfile(),
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
  });

  const displayUser = profileData || user;
  const normalizedProfilePicture = normalizeImageUrl(
    displayUser?.profilePicture
  );

  // Reset error state when profile picture changes
  useEffect(() => {
    if (normalizedProfilePicture) {
      setProfileImageError(false);
    }
  }, [normalizedProfilePicture]);

  const { data: topEarnersData, isLoading: isLoadingEarners } = useQuery({
    queryKey: ["topEarners"],
    queryFn: () => leaderboard.getTopUsers(10, 0, "all"),
  });

  const topEarners = topEarnersData?.entries || [];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: "/(tabs)/search",
        params: { query: searchQuery.trim() },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View
        className="px-6 bg-white"
        style={{
          minHeight: 180,
          justifyContent: "flex-end",
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-gray-900 text-4xl font-outfit-bold mb-1">
              Connect
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular">
              Trusted by creators across the globe.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <View className="w-16 h-16 bg-gray-200 rounded-full items-center justify-center overflow-hidden">
              {normalizedProfilePicture && !profileImageError ? (
                <Image
                  key={normalizedProfilePicture} // Force re-render when URL changes
                  source={{ uri: normalizedProfilePicture }}
                  style={{ width: 50, height: 50 }}
                  contentFit="cover"
                  transition={200}
                  onError={(e) => {
                    console.error(
                      "Failed to load profile picture:",
                      normalizedProfilePicture,
                      e
                    );
                    setProfileImageError(true);
                  }}
                  onLoad={() => {
                    console.log(
                      "Profile picture loaded:",
                      normalizedProfilePicture
                    );
                    setProfileImageError(false);
                  }}
                />
              ) : displayUser?.name ? (
                <Text className="text-gray-600 font-outfit-semi-bold text-sm">
                  {displayUser.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Ionicons name="person" size={20} color="#6B7280" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="mb-6">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={handleSearch}
            showSuggestions={true}
            debounceMs={300}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-20"
        showsVerticalScrollIndicator={false}
      >
        {/* Trending Banner */}
        <TrendingBanner
          trendingText=""
          onCreateVault={() => router.push("/(tabs)/vaults")}
          onStartEarning={() => {}}
          onTutorials={() => router.push("/(tabs)/search")}
        />

        {/* Statistics */}
        <View className="flex-row mb-6 -mx-1">
          <StatCard value="50K+" label="Creators" />
          <StatCard value="2M+" label="Vaults" />
          <StatCard value="10M+" label="Searches" />
          <StatCard value="$5M+" label="Paid" />
        </View>

        {/* Analytics */}
        <AnalyticsChart period="weekly" />

        {/* Top Earners */}
        <TopEarners earners={topEarners || []} isLoading={isLoadingEarners} />
      </ScrollView>
    </SafeAreaView>
  );
}
