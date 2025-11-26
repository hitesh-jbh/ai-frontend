import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  placeholder = "Search for knowledge vault..",
}) => {
  return (
    <View className="bg-gray-100 rounded-3xl flex-row items-center px-4 py-3">
      <Ionicons name="search" size={20} color="#6B7280" />
      <TextInput
        className="flex-1 ml-3 text-gray-900 font-outfit-regular text-base"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSearch}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={20} color="#6B7280" />
        </TouchableOpacity>
      )}
    </View>
  );
};
