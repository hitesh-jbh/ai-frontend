import { Redirect, Slot } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth-store";

const AuthLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return (
    <SafeAreaView>
      <View>
        <Text>AuthLayout</Text>
        <Slot />
      </View>
    </SafeAreaView>
  );
};

export default AuthLayout;
