import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "../../components/ui/StatCard";
import { TrendingBanner } from "../../components/home/TrendingBanner";
import { AnalyticsChart } from "../../components/home/AnalyticsChart";
import { TopEarners } from "../../components/home/TopEarners";
import { useServices } from "../../hooks/useServices";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { ResponsiveText } from "@/utils/responsive-text";

export default function Home() {
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
    queryFn: () => leaderboard.getTopUsers(3, 0, "all"), // Only fetch top 3 for home page
  });

  const topEarners = topEarnersData?.entries || [];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View
        className="px-6"
        style={{
          minHeight: 182,
          justifyContent: "flex-end",
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text
              className={`text-gray-900 ${ResponsiveText.display} font-outfit-bold mb-1`}
            >
              Connect
            </Text>
            <Text className="text-gray-600 text-base font-outfit-regular">
              Trusted by creators across the globe.
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)/options")}
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
                <Text className="text-gray-600 font-outfit-semi-bold text-2xl">
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
          <TouchableWithoutFeedback
            onPress={() => router.push("/(tabs)/search")}
          >
            <View className="relative">
              <View
                className="bg-gray-100 rounded-3xl flex-row items-center px-4"
                style={{ paddingVertical: 16 }}
              >
                <Ionicons name="search" size={20} color="#6B7280" />
                <Text
                  className="flex-1 ml-3 text-gray-500 font-outfit-regular text-base"
                  style={{ lineHeight: 20 }}
                >
                  Search for knowledge vault..
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-20"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Trending Banner */}
        <TrendingBanner
          trendingText=""
          onCreateVault={() => router.push("/(tabs)/vaults")}
          onStartEarning={() => router.push("/(tabs)/vaults")}
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
