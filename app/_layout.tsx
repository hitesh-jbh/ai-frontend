import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ReactQueryProvider } from "../lib/react-query";
import "./globals.css";
import { Platform, StatusBar } from "react-native";
import { useAuthStore } from "../store/auth-store";
import * as NavigationBar from "expo-navigation-bar";

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

  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#ffffff");
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <ReactQueryProvider>
          <SafeAreaView
            className="flex-1 bg-white"
            edges={["bottom", "left", "right"]}
          >
            <StatusBar backgroundColor={"#fff"} barStyle={"dark-content"} />
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaView>
        </ReactQueryProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
