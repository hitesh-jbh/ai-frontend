import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useServices } from "../../hooks/useServices";
import { Vault } from "../../services/vault.service";
import { useAuthStore } from "../../store/auth-store";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { showSuccessToast, showErrorToast } from "../../utils/toast";
import { ResponsiveText } from "@/utils/responsive-text";

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
}) => {
  return (
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
};

export default function Vaults() {
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

  // Infinite query for vaults
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
  });

  const vaults = vaultsData?.pages.flatMap((page) => page.vaults) || [];

  // Get resource counts for each vault (optimized - only fetch total count)
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
    enabled: vaults?.length > 0,
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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        showBackButton
        title="My Vaults"
        onBackPress={() => router.push("/(tabs)/leaderboard")}
      />

      <View className="px-6">
        {/* Profile Section */}
        <View className="items-center mb-6">
          <View
            className="bg-gray-200 rounded-full items-center justify-center mb-2 overflow-hidden"
            style={{ width: 120, height: 120 }}
          >
            {normalizedProfilePicture && !profileImageError ? (
              <Image
                key={normalizedProfilePicture}
                source={{ uri: normalizedProfilePicture }}
                style={{ width: 120, height: 120 }}
                contentFit="cover"
                transition={200}
                onError={(e) => {
                  console.error(
                    "Failed to load profile picture in Vaults:",
                    normalizedProfilePicture,
                    e
                  );
                  setProfileImageError(true);
                }}
                onLoad={() => {
                  console.log(
                    "Profile picture loaded in Vaults:",
                    normalizedProfilePicture
                  );
                  setProfileImageError(false);
                }}
              />
            ) : displayUser?.name ? (
              <Text
                className={`text-gray-600 font-outfit-bold ${ResponsiveText.display}`}
              >
                {displayUser.name.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={60} color="#6B7280" />
            )}
          </View>
          <Text className="text-gray-900 text-xl font-outfit-bold uppercase mb-1 mt-2">
            {displayUser?.name || "User"}
          </Text>
          {displayUser?.bio && (
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              {displayUser.bio}
            </Text>
          )}
        </View>

        {/* Statistics */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-white rounded-lg p-4 items-center border border-gray-100">
            <Text className="text-gray-900 text-2xl font-outfit-bold mb-1">
              {vaults?.length}
            </Text>
            <Text className="text-gray-600 text-xs font-outfit-regular">
              Vaults
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-lg p-4 items-center border border-gray-100">
            <Text className="text-gray-900 text-2xl font-outfit-bold mb-1">
              {Object.values(resourceCounts || {}).reduce((a, b) => a + b, 0)}
            </Text>
            <Text className="text-gray-600 text-xs font-outfit-regular">
              Resources
            </Text>
          </View>
        </View>

        {/* Action Button */}
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

      {isLoadingVaults ? (
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
              refreshing={isRefetchingVaults}
              onRefresh={refetchVaults}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
