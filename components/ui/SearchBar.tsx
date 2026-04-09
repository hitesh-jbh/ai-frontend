import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  ActivityIndicator,
  Platform,
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
  inputRef?: React.RefObject<TextInput | null>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  onSuggestionSelect,
  placeholder = "Search for knowledge vault..",
  showSuggestions = true,
  debounceMs = 300,
  inputRef,
}) => {
  const MIN_INPUT_HEIGHT = 40;
  const MAX_INPUT_HEIGHT = 180;

  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
  const { search } = useServices();

  // Debounce the query for suggestions - only update if value actually changed
  useEffect(() => {
    if (value === debouncedQuery) return; // Skip if already the same

    const timer = setTimeout(() => {
      setDebouncedQuery(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  // Fetch suggestions - only when dropdown is shown and query is long enough
  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["searchSuggestions", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      try {
        const result = await search.getSuggestions(debouncedQuery, 4);
        return result || [];
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
      }
    },
    enabled: showSuggestions && debouncedQuery.length >= 2 && showDropdown,
    staleTime: 10000, // Cache for 10 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });

  const handleFocus = () => {
    if (showSuggestions && value.length >= 2) {
      setShowDropdown(true);
    } else if (showSuggestions && debouncedQuery.length >= 2) {
      // Show dropdown if we have debounced query even if current value is short
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow suggestion selection - onPressIn sets the flag before blur
    // Increase delay when keyboard is visible to ensure suggestions are clickable
    setTimeout(() => {
      if (!isSelectingSuggestion) {
        setShowDropdown(false);
      }
    }, 500);
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

    // Trigger callback with a small delay to ensure text is updated
    setTimeout(() => {
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
      // Don't auto-trigger search - user needs to click search button
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

  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));

  return (
    <View className="relative">
      <View className="bg-gray-100 rounded-3xl flex-row items-center px-4 py-3">
        <Ionicons name="search" size={20} color="#6B7280" />
        <TextInput
          ref={inputRef}
          className="flex-1 ml-3 text-gray-900 font-outfit-regular text-base"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            // Show dropdown when user types (will be debounced for API calls)
            if (showSuggestions && text.length >= 2) {
              setShowDropdown(true);
            } else if (text.length < 2) {
              setShowDropdown(false);
            }
          }}
          multiline={true}
          textAlignVertical="top"
          onContentSizeChange={(e) => {
            const nextHeight = clamp(
              Math.ceil(e.nativeEvent.contentSize.height),
              MIN_INPUT_HEIGHT,
              MAX_INPUT_HEIGHT
            );
            setInputHeight(nextHeight);
          }}
          scrollEnabled={inputHeight >= MAX_INPUT_HEIGHT}
          onKeyPress={(e) => {
            // On native, rely on onSubmitEditing for consistent "Enter to search".
            // On web, enable Shift+Enter for newline (optional requirement).
            if (Platform.OS !== "web") return;

            const key = (e.nativeEvent as any)?.key;
            const shiftKey = (e.nativeEvent as any)?.shiftKey;
            if (key !== "Enter") return;

            if (shiftKey) {
              onChangeText(`${value}\n`);
              return;
            }

            if (onSearch && value.trim().length > 0) {
              onSearch();
            }
          }}
          onSubmitEditing={() => {
            if (onSearch && value.trim().length > 0) {
              onSearch();
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          blurOnSubmit={true}
          style={[
            {
              minHeight: MIN_INPUT_HEIGHT,
              height: inputHeight,
              maxHeight: MAX_INPUT_HEIGHT,
            },
            Platform.OS === "web" ? ({ resize: "none" } as any) : null,
          ]}
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
            className="mr-2"
          >
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
        {onSearch && !isLoadingSuggestions && (
          <TouchableOpacity
            className="bg-blue-200 rounded-full p-2"
            onPress={() => {
              if (value.trim().length > 0) {
                onSearch();
              }
            }}
            activeOpacity={value.trim().length > 0 ? 0.7 : 1}
            disabled={value.trim().length === 0}
          >
            <Ionicons
              name="search"
              size={20}
              color={value.trim().length > 0 ? "#3B82F6" : "#9CA3AF"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions &&
        showDropdown &&
        suggestions &&
        suggestions.length > 0 && (
          <View
            className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-lg border border-gray-200 max-h-64"
            style={{
              zIndex: 9999,
              elevation: Platform.OS === "android" ? 10 : 0,
            }}
          >
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item.query}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3 border-b border-gray-100"
                  activeOpacity={0.7}
                  onPressIn={() => {
                    setIsSelectingSuggestion(true);
                  }}
                  onPress={() => {
                    handleSuggestionPress(item.query);
                  }}
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
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
    </View>
  );
};
