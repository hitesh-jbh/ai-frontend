import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onToggle,
  label,
}) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row items-center"
      activeOpacity={0.7}
    >
      <View
        className={`w-5 h-5 rounded border-2 items-center justify-center mr-2 ${
          checked ? "bg-blue-500 border-blue-500" : "border-gray-300"
        }`}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
      <Text className="text-gray-800 text-sm font-outfit-regular">{label}</Text>
    </TouchableOpacity>
  );
};
