import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightElement,
}) => {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const showRight = !!(showBackButton || rightElement);

  return (
    <View
      style={{ minHeight: 100, paddingHorizontal: 24 }}
      className="flex-row items-center justify-center"
    >
      {showBackButton ? (
        <TouchableOpacity
          onPress={handleBackPress}
          className="mr-4 bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
      ) : showRight ? (
        <View className="w-14 h-14 rounded-full items-center justify-center" />
      ) : null}
      <Text className="text-gray-900 text-2xl font-outfit-bold flex-1 text-center">
        {title}
      </Text>

      {showRight && (
        <View className="min-w-14 min-h-14 flex-row items-center justify-end">
          {rightElement}
        </View>
      )}
    </View>
  );
};
