import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ReactQueryProvider } from "../lib/react-query";
import "./globals.css";
import { StatusBar } from "expo-status-bar";
import { AuthInitializer } from "../components/AuthInitializer";
import { SubscriptionInitializer } from "../components/SubscriptionInitializer";
import ToastManager from "toastify-react-native";
import { toastConfig } from "@/utils/toast";
// import { NavigationContainer } from "@react-navigation/native";
import { adMobAdManager } from "../lib/admob-ad-manager";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Outfit-ExtraLight": require("../assets/fonts/outfit/Outfit-ExtraLight.ttf"),
    "Outfit-Light": require("../assets/fonts/outfit/Outfit-Light.ttf"),
    "Outfit-Regular": require("../assets/fonts/outfit/Outfit-Regular.ttf"),
    "Outfit-Medium": require("../assets/fonts/outfit/Outfit-Medium.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/outfit/Outfit-SemiBold.ttf"),
    "Outfit-Bold": require("../assets/fonts/outfit/Outfit-Bold.ttf"),
    "Outfit-ExtraBold": require("../assets/fonts/outfit/Outfit-ExtraBold.ttf"),
  });

  // Initialize AdMob when app starts
  useEffect(() => {
    adMobAdManager.initialize().catch((error) => {
      console.error("[AdMob] Failed to initialize:", error);
      // Don't show error to user - mock mode will be used as fallback
    });
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  return (
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
  );
}
