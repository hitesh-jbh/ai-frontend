import { ActivityIndicator, View } from "react-native";
import React from "react";
import { useAuthStore } from "@/store/auth-store";
import { Redirect } from "expo-router";

const Index = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => {
    return state.isAuthenticated;
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={"#3B82F6"} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
};

export default Index;
