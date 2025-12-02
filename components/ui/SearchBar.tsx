import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useServices } from "../../hooks/useServices";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  onSuggestionSelect?: (suggestion: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  onSuggestionSelect,
  placeholder = "Search for knowledge vault..",
  showSuggestions = true,
  debounceMs = 300,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);
  const { search } = useServices();

  // Debounce the query for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  // Fetch suggestions
  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["searchSuggestions", debouncedQuery],
    queryFn: async () => {
      try {
        const result = await search.getSuggestions(debouncedQuery, 8);
        return result || [];
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
      }
    },
    enabled: showSuggestions && debouncedQuery.length >= 2 && showDropdown,
    staleTime: 5000,
  });

  const handleFocus = () => {
    if (showSuggestions && value.length >= 2) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow suggestion selection - onPressIn sets the flag before blur
    setTimeout(() => {
      if (!isSelectingSuggestion) {
        setShowDropdown(false);
      }
    }, 300);
  };

  const handleSuggestionPress = (suggestion: string) => {
    // Update the search query immediately
    onChangeText(suggestion);

    // Close dropdown
    setShowDropdown(false);

    // Reset flag after dropdown closes
    setTimeout(() => {
      setIsSelectingSuggestion(false);
    }, 400);

    // Trigger callbacks with a small delay to ensure text is updated
    setTimeout(() => {
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
      if (onSearch) {
        onSearch();
      }
    }, 100);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "history":
        return "time-outline";
      case "trending":
        return "trending-up-outline";
      case "related":
        return "bulb-outline";
      default:
        return "search-outline";
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case "history":
        return "#6B7280";
      case "trending":
        return "#3B82F6";
      case "related":
        return "#10B981";
      default:
        return "#9CA3AF";
    }
  };

  return (
    <View className="relative">
      <View className="bg-gray-100 rounded-3xl flex-row items-center px-4 py-3">
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          className="flex-1 ml-3 text-gray-900 font-outfit-regular text-base"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            if (showSuggestions && text.length >= 2) {
              setShowDropdown(true);
            } else {
              setShowDropdown(false);
            }
          }}
          onSubmitEditing={onSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
        />
        {isLoadingSuggestions && showDropdown && (
          <ActivityIndicator size="small" color="#3B82F6" />
        )}
        {value.length > 0 && !isLoadingSuggestions && (
          <TouchableOpacity
            onPress={() => {
              onChangeText("");
              setShowDropdown(false);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions &&
        showDropdown &&
        suggestions &&
        suggestions.length > 0 && (
          <View className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-lg border border-gray-200 z-50 max-h-64">
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item.query}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3 border-b border-gray-100"
                  activeOpacity={0.7}
                  onPressIn={() => setIsSelectingSuggestion(true)}
                  onPress={() => handleSuggestionPress(item.query)}
                >
                  <Ionicons
                    name={getSuggestionIcon(item.type) as any}
                    size={18}
                    color={getSuggestionColor(item.type)}
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-900 text-sm font-outfit-regular">
                      {item.query}
                    </Text>
                    {item.count !== undefined && (
                      <Text className="text-gray-500 text-xs font-outfit-regular mt-0.5">
                        {item.count} results
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            />
          </View>
        )}
    </View>
  );
};
