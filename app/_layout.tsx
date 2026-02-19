import { toastConfig } from "@/utils/toast";
import { isApiUrlConfigured } from "@/utils/config";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, Component } from "react";
import { View, Text, Alert } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ToastManager from "toastify-react-native";
import { AuthInitializer } from "../components/AuthInitializer";
import { SubscriptionInitializer } from "../components/SubscriptionInitializer";
import { ReactQueryProvider } from "../lib/react-query";
import { adMobAdManager } from "../lib/admob-ad-manager";
import "./globals.css";


class RootErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-white justify-center px-6" edges={["top", "bottom", "left", "right"]}>
            <StatusBar style="dark" />
            <Text className="text-center text-lg font-semibold text-gray-900 mb-2">Something went wrong</Text>
            <Text className="text-center text-gray-600">
              Restart the app. If it keeps happening, reinstall from the store.
            </Text>
          </SafeAreaView>
        </SafeAreaProvider>
      );
    }
    return this.props.children;
  }
}

// Avoid crashing the app if fonts fail (e.g. missing in build); hide splash and use system fonts
function useFontsSafe() {
  const [fontsLoaded, fontError] = useFonts({
    "Outfit-ExtraLight": require("../assets/fonts/outfit/Outfit-ExtraLight.ttf"),
    "Outfit-Light": require("../assets/fonts/outfit/Outfit-Light.ttf"),
    "Outfit-Regular": require("../assets/fonts/outfit/Outfit-Regular.ttf"),
    "Outfit-Medium": require("../assets/fonts/outfit/Outfit-Medium.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/outfit/Outfit-SemiBold.ttf"),
    "Outfit-Bold": require("../assets/fonts/outfit/Outfit-Bold.ttf"),
    "Outfit-ExtraBold": require("../assets/fonts/outfit/Outfit-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (fontError) {
      console.warn("[RootLayout] Font load failed, using system fonts:", fontError?.message ?? fontError);
    }
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return fontsLoaded || !!fontError;
}

export default function RootLayout() {
  const ready = useFontsSafe();

  useEffect(() => {
    adMobAdManager.initialize().catch((error) => {
      console.error("[AdMob] Failed to initialize:", error);
    });
  }, []);

  if (!ready) {
    return null;
  }

  if (!isApiUrlConfigured()) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom", "left", "right"]}>
          <StatusBar style="dark" backgroundColor="transparent" />
          <View className="flex-1 justify-center px-6">
            <Text className="text-center text-lg font-semibold text-gray-900 mb-2">
              Backend not configured
            </Text>
            <Text className="text-center text-gray-600">
              Set EXPO_PUBLIC_API_URL in EAS (eas.json or Expo dashboard → Project → Environment variables) to your API URL, then create a new build.
            </Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <KeyboardProvider>
          <ReactQueryProvider>
            <SafeAreaView
              className="flex-1 bg-white"
              edges={["bottom", "left", "right"]}
            >
              <ToastManager config={toastConfig} />
              <StatusBar style="dark" backgroundColor="transparent" />
              <AuthInitializer />
              <SubscriptionInitializer />
              <Stack screenOptions={{ headerShown: false }} />
            </SafeAreaView>
          </ReactQueryProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}
