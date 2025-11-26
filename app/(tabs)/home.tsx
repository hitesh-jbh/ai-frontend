import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const user = useAuthStore((state) => state.user);
  const { leaderboard, profile } = useServices();

  // Fetch latest profile data to get profile picture
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.getProfile(),
    enabled: !!user,
  });

  const displayUser = profileData || user;

  const { data: topEarners, isLoading: isLoadingEarners } = useQuery({
    queryKey: ["topEarners"],
    queryFn: () => leaderboard.getTopUsers(10),
  });

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
      <View className="px-6 pt-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-gray-900 text-3xl font-outfit-bold mb-1">
              Connect
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular">
              Trusted by creators across the globe.
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center overflow-hidden">
              {displayUser?.profilePicture ? (
                <Image
                  source={{ uri: displayUser.profilePicture }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : displayUser ? (
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
          onCreateVault={() => router.push("/(tabs)/vaults")}
          onStartEarning={() => {}}
          onTutorials={() => {}}
        />

        {/* Statistics */}
        <View className="flex-row mb-6 -mx-1">
          <StatCard value="50K+" label="Creators" />
          <StatCard value="2M+" label="Vaults" />
          <StatCard value="10M+" label="Searches" />
          <StatCard value="$5M+" label="Paid" />
        </View>

        {/* Analytics */}
        <AnalyticsChart
          period="All Time"
          data={[
            { name: "Joy", value: 9 },
            { name: "Govind", value: 9 },
            { name: "Joyboy", value: 6 },
            { name: "aman", value: 3 },
          ]}
        />

        {/* Top Earners */}
        <TopEarners earners={topEarners || []} isLoading={isLoadingEarners} />
      </ScrollView>
    </SafeAreaView>
  );
}
