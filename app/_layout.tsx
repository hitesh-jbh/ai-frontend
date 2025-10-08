import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ReactQueryProvider } from "../lib/react-query";
import "./globals.css";

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

  useEffect(() => {
    if (fontError) throw fontError;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  return (
    <SafeAreaProvider>
      <ReactQueryProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ReactQueryProvider>
    </SafeAreaProvider>
  );
}
