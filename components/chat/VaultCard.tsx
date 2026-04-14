import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useServices } from "../../hooks/useServices";
import { scaleFont, scaleLineHeight } from "../../utils/font-scale";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

export interface VaultCardProps {
  content: string;
  qualityScore?: number;
  tokensUsed?: number;
  weight?: number;
  resourceId: string;
  vaultId: string;
  vaultTitle?: string;
  vaultDescription?: string;
  onViewResource: () => void;
}

export function VaultCard({
  content,
  qualityScore,
  tokensUsed,
  weight,
  resourceId,
  vaultId,
  vaultTitle,
  vaultDescription,
  onViewResource,
}: VaultCardProps) {
  const { vault } = useServices();

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [followPending, setFollowPending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [reviewPending, setReviewPending] = useState(false);

  const { data: vaultDetails } = useQuery({
    queryKey: ["vaultDetails", vaultId],
    queryFn: () => vault.getVaultDetailsById(vaultId),
    enabled: !!vaultId,
    staleTime: 60000,
    retry: 1,
  });

  const [isFollowed, setIsFollowed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (vaultDetails) {
      setIsFollowed(vaultDetails.isFollowed ?? false);
      setIsSaved(vaultDetails.isSaved ?? false);
    }
  }, [vaultDetails, vaultId]);

  const handleFollowToggle = async () => {
    if (followPending) return;

    const next = !isFollowed;
    setIsFollowed(next);
    setFollowPending(true);

    try {
      if (next) {
        await vault.followVault(vaultId);
      } else {
        await vault.unfollowVault(vaultId);
      }
    } catch {
      setIsFollowed(!next);
      showErrorToast("Error", "Failed to update follow state.");
    } finally {
      setFollowPending(false);
    }
  };

  const handleSaveToggle = async () => {
    if (savePending) return;

    const next = !isSaved;
    setIsSaved(next);
    setSavePending(true);

    try {
      if (next) {
        await vault.saveVault(vaultId);
      } else {
        await vault.unsaveVault(vaultId);
      }
    } catch {
      setIsSaved(!next);
      showErrorToast("Error", "Failed to update save state.");
    } finally {
      setSavePending(false);
    }
  };

  const openReviewModal = () => setReviewModalVisible(true);

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setReviewText("");
  };

  const submitReview = async () => {
    const trimmed = reviewText.trim();

    if (reviewPending) return;

    setReviewPending(true);

    try {
      await vault.reviewVault(vaultId, {
        comment: trimmed || undefined,
      });

      showSuccessToast("Thank you", "Your review was submitted.");
      closeReviewModal();
    } catch {
      showErrorToast("Error", "Failed to submit review.");
    } finally {
      setReviewPending(false);
    }
  };

  return (
    <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
      {/* Vault Title */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="rounded-full px-2 py-1 bg-indigo-100">
          <Text
            className="font-outfit-semi-bold text-indigo-700 text-xs"
            style={{ fontSize: scaleFont(10) }}
          >
            Vault
          </Text>
        </View>

        {/* Follow + Save */}
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleFollowToggle}
            disabled={followPending}
            className={`flex-row items-center px-3 py-1.5 rounded-full mr-2 ${
              isFollowed ? "bg-indigo-100" : "bg-gray-200"
            }`}
          >
            {followPending ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <>
                <Ionicons
                  name={isFollowed ? "heart" : "heart-outline"}
                  size={14}
                  color={isFollowed ? "#6366F1" : "#374151"}
                />
                <Text className="ml-1 text-xs text-gray-700">Follow</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSaveToggle}
            disabled={savePending}
            className={`flex-row items-center px-3 py-1.5 rounded-full ${
              isSaved ? "bg-amber-100" : "bg-gray-200"
            }`}
          >
            {savePending ? (
              <ActivityIndicator size="small" color="#D97706" />
            ) : (
              <>
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={14}
                  color={isSaved ? "#D97706" : "#374151"}
                />
                <Text className="ml-1 text-xs text-gray-700">Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <Text
        selectable={true}
        className="text-gray-900 font-outfit-regular"
        style={{
          fontSize: scaleFont(15),
          lineHeight: scaleLineHeight(scaleFont(15), 1.4),
        }}
      >
        {content}
      </Text>

      {/* Description */}
      {vaultDescription ? (
        <Text
          className="text-gray-500 mt-1.5"
          style={{
            fontSize: scaleFont(12),
            lineHeight: scaleLineHeight(scaleFont(12), 1.35),
          }}
        >
          {vaultDescription}
        </Text>
      ) : null}

      {/* Weight */}
      <View className="flex-row items-center mt-2">
        {weight != null && (
          <View className="rounded px-2 py-0.5 bg-indigo-100">
            <Text
              className="text-indigo-700 font-outfit-semi-bold"
              style={{ fontSize: scaleFont(10) }}
            >
              weight {weight}%
            </Text>
          </View>
        )}
      </View>

      {/* Buttons Bottom Right – narrower and spaced with gap */}
      <View className="mt-2 pt-2 border-t border-gray-200 flex-row items-center gap-1">

  <TouchableOpacity
    className="flex-1 rounded-md py-1.5 bg-blue-500 flex-row items-center justify-center"
    onPress={onViewResource}
  >
    <Ionicons name="open-outline" size={16} color="#FFFFFF" />
    <Text className="text-white ml-1 text-xs">Resource</Text>
  </TouchableOpacity>

  <TouchableOpacity
    className="flex-1 rounded-md py-1.5 bg-gray-400 flex-row items-center justify-center"
    onPress={openReviewModal}
  >
    <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
    <Text className="text-white ml-1 text-xs">Review</Text>
  </TouchableOpacity>

</View>

      {/* Review Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeReviewModal}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-6"
          activeOpacity={1}
          onPress={closeReviewModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e: any) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm p-4"
          >
            <Text
              className="font-outfit-semi-bold text-gray-900 mb-2"
              style={{ fontSize: scaleFont(16) }}
            >
              Review
            </Text>

            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
              placeholder="Share your thoughts about this vault (optional)"
              multiline
              value={reviewText}
              onChangeText={setReviewText}
              editable={!reviewPending}
            />

            <View className="flex-row justify-end mt-3">
              <TouchableOpacity
                className="rounded-lg px-4 py-2 bg-gray-200 mr-2"
                onPress={closeReviewModal}
              >
                <Text style={{ fontSize: scaleFont(14) }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="rounded-lg px-4 py-2 bg-blue-500"
                onPress={submitReview}
              >
                {reviewPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontSize: scaleFont(14) }}>
                    Submit
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
