import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth-store";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { Ionicons } from "@expo/vector-icons";

export default function Contacts() {
  const { user } = useAuthStore();
  const { profile } = useServices();

  const { data: profileData, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.getProfile(),
    enabled: !!user,
  });

  const displayUser = profileData || user;
  const email = displayUser?.email;
  const phone = displayUser?.phone;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Contact"
        showBackButton
        onBackPress={() => router.push("/(tabs)/options")}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-500 font-outfit-regular mt-3">
                Loading your contact details...
              </Text>
            </View>
          ) : isError ? (
            <View className="py-12 items-center">
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text className="text-gray-700 font-outfit-semi-bold mt-3">
                Could not load contact details
              </Text>
              <Text className="text-gray-500 font-outfit-regular mt-1 text-center">
                Please try again later.
              </Text>
            </View>
          ) : (
            <View className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <Text className="text-gray-500 text-sm font-outfit-semi-bold mb-4 uppercase tracking-wide">
                Your contact information
              </Text>

              <View className="gap-4">
                <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-100">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Ionicons name="mail-outline" size={22} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs font-outfit-regular mb-0.5">
                      Email
                    </Text>
                    <Text className="text-gray-900 text-base font-outfit-medium">
                      {email || "—"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center bg-white rounded-xl p-4 border border-gray-100">
                  <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                    <Ionicons name="call-outline" size={22} color="#22C55E" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs font-outfit-regular mb-0.5">
                      Mobile number
                    </Text>
                    <Text className="text-gray-900 text-base font-outfit-medium">
                      {phone || "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {(!email && !phone) && (
                <Text className="text-gray-500 text-sm font-outfit-regular mt-4">
                  No contact details found. These are set when you sign up or can be updated in your account settings.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
