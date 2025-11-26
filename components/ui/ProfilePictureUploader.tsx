import React, { useState } from "react";
import { View, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

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

  const pickImage = async () => {
    if (!editable) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photos to upload a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      onImageSelected?.(uri);
    }
  };

  return (
    <View className="items-center">
      <View
        className="rounded-full overflow-hidden bg-gray-200 items-center justify-center"
        style={{ width: size, height: size }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: size, height: size }}
            resizeMode="cover"
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

