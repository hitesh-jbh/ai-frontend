import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { showErrorToast, showInfoToast } from "../../utils/toast";

interface ProfilePictureUploaderProps {
  imageUri?: string;
  onImageSelected?: (uri: string) => void;
  size?: number;
  editable?: boolean;
}

export const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  imageUri,
  onImageSelected,
  size = 100,
  editable = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Normalize image URL and reset error state when imageUri changes
  const normalizedImageUri = normalizeImageUrl(imageUri);

  useEffect(() => {
    if (normalizedImageUri) {
      setImageError(false);
    }
  }, [normalizedImageUri]);

  const pickImage = async () => {
    if (!editable) return;

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showInfoToast(
          "Permission Required",
          "We need access to your photos to upload a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (
        !result.canceled &&
        result.assets &&
        result.assets.length > 0 &&
        result.assets[0]?.uri
      ) {
        const uri = result.assets[0].uri;
        onImageSelected?.(uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showErrorToast("Error", "Failed to pick image. Please try again.");
    }
  };

  return (
    <View className="items-center">
      <View
        className="rounded-full overflow-hidden bg-gray-200 items-center justify-center"
        style={{ width: size, height: size }}
      >
        {normalizedImageUri && !imageError ? (
          <Image
            key={normalizedImageUri} // Force re-render when URL changes
            source={{ uri: normalizedImageUri }}
            style={{ width: size, height: size }}
            contentFit="cover"
            transition={200}
            onError={(error) => {
              console.error("Failed to load image:", normalizedImageUri, error);
              setImageError(true);
            }}
            onLoad={() => {
              console.log("Image loaded successfully:", normalizedImageUri);
              setImageError(false);
            }}
          />
        ) : (
          <Ionicons name="person" size={size * 0.5} color="#6B7280" />
        )}
      </View>
      {editable && (
        <TouchableOpacity
          onPress={pickImage}
          disabled={uploading}
          className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 border-2 border-white"
          activeOpacity={0.7}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};
