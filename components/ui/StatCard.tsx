import React from "react";
import { View, Text } from "react-native";

interface StatCardProps {
  value: string;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label }) => {
  return (
    <View className="bg-white rounded-3xl p-4 flex-1 mx-1 shadow-sm border border-gray-100">
      <Text className="text-gray-900 text-2xl font-outfit-bold mb-1 text-center">
        {value}
      </Text>
      <Text className="text-gray-600 text-xs font-outfit-regular text-center">
        {label}
      </Text>
    </View>
  );
};
