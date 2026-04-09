import { ResponsiveText } from "@/utils/responsive-text";
import { Ionicons } from "@expo/vector-icons";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { Vault } from "../../services/vault.service";
import { useAuthStore } from "../../store/auth-store";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

interface VaultCardProps {
  vault: Vault;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  resourceCount?: number;
}

const VaultCard: React.FC<VaultCardProps> = ({
  vault,
  onPress,
  onEdit,
  onDelete,
  resourceCount = 0,
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="bg-white rounded-lg mb-4 p-4 shadow-sm border border-gray-100"
    activeOpacity={0.7}
  >
    <View className="flex-row items-start justify-between mb-3">
      <View className="flex-1 mr-2">
        <View className="flex-row items-center mb-1">
          <Ionicons name="folder" size={20} color="#3B82F6" />
          <Text
            className="text-gray-900 text-lg font-outfit-bold flex-1 ml-2"
            numberOfLines={1}
          >
            {vault.title}
          </Text>
        </View>
        {vault.description && (
          <Text
            className="text-gray-600 text-sm font-outfit-regular mt-1"
            numberOfLines={2}
          >
            {vault.description}
          </Text>
        )}
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2"
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2"
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
    <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
      <View className="flex-row items-center">
        <Ionicons name="document-text-outline" size={16} color="#6B7280" />
        <Text className="text-gray-600 text-xs font-outfit-regular ml-1">
          {resourceCount} {resourceCount === 1 ? "resource" : "resources"}
        </Text>
      </View>
      <Text className="text-gray-500 text-xs font-outfit-regular">
        {new Date(vault.createdAt).toLocaleDateString()}
      </Text>
    </View>
  </TouchableOpacity>
);

const VaultListRow: React.FC<{
  vault: Vault;
  onPress: () => void;
}> = ({ vault, onPress }) => (
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

type VaultTabType = "my" | "saved" | "followed";

export default function Vaults() {
  const [activeTab, setActiveTab] = useState<VaultTabType>("my");
  const [profileImageError, setProfileImageError] = useState(false);
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { vault, resource, profile } = useServices();

  // Fetch latest profile data
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.getProfile(),
    enabled: !!user,
  });

  // Update user in store when profile data is fetched
  useEffect(() => {
    if (profileData && user) {
      const hasChanges =
        user.bio !== profileData.bio ||
        user.profilePicture !== profileData.profilePicture ||
        user.name !== profileData.name;

      if (hasChanges) {
        setUser({ ...user, ...profileData });
      }
    }
  }, [
    profileData?.id,
    profileData?.bio,
    profileData?.profilePicture,
    profileData?.name,
  ]);

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

  // Infinite query for my vaults (enabled when tab is "my")
  const {
    data: vaultsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingVaults,
    refetch: refetchVaults,
    isRefetching: isRefetchingVaults,
  } = useInfiniteQuery({
    queryKey: ["vaults"],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await vault.getUserVaults(20, pageParam);
      return {
        vaults: result.vaults,
        nextOffset: result.vaults?.length === 20 ? pageParam + 20 : undefined,
        hasMore: result.vaults?.length === 20 && pageParam + 20 < result.total,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    enabled: activeTab === "my",
  });

  const vaults = vaultsData?.pages.flatMap((page) => page.vaults) || [];

  // Saved vaults (enabled when tab is "saved")
  const {
    data: savedData,
    isLoading: isLoadingSaved,
    refetch: refetchSaved,
    isRefetching: isRefetchingSaved,
  } = useQuery({
    queryKey: ["savedVaults"],
    queryFn: () => vault.getSavedVaults(50, 0),
    enabled: activeTab === "saved",
    staleTime: 30000,
  });
  const savedVaults = savedData?.vaults ?? [];

  // Followed vaults (enabled when tab is "followed")
  const {
    data: followedData,
    isLoading: isLoadingFollowed,
    refetch: refetchFollowed,
    isRefetching: isRefetchingFollowed,
  } = useQuery({
    queryKey: ["followedVaults"],
    queryFn: () => vault.getFollowedVaults(50, 0),
    enabled: activeTab === "followed",
    staleTime: 30000,
  });
  const followedVaults = followedData?.vaults ?? [];

  // Get resource counts for each vault (only when My Vaults tab is active)
  const { data: resourceCounts } = useQuery({
    queryKey: ["vaultResourceCounts", vaults.map((v) => v.id).join(",")],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      // Fetch with limit=1 to get total count efficiently
      await Promise.all(
        vaults.map(async (vaultItem) => {
          try {
            const result = await resource.getVaultResources(vaultItem.id, 1, 0);
            counts[vaultItem.id] = result.total;
          } catch {
            counts[vaultItem.id] = 0;
          }
        })
      );
      return counts;
    },
    enabled: activeTab === "my" && vaults?.length > 0,
  });

  const deleteVaultMutation = useMutation({
    mutationFn: (id: string) => vault.deleteVault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["vaultResourceCounts"] });
      queryClient.invalidateQueries({ queryKey: ["vaultResources"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["allResources"] });

      // Invalidate leaderboard and analytics queries
      queryClient.invalidateQueries({ queryKey: ["topEarners"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["userRank"] });
      queryClient.invalidateQueries({ queryKey: ["analyticsChart"] });

      showSuccessToast(
        "Success",
        "Vault and all its resources deleted successfully"
      );
    },
    onError: () => {
      showErrorToast("Error", "Failed to delete vault");
    },
  });

  const handleDeleteVault = (vaultId: string, vaultTitle: string) => {
    Alert.alert(
      "Delete Vault",
      `Are you sure you want to delete "${vaultTitle}"? This will permanently delete the vault and ALL its resources. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteVaultMutation.mutate(vaultId),
        },
      ]
    );
  };

  const handleEditVault = (vaultId: string) => {
    router.push(`/(tabs)/edit-vault?id=${vaultId}`);
  };

  const handleViewVault = (vaultId: string) => {
    router.push(`/(tabs)/view-vault?id=${vaultId}`);
  };

  const renderVault = ({ item }: { item: Vault }) => (
    <VaultCard
      vault={item}
      resourceCount={resourceCounts?.[item.id] || 0}
      onPress={() => handleViewVault(item.id)}
      onEdit={() => handleEditVault(item.id)}
      onDelete={() => handleDeleteVault(item.id, item.title)}
    />
  );

  const isLoading = {
    my: isLoadingVaults,
    saved: isLoadingSaved,
    followed: isLoadingFollowed,
  }[activeTab];
  const isRefetching = {
    my: isRefetchingVaults,
    saved: isRefetchingSaved,
    followed: isRefetchingFollowed,
  }[activeTab];
  const refetch = {
    my: refetchVaults,
    saved: refetchSaved,
    followed: refetchFollowed,
  }[activeTab];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        showBackButton
        title="Vaults"
        onBackPress={() => router.push("/(tabs)/leaderboard")}
      />

      {/* Segmented Tab Control */}
      <View className="flex-row mx-4 mt-2 mb-4 bg-gray-100 rounded-xl p-1">
        <TouchableOpacity
          onPress={() => setActiveTab("my")}
          className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center ${
            activeTab === "my" ? "bg-white" : ""
          }`}
          style={
            activeTab === "my"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : undefined
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="folder"
            size={18}
            color={activeTab === "my" ? "#3B82F6" : "#6B7280"}
          />
          <Text
            className={`ml-2 font-outfit-semi-bold ${
              activeTab === "my" ? "text-blue-500" : "text-gray-500"
            }`}
            style={{ fontSize: 14 }}
          >
            My Vaults
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("saved")}
          className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center ${
            activeTab === "saved" ? "bg-white" : ""
          }`}
          style={
            activeTab === "saved"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : undefined
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="bookmark"
            size={18}
            color={activeTab === "saved" ? "#D97706" : "#6B7280"}
          />
          <Text
            className={`ml-2 font-outfit-semi-bold ${
              activeTab === "saved" ? "text-amber-600" : "text-gray-500"
            }`}
            style={{ fontSize: 14 }}
          >
            Saved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("followed")}
          className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center ${
            activeTab === "followed" ? "bg-white" : ""
          }`}
          style={
            activeTab === "followed"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : undefined
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="heart"
            size={18}
            color={activeTab === "followed" ? "#6366F1" : "#6B7280"}
          />
          <Text
            className={`ml-2 font-outfit-semi-bold ${
              activeTab === "followed" ? "text-indigo-600" : "text-gray-500"
            }`}
            style={{ fontSize: 14 }}
          >
            Followed
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "my" && (
        <View className="px-6">
          {/* Profile Card - Enhanced Design */}
          <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
            {/* Avatar & Basic Info Row */}
            <View className="flex-row items-center mb-4">
              <View
                className="bg-gray-200 rounded-full items-center justify-center overflow-hidden mr-4"
                style={{ width: 80, height: 80 }}
              >
                {normalizedProfilePicture && !profileImageError ? (
                  <Image
                    key={normalizedProfilePicture}
                    source={{ uri: normalizedProfilePicture }}
                    style={{ width: 80, height: 80 }}
                    contentFit="cover"
                    transition={200}
                    onError={() => {
                      console.error(
                        "Failed to load profile picture in Vaults:",
                        normalizedProfilePicture
                      );
                      setProfileImageError(true);
                    }}
                    onLoad={() => setProfileImageError(false)}
                  />
                ) : displayUser?.name ? (
                  <Text
                    className={`text-gray-600 font-outfit-bold ${ResponsiveText.display}`}
                  >
                    {displayUser.name.charAt(0).toUpperCase()}
                  </Text>
                ) : (
                  <Ionicons name="person" size={40} color="#6B7280" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 text-xl font-outfit-bold uppercase">
                  {displayUser?.name || "User"}
                </Text>
                {/* Title - New Field */}
                {displayUser?.title && (
                  <Text className="text-blue-600 text-sm font-outfit-semi-bold mt-1">
                    {displayUser.title}
                  </Text>
                )}
                {/* Bio (Description) */}
                {displayUser?.bio && (
                  <Text
                    className="text-gray-600 text-sm font-outfit-regular mt-1"
                    numberOfLines={2}
                  >
                    {displayUser.bio}
                  </Text>
                )}
              </View>
            </View>

            {/* Summary - New Field */}
            {displayUser?.summary && (
              <View className="flex-row items-start mb-3 bg-blue-50 p-3 rounded-xl">
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#3B82F6"
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text className="text-gray-700 text-sm font-outfit-regular flex-1">
                  {displayUser.summary}
                </Text>
              </View>
            )}

            {/* Phone Number - New Field */}
            {displayUser?.phone && (
              <View className="flex-row items-center mb-4">
                <Ionicons name="call-outline" size={18} color="#6B7280" />
                <Text className="text-gray-600 text-sm font-outfit-regular ml-2">
                  {displayUser.phone}
                </Text>
              </View>
            )}

            {/* Statistics Row */}
            <View className="flex-row gap-4 mt-2">
              <View className="flex-1 bg-gray-50 rounded-xl p-3 items-center">
                <Text className="text-gray-900 text-2xl font-outfit-bold">
                  {vaults?.length}
                </Text>
                <Text className="text-gray-600 text-xs font-outfit-regular">
                  Vaults
                </Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-xl p-3 items-center">
                <Text className="text-gray-900 text-2xl font-outfit-bold">
                  {Object.values(resourceCounts || {}).reduce(
                    (a, b) => a + b,
                    0
                  )}
                </Text>
                <Text className="text-gray-600 text-xs font-outfit-regular">
                  Resources
                </Text>
              </View>
            </View>
          </View>

          {/* Create Vault Button */}
          <TouchableOpacity
          
            onPress={() => router.push("/(tabs)/create-vault")}
            className="bg-blue-500 rounded-lg py-3 px-4 flex-row items-center justify-center mb-6"
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text className="text-white text-sm font-outfit-semi-bold ml-2">
              Create Vault
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "my" ? (
        isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 text-sm font-outfit-regular mt-4">
              Loading vaults...
            </Text>
          </View>
        ) : vaults?.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="folder-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
              No vaults yet
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Create your first vault to organize your resources
            </Text>
          </View>
        ) : (
          <FlatList
            data={vaults}
            renderItem={renderVault}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24, paddingTop: 0 }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() =>
              isFetchingNextPage ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#3B82F6" />
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
              />
            }
          />
        )
      ) : activeTab === "saved" ? (
        isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 text-sm font-outfit-regular mt-4">
              Loading...
            </Text>
          </View>
        ) : savedVaults.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="bookmark-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4 text-center">
              No saved vaults yet
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Save vaults from Chat to find them here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedVaults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="px-4">
                <VaultListRow
                  vault={item}
                  onPress={() => handleViewVault(item.id)}
                />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
              />
            }
          />
        )
      ) : (
        isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 text-sm font-outfit-regular mt-4">
              Loading...
            </Text>
          </View>
        ) : followedVaults.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4 text-center">
              No followed vaults yet
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Follow vaults from Chat to see them here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={followedVaults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="px-4">
                <VaultListRow
                  vault={item}
                  onPress={() => handleViewVault(item.id)}
                />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
              />
            }
          />
        )
      )}
    </SafeAreaView>
  );
}