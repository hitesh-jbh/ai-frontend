import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AnalyticsChartProps {
  period?: string;
  data?: Array<{ name: string; value: number }>;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  period = "All Time",
  data = [
    { name: "Joy", value: 9 },
    { name: "Govind", value: 9 },
    { name: "Joyboy", value: 6 },
    { name: "aman", value: 3 },
  ],
}) => {
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10);

  return (
    <View className="bg-white rounded-lg p-4 mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name="analytics" size={20} color="#3B82F6" />
          <Text className="text-gray-900 text-lg font-outfit-semi-bold ml-2">
            Analytics
          </Text>
        </View>
        <TouchableOpacity
          className="bg-gray-100 rounded-lg px-3 py-1.5 flex-row items-center"
          activeOpacity={0.7}
        >
          <Text className="text-gray-700 text-sm font-outfit-regular mr-1">
            {period}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-end justify-between h-32 mb-2">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          return (
            <View key={index} className="flex-1 items-center mx-1">
              <View
                className="w-full items-center justify-end"
                style={{ height: "100%" }}
              >
                <View
                  className="bg-blue-500 rounded-t-lg w-full"
                  style={{ height: `${height}%`, minHeight: 20 }}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between">
        {data.map((item, index) => (
          <Text
            key={index}
            className="text-gray-500 text-xs font-outfit-regular flex-1 text-center"
            numberOfLines={1}
          >
            {item.name}
          </Text>
        ))}
      </View>
    </View>
  );
};
