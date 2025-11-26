import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface TrendingBannerProps {
  trendingText?: string;
  onCreateVault?: () => void;
  onStartEarning?: () => void;
  onTutorials?: () => void;
}

export const TrendingBanner: React.FC<TrendingBannerProps> = ({
  trendingText = 'Trending: "Testbyapp2" earned 0 coin',
  onCreateVault,
  onStartEarning,
  onTutorials,
}) => {
  return (
    <View className="rounded-3xl overflow-hidden mb-6">
      <LinearGradient
        colors={["#3B82F6", "#1E40AF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View className="flex-row items-center justify-center mb-4">
          <Ionicons name="flame" size={16} color="#F97316" />
          <Text className="text-white text-xs font-outfit-medium ml-1">
            {trendingText}
          </Text>
        </View>

        <Text className="text-white text-2xl font-outfit-bold mb-2 text-center">
          Turning Knowledge Into
        </Text>

        <View className="bg-white rounded-full px-4 py-2 self-center mb-6">
          <Text className="text-blue-600 text-lg font-outfit-bold">
            Sustainable Income
          </Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onCreateVault}
            className="bg-white/20 rounded-lg px-4 py-4 flex-1"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-outfit-semi-bold text-center">
              Create Vault
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onStartEarning}
            className="bg-white/20 rounded-lg px-4 py-4 flex-1"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-outfit-semi-bold text-center">
              Start Earning
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onTutorials}
            className="bg-white/20 rounded-lg px-4 py-4 flex-1"
            activeOpacity={0.7}
          >
            <Text className="text-white text-sm font-outfit-semi-bold text-center">
              Tutorials
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    padding: 24,
  },
});
