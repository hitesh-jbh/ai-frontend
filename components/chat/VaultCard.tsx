import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { scaleFont, scaleLineHeight } from "../../utils/font-scale";
import { useServices } from "../../hooks/useServices";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

export interface VaultCardProps {
  content: string;
  qualityScore?: number;
  tokensUsed?: number;
  resourceId: string;
  vaultId: string;
  vaultTitle?: string;
  /** Shown below answer text in smaller gray font */
  vaultDescription?: string;
  onViewResource: () => void;
}

export function VaultCard({
  content,
  qualityScore,
  tokensUsed,
  resourceId,
  vaultId,
  vaultTitle,
  vaultDescription,
  onViewResource,
}: VaultCardProps) {
  const { vault } = useServices();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [reviewPending, setReviewPending] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<View>(null);

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
      setIsFollowed(vaultDetails.isFollowed);
      setIsSaved(vaultDetails.isSaved);
    }
  }, [vaultDetails]);

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

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({ x: x - 8, y: y + height + 4 });
      setDropdownVisible(true);
    });
  };

  const closeDropdown = () => setDropdownVisible(false);

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
      await vault.reviewVault(vaultId, { comment: trimmed || undefined });
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
      {/* Vault title row: badge + dropdown trigger */}
      <View
        className="flex-row items-center justify-between mb-2"
        style={{ minHeight: 28 }}
      >
        <View className="rounded-full px-2 py-1 bg-indigo-100 self-start">
          <Text
            className="font-outfit-semi-bold text-indigo-700 text-xs"
            style={{ fontSize: scaleFont(10) }}
          >
            Vault{vaultTitle ? ` · ${vaultTitle}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          ref={triggerRef as any}
          onPress={openDropdown}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="p-1"
          activeOpacity={0.7}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color="#6366F1"
          />
        </TouchableOpacity>
      </View>

      {/* Answer text */}
      <Text
        className="text-gray-900 font-outfit-regular"
        style={{
          fontSize: scaleFont(15),
          lineHeight: scaleLineHeight(scaleFont(15), 1.4),
        }}
      >
        {content}
      </Text>

      {/* Vault description below answer */}
      {vaultDescription ? (
        <Text
          className="text-gray-500 font-outfit-regular mt-1.5"
          style={{
            fontSize: scaleFont(12),
            lineHeight: scaleLineHeight(scaleFont(12), 1.35),
          }}
        >
          {vaultDescription}
        </Text>
      ) : null}

      {/* Quality score & Tokens used */}
      <View className="flex-row items-center gap-3 mt-2 flex-wrap">
        {qualityScore != null && qualityScore > 0 && (
          <View className="flex-row items-center">
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text
              className="text-gray-600 font-outfit-semi-bold ml-1 text-xs"
              style={{ fontSize: scaleFont(10) }}
            >
              {Math.round(qualityScore * 100)}%
            </Text>
          </View>
        )}
        {tokensUsed != null && tokensUsed > 0 && (
          <View className="flex-row items-center">
            <Ionicons name="flash" size={14} color="#6B7280" />
            <Text
              className="text-gray-600 font-outfit-regular ml-1 text-xs"
              style={{ fontSize: scaleFont(10) }}
            >
              {tokensUsed} tokens
            </Text>
          </View>
        )}
      </View>

      {/* View Resource + Review (below rating) */}
      <View className="mt-3 pt-2 border-t border-gray-200 flex-row flex-wrap gap-2 items-center">
        <TouchableOpacity
          className="rounded-lg px-3 py-1.5 bg-blue-500 flex-row items-center"
          onPress={onViewResource}
          activeOpacity={0.8}
        >
          <Ionicons name="open-outline" size={14} color="#FFFFFF" />
          <Text
            className="text-white font-outfit-semi-bold ml-1 text-xs"
            style={{ fontSize: scaleFont(11) }}
          >
            View Resource
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-lg px-3 py-1.5 bg-gray-400 flex-row items-center"
          onPress={openReviewModal}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={14} color="#FFFFFF" />
          <Text
            className="text-white font-outfit-semi-bold ml-1 text-xs"
            style={{ fontSize: scaleFont(11) }}
          >
            Review
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown menu (Follow / Save) */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <TouchableOpacity
            style={[
              styles.dropdownMenu,
              {
                left: menuPosition.x,
                top: menuPosition.y,
              },
            ]}
            activeOpacity={1}
            onPress={() => {}}
          >
            <TouchableOpacity
              className="flex-row items-center px-3 py-2.5 rounded-lg active:bg-indigo-50"
              onPress={() => {
                handleFollowToggle();
              }}
              disabled={followPending}
            >
              {followPending ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Ionicons
                  name={isFollowed ? "heart" : "heart-outline"}
                  size={18}
                  color={isFollowed ? "#6366F1" : "#6B7280"}
                />
              )}
              <Text
                className="ml-2 font-outfit-semi-bold text-gray-900"
                style={{ fontSize: scaleFont(13) }}
              >
                {isFollowed ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center px-3 py-2.5 rounded-lg active:bg-amber-50"
              onPress={() => {
                handleSaveToggle();
              }}
              disabled={savePending}
            >
              {savePending ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : (
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={18}
                  color={isSaved ? "#D97706" : "#6B7280"}
                />
              )}
              <Text
                className="ml-2 font-outfit-semi-bold text-gray-900"
                style={{ fontSize: scaleFont(13) }}
              >
                {isSaved ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Review modal */}
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
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm p-4"
          >
            <Text
              className="font-outfit-semi-bold text-gray-900 mb-2"
              style={{ fontSize: scaleFont(16) }}
            >
              Review
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-outfit-regular min-h-[100px]"
              style={{ fontSize: scaleFont(14) }}
              placeholder="Share your thoughts about this vault (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
              value={reviewText}
              onChangeText={setReviewText}
              editable={!reviewPending}
            />
            <View className="flex-row justify-end gap-2 mt-3">
              <TouchableOpacity
                className="rounded-lg px-4 py-2 bg-gray-200"
                onPress={closeReviewModal}
                disabled={reviewPending}
              >
                <Text
                  className="font-outfit-semi-bold text-gray-700"
                  style={{ fontSize: scaleFont(14) }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-lg px-4 py-2 bg-blue-500 flex-row items-center"
                onPress={submitReview}
                disabled={reviewPending}
              >
                {reviewPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    className="font-outfit-semi-bold text-white"
                    style={{ fontSize: scaleFont(14) }}
                  >
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

const styles = StyleSheet.create({
  dropdownMenu: {
    position: "absolute",
    minWidth: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
