import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { useAuthStore } from "../../store/auth-store";
import { Resource } from "../../services/resource.service";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import { showErrorToast } from "../../utils/toast";

type UserVote = "up" | "down" | null;

// Video Player Component
const VideoPlayerComponent: React.FC<{ fileUrl: string }> = ({ fileUrl }) => {
  const player = useVideoPlayer(fileUrl, (player) => {
    player.loop = false;
    player.muted = false;
  });

  return (
    <View className="mb-6">
      <View
        className="bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: 16 / 9 }}
      >
        <VideoView
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          nativeControls
        />
      </View>
    </View>
  );
};

export default function ViewResource() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resource } = useServices();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [userVote, setUserVote] = useState<UserVote>(null);
  const [votePending, setVotePending] = useState(false);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);

  const {
    data: resourceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => resource.getResource(id!),
    enabled: !!id && !!user,
  });

  // Check if user owns this resource (prevent voting on own)
  const isOwner = resourceData?.userId === user?.id;
  const canVote = !!id && !!user && !isOwner;

  const handleUpvote = useCallback(async () => {
    if (!canVote || votePending || !id) return;
    setVotePending(true);
    try {
      const result = await resource.upvoteResource(id);
      setUserVote(result.voteType);
      if (result.voteType === "up") {
        setUpvotes((u) => u + 1);
        if (userVote === "down") setDownvotes((d) => (d > 0 ? d - 1 : 0));
      } else {
        if (userVote === "up") setUpvotes((u) => (u > 0 ? u - 1 : 0));
        if (userVote === "down") setDownvotes((d) => (d > 0 ? d - 1 : 0));
      }
      queryClient.setQueryData(["resource", id], (old: Resource | undefined) =>
        old ? { ...old } : old
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Vote failed";
      showErrorToast("Error", msg);
    } finally {
      setVotePending(false);
    }
  }, [canVote, votePending, id, resource, userVote, queryClient]);

  const handleDownvote = useCallback(async () => {
    if (!canVote || votePending || !id) return;
    setVotePending(true);
    try {
      const result = await resource.downvoteResource(id);
      setUserVote(result.voteType);
      if (result.voteType === "down") {
        setDownvotes((d) => d + 1);
        if (userVote === "up") setUpvotes((u) => (u > 0 ? u - 1 : 0));
      } else {
        if (userVote === "up") setUpvotes((u) => (u > 0 ? u - 1 : 0));
        if (userVote === "down") setDownvotes((d) => (d > 0 ? d - 1 : 0));
      }
      queryClient.setQueryData(["resource", id], (old: Resource | undefined) =>
        old ? { ...old } : old
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Vote failed";
      showErrorToast("Error", msg);
    } finally {
      setVotePending(false);
    }
  }, [canVote, votePending, id, resource, userVote, queryClient]);

  const handleEdit = () => {
    router.push(`/(tabs)/edit-resource?id=${id}`);
  };

  const handleOpenLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      showErrorToast("Error", "Failed to open link");
    }
  };

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "pdf":
        return "#EF4444";
      case "video":
        return "#3B82F6";
      case "note":
        return "#10B981";
      case "link":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const renderResourceContent = (data: Resource) => {
    if (!data.fileUrl) {
      return (
        <View className="mb-6 bg-gray-50 rounded-lg p-8 items-center justify-center">
          <Ionicons name="document-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm font-outfit-regular mt-2">
            No file attached
          </Text>
        </View>
      );
    }

    switch (data.type) {
      case "video":
        return <VideoPlayerComponent fileUrl={data.fileUrl} />;

      case "pdf":
        return (
          <View className="mb-6">
            <View className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <Ionicons name="document-text" size={32} color="#EF4444" />
                <Text className="text-gray-700 text-sm font-outfit-semi-bold ml-2">
                  PDF Document
                </Text>
              </View>
              <Text className="text-gray-600 text-xs font-outfit-regular mb-4">
                Tap the button below to view the PDF in your browser
              </Text>
              <TouchableOpacity
                onPress={() => handleOpenLink(data.fileUrl!)}
                className="bg-red-500 rounded-lg py-3 px-4 flex-row items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                <Text className="text-white text-base font-outfit-semi-bold ml-2">
                  Open PDF
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "link":
        return (
          <View className="mb-6">
            <TouchableOpacity
              onPress={() => handleOpenLink(data.fileUrl!)}
              className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="link" size={24} color="#3B82F6" />
                <View className="flex-1 ml-3">
                  <Text className="text-blue-700 text-sm font-outfit-semi-bold mb-1">
                    Open Link
                  </Text>
                  <Text
                    className="text-blue-600 text-xs font-outfit-regular"
                    numberOfLines={2}
                  >
                    {data.fileUrl}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
              </View>
            </TouchableOpacity>
          </View>
        );

      case "note":
      default:
        // For notes, try to display as image if it's an image URL, otherwise show placeholder
        const isImageUrl = data.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        if (isImageUrl) {
          return (
            <View className="mb-6">
              <Image
                source={{ uri: data.fileUrl }}
                style={{
                  width: "100%",
                  minHeight: 200,
                  maxHeight: 400,
                  borderRadius: 8,
                }}
                contentFit="contain"
                transition={200}
              />
            </View>
          );
        }
        return (
          <View className="mb-6">
            <TouchableOpacity
              onPress={() => handleOpenLink(data.fileUrl!)}
              className="bg-green-50 border-2 border-green-200 rounded-lg p-4"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="document" size={24} color="#10B981" />
                <View className="flex-1 ml-3">
                  <Text className="text-green-700 text-sm font-outfit-semi-bold mb-1">
                    View Note
                  </Text>
                  <Text className="text-green-600 text-xs font-outfit-regular">
                    Tap to open file
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#10B981" />
              </View>
            </TouchableOpacity>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Resource" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 text-sm font-outfit-regular mt-4">
            Loading resource...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Access control: Show resource if it exists (public viewing allowed for search results)
  if (!isLoading && !resourceData) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScreenHeader title="Resource" showBackButton />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4 text-center">
            {error ? "Resource not found" : "Resource not found"}
          </Text>
          <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
            {error
              ? "This resource could not be loaded."
              : "This resource could not be found."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Type guard: ensure resourceData exists
  if (!resourceData) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Resource" showBackButton />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          {/* Header with Edit Button (only show if owner) */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <View
                  className="rounded-lg p-2 mr-3"
                  style={{
                    backgroundColor: `${getTypeColor(resourceData.type)}20`,
                  }}
                >
                  <Ionicons
                    name={getTypeIcon(resourceData.type) as any}
                    size={24}
                    color={getTypeColor(resourceData.type)}
                  />
                </View>
                <View className="bg-blue-100 rounded px-3 py-1">
                  <Text className="text-blue-700 text-xs font-outfit-semi-bold uppercase">
                    {resourceData.type}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-900 text-2xl font-outfit-bold mb-2">
                {resourceData.title}
              </Text>
            </View>
            {isOwner && (
              <TouchableOpacity
                onPress={handleEdit}
                className="p-2"
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={24} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>

          {/* Upvote / Downvote */}
          {user && (
            <View className="flex-row items-center gap-4 mb-6">
              <TouchableOpacity
                onPress={handleUpvote}
                disabled={!canVote || votePending}
                className="flex-row items-center gap-2 px-4 py-2 rounded-lg border border-gray-200"
                style={{
                  backgroundColor: userVote === "up" ? "#DBEAFE" : "transparent",
                  opacity: !canVote || votePending ? 0.6 : 1,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={userVote === "up" ? "thumbs-up" : "thumbs-up-outline"}
                  size={22}
                  color={userVote === "up" ? "#2563EB" : "#6B7280"}
                />
                <Text
                  className="text-sm font-outfit-semi-bold"
                  style={{ color: userVote === "up" ? "#2563EB" : "#6B7280" }}
                >
                  Upvote {upvotes > 0 ? `(${upvotes})` : ""}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDownvote}
                disabled={!canVote || votePending}
                className="flex-row items-center gap-2 px-4 py-2 rounded-lg border border-gray-200"
                style={{
                  backgroundColor:
                    userVote === "down" ? "#FEE2E2" : "transparent",
                  opacity: !canVote || votePending ? 0.6 : 1,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    userVote === "down"
                      ? "thumbs-down"
                      : "thumbs-down-outline"
                  }
                  size={22}
                  color={userVote === "down" ? "#DC2626" : "#6B7280"}
                />
                <Text
                  className="text-sm font-outfit-semi-bold"
                  style={{ color: userVote === "down" ? "#DC2626" : "#6B7280" }}
                >
                  Downvote {downvotes > 0 ? `(${downvotes})` : ""}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Resource Content Based on Type */}
          {renderResourceContent(resourceData)}

          {/* Metadata */}
          <View className="mb-6">
            <Text className="text-gray-900 text-base font-outfit-semi-bold mb-3">
              Details
            </Text>
            <View className="gap-3">
              {resourceData.subject && (
                <View className="flex-row items-center">
                  <Ionicons name="book-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-600 text-sm font-outfit-regular ml-2">
                    Subject:{" "}
                    <Text className="font-outfit-semi-bold">
                      {resourceData.subject}
                    </Text>
                  </Text>
                </View>
              )}
              {resourceData.grade && (
                <View className="flex-row items-center">
                  <Ionicons name="school-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-600 text-sm font-outfit-regular ml-2">
                    Grade:{" "}
                    <Text className="font-outfit-semi-bold">
                      {resourceData.grade}
                    </Text>
                  </Text>
                </View>
              )}
              {resourceData.area && (
                <View className="flex-row items-center">
                  <Ionicons name="location-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-600 text-sm font-outfit-regular ml-2">
                    Area:{" "}
                    <Text className="font-outfit-semi-bold">
                      {resourceData.area}
                    </Text>
                  </Text>
                </View>
              )}
              {resourceData.language && (
                <View className="flex-row items-center">
                  <Ionicons name="language-outline" size={20} color="#6B7280" />
                  <Text className="text-gray-600 text-sm font-outfit-regular ml-2">
                    Language:{" "}
                    <Text className="font-outfit-semi-bold">
                      {resourceData.language}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Tags */}
          {resourceData.tags && resourceData.tags.length > 0 && (
            <View className="mb-6">
              <Text className="text-gray-900 text-base font-outfit-semi-bold mb-3">
                Tags
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {resourceData.tags.map((tag, index) => (
                  <View
                    key={index}
                    className="bg-gray-100 rounded-full px-4 py-2"
                  >
                    <Text className="text-gray-700 text-sm font-outfit-regular">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Created Date */}
          <View className="mb-6">
            <Text className="text-gray-500 text-xs font-outfit-regular">
              Created: {new Date(resourceData.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
