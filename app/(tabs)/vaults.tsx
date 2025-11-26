import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServices } from "../../hooks/useServices";
import { Vault } from "../../services/vault.service";
import { Resource } from "../../services/resource.service";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";

type TabType = "all" | "recent" | "videos" | "vaults";

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-lg ${
        isActive ? "bg-blue-500" : "bg-transparent"
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

interface ResourceCardProps {
  resource: Resource;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onEdit,
  onDelete,
}) => {
  const getTypeIcon = () => {
    switch (resource.type) {
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

  return (
    <View className="bg-white rounded-lg mb-4 overflow-hidden shadow-sm">
      <View className="relative">
        {resource.fileUrl ? (
          <Image
            source={{ uri: resource.fileUrl }}
            className="w-full h-48"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-48 bg-gray-200 items-center justify-center">
            <Ionicons name={getTypeIcon() as any} size={48} color="#9CA3AF" />
          </View>
        )}
        <View className="absolute top-2 left-2 bg-blue-500 rounded px-2 py-1">
          <Text className="text-white text-xs font-outfit-semi-bold uppercase">
            {resource.type}
          </Text>
        </View>
      </View>
      <View className="p-4">
        <Text className="text-gray-900 text-base font-outfit-semi-bold mb-1">
          {resource.title}
        </Text>
        {resource.tags && resource.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-3">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <View key={index} className="bg-gray-100 rounded-full px-2 py-1">
                <Text className="text-gray-600 text-xs font-outfit-regular">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center">
              <Ionicons name="thumbs-up-outline" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-xs font-outfit-regular ml-1">
                0
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-xs font-outfit-regular ml-1">
                0
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="share-outline" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-xs font-outfit-regular ml-1">
                0
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
              <Ionicons name="pencil-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function Vaults() {
  const [selectedTab, setSelectedTab] = useState<TabType>("all");
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { vault, resource, profile } = useServices();

  // Fetch latest profile data
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.getProfile(),
    enabled: !!user,
  });

  // Update user in store when profile data is fetched (only if data changed)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profileData?.id,
    profileData?.bio,
    profileData?.profilePicture,
    profileData?.name,
  ]);

  const displayUser = profileData || user;

  const { data: vaults, isLoading: isLoadingVaults } = useQuery({
    queryKey: ["vaults"],
    queryFn: () => vault.getUserVaults(),
  });

  // Get resources from all vaults or selected vault
  const { data: allResources, isLoading: isLoadingResources } = useQuery({
    queryKey: ["allResources", vaults],
    queryFn: async () => {
      if (!vaults || vaults.length === 0) return [];
      const allRes: Resource[] = [];
      for (const vaultItem of vaults) {
        try {
          const res = await resource.getVaultResources(vaultItem.id);
          allRes.push(...res);
        } catch (error) {
          // Skip vaults with errors
        }
      }
      return allRes;
    },
    enabled: !!vaults && vaults.length > 0,
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => resource.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      Alert.alert("Success", "Resource deleted successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete resource");
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

  const filteredResources = allResources?.filter((resource) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "videos") return resource.type === "video";
    if (selectedTab === "vaults") return resource.type !== "video";
    if (selectedTab === "recent") {
      // Show recent resources (last 7 days)
      const resourceDate = new Date(resource.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return resourceDate >= weekAgo;
    }
    return true;
  });

  const tabs: { key: TabType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "recent", label: "Recent" },
    { key: "videos", label: "Videos" },
    { key: "vaults", label: "Vaults" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 pt-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-gray-900 text-xl font-outfit-bold">Vault</Text>
        </View>

        {/* Profile Section */}
        <View className="items-center mb-6">
          {displayUser?.profilePicture ? (
            <View className="w-20 h-20 rounded-full overflow-hidden mb-2">
              <Image
                source={{ uri: displayUser.profilePicture }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          ) : (
            <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-2">
              <Ionicons name="person" size={32} color="#6B7280" />
            </View>
          )}
          <Text className="text-gray-900 text-xl font-outfit-bold uppercase mb-1">
            {displayUser?.name || "User"}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={14} color="#6B7280" />
            <Text className="text-gray-600 text-sm font-outfit-regular ml-1">
              0 Followers
            </Text>
          </View>
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
              3
            </Text>
            <Text className="text-gray-600 text-xs font-outfit-regular">
              Videos
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-lg p-4 items-center border border-gray-100">
            <Text className="text-gray-900 text-2xl font-outfit-bold mb-1">
              {vaults?.length || 0}
            </Text>
            <Text className="text-gray-600 text-xs font-outfit-regular">
              Vaults
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-lg p-4 items-center border border-gray-100">
            <Text className="text-gray-900 text-2xl font-outfit-bold mb-1">
              0
            </Text>
            <Text className="text-gray-600 text-xs font-outfit-regular">
              Followers
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2 mb-4">
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              label={tab.label}
              isActive={selectedTab === tab.key}
              onPress={() => setSelectedTab(tab.key)}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/create-vault")}
            className="flex-1 bg-blue-500 rounded-lg py-3 px-4 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text className="text-white text-sm font-outfit-semi-bold ml-2">
              Create Vault
            </Text>
          </TouchableOpacity>
          {vaults && vaults.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                if (vaults.length === 1) {
                  router.push(`/(tabs)/add-resource?vaultId=${vaults[0].id}`);
                } else {
                  // Show vault selection modal or navigate to first vault
                  router.push(`/(tabs)/add-resource?vaultId=${vaults[0].id}`);
                }
              }}
              className="flex-1 bg-green-500 rounded-lg py-3 px-4 flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text className="text-white text-sm font-outfit-semi-bold ml-2">
                Add Resource
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {isLoadingResources ? (
          <View className="py-8 items-center">
            <Text className="text-gray-500 text-sm font-outfit-regular">
              Loading resources...
            </Text>
          </View>
        ) : filteredResources && filteredResources.length > 0 ? (
          <View className="pb-6">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={() => {
                  router.push(`/(tabs)/edit-resource?id=${resource.id}`);
                }}
                onDelete={() => handleDeleteResource(resource.id)}
              />
            ))}
          </View>
        ) : (
          <View className="py-8 items-center">
            <Ionicons name="folder-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
              No resources yet
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Create a vault and add resources to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
