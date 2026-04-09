import React from "react";
import { View, TouchableOpacity, Text } from "react-native";

export type AiPreference = "short" | "medium" | "deep_search";

type Props = {
  value: AiPreference;
  onChange: (value: AiPreference) => void;
};

const OPTIONS: { value: AiPreference; label: string }[] = [
  { value: "short", label: "⚡ Quick" },
  { value: "medium", label: "⚖️ Balanced" },
  { value: "deep_search", label: "🔍 Deep" },
];

export function AiPreferenceButtons({ value, onChange }: Props) {
  return (
    <View className="flex-row items-center gap-2">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
            className={`px-4 py-2 rounded-full ${
              selected ? "bg-blue-500 shadow-sm" : "bg-gray-100"
            }`}
          >
            <Text
              className={`${selected ? "text-white font-semibold" : "text-gray-700"}`}
              style={{ fontSize: 15 }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

