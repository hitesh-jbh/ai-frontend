import React from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useServices } from "../../hooks/useServices";
import { Resource } from "../../services/resource.service";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { showSuccessToast, showErrorToast } from "../../utils/toast";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return "document-text";
    case "video":
      return "videocam";
    case "note":
      return "document";
    case "link":
      return "link";
    default:
      return "document";
  }
};

export default function ViewVault() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vault, resource } = useServices();
  const queryClient = useQueryClient();

  // Fetch vault details
  const {
    data: vaultData,
    isLoading: isLoadingVault,
    error: vaultError,
  } = useQuery({
    queryKey: ["vault", id],
    queryFn: () => vault.getVault(id!),
    enabled: !!id,
  });

  // Fetch vault resources
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingResources,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["vaultResources", id],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await resource.getVaultResources(id!, 20, pageParam);
      return {
        resources: result.resources,
        nextOffset: result.resources.length === 20 ? pageParam + 20 : undefined,
        hasMore:
          result?.resources?.length === 20 && pageParam + 20 < result.total,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    enabled: !!id,
  });

  const resources = data?.pages.flatMap((page) => page.resources) || [];

  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId: string) => resource.deleteResource(resourceId),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["allResources"] });
      queryClient.invalidateQueries({ queryKey: ["vaultResources", id] });
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["vaultResourceCounts"] });
      queryClient.invalidateQueries({ queryKey: ["vault", id] });
      
      // Invalidate leaderboard and analytics queries
      queryClient.invalidateQueries({ queryKey: ["topEarners"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["userRank"] });
      queryClient.invalidateQueries({ queryKey: ["analyticsChart"] });
      
      showSuccessToast("Success", "Resource deleted successfully");
    },
    onError: () => {
      showErrorToast("Error", "Failed to delete resource");
    },
  });

  const handleDeleteResource = (resourceId: string) => {
    Alert.alert(
      "Delete Resource",
      "Are you sure you want to delete this resource?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteResourceMutation.mutate(resourceId),
        },
      ]
    );
  };

  const renderResource = ({ item }: { item: Resource }) => (
    <TouchableOpacity
      className="bg-white rounded-lg mb-4 p-4 shadow-sm border border-gray-100"
      activeOpacity={0.7}
      onPress={() => router.push(`/(tabs)/view-resource?id=${item.id}`)}
    >
      <View className="flex-row items-start">
        {item.fileUrl ? (
          <Image
            source={{ uri: item.fileUrl }}
            className="w-16 h-16 rounded-lg mr-3"
            contentFit="cover"
          />
        ) : (
          <View className="w-16 h-16 bg-gray-200 rounded-lg mr-3 items-center justify-center">
            <Ionicons
              name={getTypeIcon(item.type) as any}
              size={24}
              color="#9CA3AF"
            />
          </View>
        )}
        <View className="flex-1">
          <Text
            className="text-gray-900 text-base font-outfit-semi-bold mb-1"
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <View className="flex-row items-center mb-2">
            <View className="bg-blue-100 rounded px-2 py-1 mr-2">
              <Text className="text-blue-700 text-xs font-outfit-semi-bold uppercase">
                {item.type}
              </Text>
            </View>
          </View>
          {item?.tags && item?.tags?.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mb-2">
              {item.tags.slice(0, 3).map((tag, index) => (
                <View
                  key={index}
                  className="bg-gray-100 rounded-full px-2 py-1"
                >
                  <Text className="text-gray-600 text-xs font-outfit-regular">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/(tabs)/edit-resource?id=${item.id}`);
            }}
            className="p-2"
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteResource(item.id);
            }}
            className="p-2"
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoadingVault) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Vault" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 text-sm font-outfit-regular mt-4">
            Loading vault...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (vaultError || !vaultData) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Vault" showBackButton />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4 text-center">
            Vault not found
          </Text>
          <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
            This vault could not be loaded.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title={vaultData.title} showBackButton />

      <View className="px-6 pt-4 pb-4 bg-white border-b border-gray-100">
        {vaultData.description && (
          <Text
            className="text-gray-600 text-sm font-outfit-regular mb-4"
            numberOfLines={2}
          >
            {vaultData.description}
          </Text>
        )}
        <TouchableOpacity
          onPress={() =>
            router.push(`/(tabs)/add-resource?vaultId=${vaultData.id}`)
          }
          className="bg-blue-500 rounded-lg py-3 px-4 flex-row items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text className="text-white text-sm font-outfit-semi-bold ml-2">
            Add Resource
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingResources ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 text-sm font-outfit-regular mt-4">
            Loading resources...
          </Text>
        </View>
      ) : resources?.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
            No resources yet
          </Text>
          <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
            Add your first resource to this vault
          </Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          renderItem={renderResource}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingTop: 16 }}
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
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </SafeAreaView>
  );
}
