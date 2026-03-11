import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { Vault } from "../../services/vault.service";

type TabType = "saved" | "followed";

function VaultRow({
  vault,
  onPress,
}: {
  vault: Vault;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg mb-3 p-4 border border-gray-100 flex-row items-center"
      activeOpacity={0.7}
    >
      <View className="flex-1 mr-3">
        <Text
          className="text-gray-900 text-base font-outfit-semi-bold"
          numberOfLines={1}
        >
          {vault.title}
        </Text>
        {vault.description ? (
          <Text
            className="text-gray-600 text-sm font-outfit-regular mt-0.5"
            numberOfLines={2}
          >
            {vault.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function SavedFollowedVaults() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<TabType>(
    params.tab === "followed" ? "followed" : "saved"
  );
  const { vault } = useServices();

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [tab === "saved" ? "savedVaults" : "followedVaults", tab],
    queryFn: () =>
      tab === "saved"
        ? vault.getSavedVaults(50, 0)
        : vault.getFollowedVaults(50, 0),
    staleTime: 30000,
  });

  const vaults = data?.vaults ?? [];

  const handleViewVault = (vaultId: string) => {
    router.push(`/(tabs)/view-vault?id=${vaultId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        showBackButton
        title={tab === "saved" ? "Saved Vaults" : "Followed Vaults"}
        onBackPress={() => router.back()}
      />

      {/* Tab switcher */}
      <View className="flex-row mx-4 mb-3 bg-gray-100 rounded-lg p-1">
        <TouchableOpacity
          onPress={() => setTab("saved")}
          className={`flex-1 py-2.5 rounded-md flex-row items-center justify-center ${
            tab === "saved" ? "bg-white shadow-sm" : ""
          }`}
          activeOpacity={0.8}
        >
          <Ionicons
            name="bookmark"
            size={18}
            color={tab === "saved" ? "#D97706" : "#6B7280"}
          />
          <Text
            className={`ml-2 font-outfit-semi-bold ${
              tab === "saved" ? "text-amber-600" : "text-gray-500"
            }`}
            style={{ fontSize: 14 }}
          >
            Saved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("followed")}
          className={`flex-1 py-2.5 rounded-md flex-row items-center justify-center ${
            tab === "followed" ? "bg-white shadow-sm" : ""
          }`}
          activeOpacity={0.8}
        >
          <Ionicons
            name="heart"
            size={18}
            color={tab === "followed" ? "#6366F1" : "#6B7280"}
          />
          <Text
            className={`ml-2 font-outfit-semi-bold ${
              tab === "followed" ? "text-indigo-600" : "text-gray-500"
            }`}
            style={{ fontSize: 14 }}
          >
            Followed
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 text-sm font-outfit-regular mt-4">
            Loading...
          </Text>
        </View>
      ) : vaults.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name={tab === "saved" ? "bookmark-outline" : "heart-outline"}
            size={64}
            color="#9CA3AF"
          />
          <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4 text-center">
            No {tab === "saved" ? "saved" : "followed"} vaults yet
          </Text>
          <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
            {tab === "saved"
              ? "Save vaults from Chat to find them here."
              : "Follow vaults from Chat to see them here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={vaults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VaultRow
              vault={item}
              onPress={() => handleViewVault(item.id)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
