import React from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Community() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Community"
        showBackButton
        onBackPress={() => router.push("/(tabs)/profile")}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          <View className="py-20 items-center">
            <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-900 text-xl font-outfit-bold mt-4">
              Coming Soon
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Community features will be available soon
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
