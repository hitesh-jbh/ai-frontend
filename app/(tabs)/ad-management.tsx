import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdManagement() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 pt-4">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-gray-900 text-xl font-outfit-bold">
            Ad Management
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          <View className="py-20 items-center">
            <Ionicons name="megaphone-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-900 text-xl font-outfit-bold mt-4">
              Coming Soon
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Ad management features will be available soon
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

