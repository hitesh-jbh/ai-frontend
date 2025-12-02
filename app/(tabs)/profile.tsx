import React, { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth-store";
import { ProfilePictureUploader } from "../../components/ui/ProfilePictureUploader";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { Ionicons } from "@expo/vector-icons";

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-gray-100"
      activeOpacity={0.7}
    >
      <Text className="text-gray-900 text-base font-outfit-regular">
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#6B7280" />
    </TouchableOpacity>
  );
};

export default function Profile() {
  const { user, logout, setUser } = useAuthStore();
  const { profile } = useServices();
  const queryClient = useQueryClient();

  // Fetch latest profile data
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.getProfile(),
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
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

  const handleLogout = async () => {
    try {
      // Clear all query cache
      queryClient.clear();
      // Logout and clear tokens
      await logout();
      // Navigate to login
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear cache and navigate even if logout API call fails
      queryClient.clear();
      router.replace("/(auth)/login");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Options"
        showBackButton
        onBackPress={() => router.push("/(tabs)/vaults")}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6">
          {/* Profile Section */}
          <View className="items-center mb-8">
            <ProfilePictureUploader
              imageUri={displayUser?.profilePicture}
              size={120}
              editable={false}
            />
            <Text className="text-gray-900 text-2xl font-outfit-bold mt-4 uppercase">
              {displayUser?.name || "User"}
            </Text>
          </View>

          {/* Menu Items */}
          <View className="bg-white rounded-lg mb-6">
            <MenuItem
              icon="person-outline"
              label="Edit Profile"
              onPress={() => router.push("/(tabs)/edit-profile")}
            />
            <MenuItem icon="mail-outline" label="Contact" onPress={() => {}} />
            <MenuItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {}}
            />
            <MenuItem
              icon="gift-outline"
              label="Rewards"
              onPress={() => router.push("/(tabs)/rewards")}
            />
            <MenuItem
              icon="people-outline"
              label="Community"
              onPress={() => router.push("/(tabs)/community")}
            />
            <MenuItem
              icon="school-outline"
              label="Quizzes"
              onPress={() => router.push("/(tabs)/quizzes")}
            />
            <MenuItem
              icon="megaphone-outline"
              label="Ad Management"
              onPress={() => router.push("/(tabs)/ad-management")}
            />
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 rounded-3xl py-4 px-4 flex-row items-center justify-center mb-6"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text className="text-white text-base font-outfit-semi-bold ml-2">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
