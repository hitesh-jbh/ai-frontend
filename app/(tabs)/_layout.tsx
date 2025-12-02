import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";

const TabsLayout = () => {
  const isAuthenticated = useAuthStore((state) => {
    return state.isAuthenticated;
  });

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#000000",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          borderTopColor: "#E5E7EB",
          height: Platform.OS === "ios" ? 88 : 72,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Outfit-Medium",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "trophy" : "trophy-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="vaults"
        options={{
          title: "Vaults",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "lock-closed" : "lock-closed-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="create-vault"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="edit-resource"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="add-resource"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="edit-vault"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="view-resource"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="view-vault"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="quizzes"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ad-management"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "menu" : "menu-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
