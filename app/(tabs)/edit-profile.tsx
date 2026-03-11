import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../../store/auth-store";
import { ProfilePictureUploader } from "../../components/ui/ProfilePictureUploader";
import { ControlledInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

const editProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  bio: z.union([z.string().max(500), z.literal("")]).optional(),
  upiId: z.union([z.string().max(255), z.literal("")]).optional(),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

export default function EditProfile() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { profile } = useServices();

  // Fetch latest profile data
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.getProfile(),
    enabled: !!user,
  });

  const displayUser = profileData || user;
  const [profileImageUri, setProfileImageUri] = useState<string | undefined>(
    displayUser?.profilePicture
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: displayUser?.name || "",
      bio: displayUser?.bio || "",
      upiId: (displayUser as any)?.upiId || "",
    },
  });

  // Update form when profile data is loaded (only if data changed)
  useEffect(() => {
    if (profileData) {
      const hasChanges =
        !user?.bio ||
        user.bio !== profileData.bio ||
        user.name !== profileData.name ||
        user.profilePicture !== profileData.profilePicture;

      if (hasChanges) {
        reset({
          name: profileData.name || "",
          bio: profileData.bio || "",
          upiId: (profileData as any)?.upiId || "",
        });
        setProfileImageUri(profileData.profilePicture);
        if (user) {
          setUser({ ...user, ...profileData });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profileData?.id,
    profileData?.bio,
    profileData?.profilePicture,
    profileData?.name,
    (profileData as any)?.upiId,
  ]);

  const updateProfileMutation = useMutation({
    mutationFn: async (
      data: EditProfileForm & { profilePictureUri?: string }
    ) => {
      let profilePictureUrl = profileImageUri;

      // If profileImageUri is a local file (starts with file://), upload it first
      if (profileImageUri && profileImageUri.startsWith("file://")) {
        try {
          profilePictureUrl =
            await profile.uploadProfilePicture(profileImageUri);
        } catch (uploadError: any) {
          throw new Error(
            uploadError?.response?.data?.message ||
              "Failed to upload profile picture"
          );
        }
      }

      // Prepare update data
      const updateData: {
        name: string;
        bio?: string;
        profilePicture?: string;
        upiId?: string;
      } = {
        name: data.name,
      };

      // Include bio - can be empty string to clear it
      if (data.bio !== undefined) {
        const trimmedBio = data.bio.trim();
        updateData.bio = trimmedBio === "" ? "" : trimmedBio;
      }

      // Include UPI ID - can be empty string to clear it
      if (data.upiId !== undefined) {
        const trimmedUpiId = data.upiId.trim();
        updateData.upiId = trimmedUpiId === "" ? "" : trimmedUpiId;
      }

      // Only include profilePicture if it's a valid URL (not a local file path)
      // If profilePictureUrl is undefined or empty, don't send it (keeps existing)
      if (profilePictureUrl && !profilePictureUrl.startsWith("file://")) {
        updateData.profilePicture = profilePictureUrl;
      }

      // Update profile
      return profile.updateProfile(updateData);
    },
    onSuccess: (data) => {
      if (user) {
        setUser({ ...user, ...data });
      }
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.refetchQueries({ queryKey: ["profile"] });
      showSuccessToast("Success", "Profile updated successfully");
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile";
      showErrorToast("Error", errorMessage);
    },
  });

  const onSubmit = async (data: EditProfileForm) => {
    updateProfileMutation.mutate({
      ...data,
      profilePictureUri: profileImageUri,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Edit Profile"
        showBackButton
        onBackPress={() => router.push("/(tabs)/options")}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          {/* Profile Picture */}
          <View className="items-center mb-8">
            <ProfilePictureUploader
              imageUri={profileImageUri}
              onImageSelected={setProfileImageUri}
              size={120}
              editable={true}
            />
          </View>

          {/* Name Field */}
          <View className="mb-2">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
              Name <Text className="text-red-500">*</Text>
            </Text>
            <ControlledInput
              control={control}
              name="name"
              label=""
              placeholder="Enter your name"
            />
            {errors.name && (
              <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                {errors.name.message}
              </Text>
            )}
          </View>

          {/* Bio Field */}
          <View className="mb-4">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
              Bio
            </Text>
            <Controller
              control={control}
              name="bio"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="bg-gray-100 rounded-lg p-4 min-h-[120px]">
                  <TextInput
                    className="text-gray-900 text-base font-outfit-regular"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ""}
                    multiline
                    numberOfLines={4}
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                    placeholder="Hi, write about yourself.. 😊"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              )}
            />
            {errors.bio && (
              <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                {errors.bio.message}
              </Text>
            )}
          </View>

          {/* UPI ID Field */}
          <View className="mb-6">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
              UPI ID
            </Text>
            <ControlledInput
              control={control}
              name="upiId"
              label=""
              placeholder="yourname@upi"
            />
            {errors.upiId && (
              <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                {errors.upiId.message}
              </Text>
            )}
            <Text className="text-gray-500 text-xs font-outfit-regular mt-1">
              Required for coin redemption. Format: yourname@upi
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Button
              title="Save Changes"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting || updateProfileMutation.isPending}
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => router.back()}
              disabled={isSubmitting || updateProfileMutation.isPending}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
