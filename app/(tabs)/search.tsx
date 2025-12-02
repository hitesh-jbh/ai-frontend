import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "../../components/ui/SearchBar";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { Resource } from "../../services/search.service";
import { Ionicons } from "@expo/vector-icons";

export default function Search() {
  const params = useLocalSearchParams<{ query?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.query || "");
  const { search } = useServices();

  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: () => search.search({ query: searchQuery }),
    enabled: !!searchQuery && searchQuery.length > 0,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      refetch();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Search" showBackButton />
      <View className="px-6 pb-4 border-b border-gray-200">
        <View className="mt-2">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search for knowledge vault.."
          />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 py-4">
        {isLoading && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 text-sm font-outfit-regular mt-4">
              Searching...
            </Text>
          </View>
        )}

        {error && (
          <View className="items-center justify-center py-20">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
              Search failed
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Please try again
            </Text>
          </View>
        )}

        {searchResults && !isLoading && (
          <>
            <View className="mb-4">
              <Text className="text-gray-900 text-lg font-outfit-semi-bold">
                {searchResults.total} results found
              </Text>
              {searchResults.refinedQuery && (
                <Text className="text-gray-600 text-sm font-outfit-regular mt-1">
                  Showing results for: "{searchResults.refinedQuery}"
                </Text>
              )}
            </View>

            {searchResults.resources.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Ionicons name="search" size={48} color="#9CA3AF" />
                <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
                  No results found
                </Text>
                <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
                  Try a different search query
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {searchResults.resources.map((resource: Resource) => (
                  <TouchableOpacity
                    key={resource.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(tabs)/view-resource?id=${resource.id}`)}
                  >
                    <View className="flex-row items-start mb-2">
                      <View className="bg-blue-100 rounded-lg p-2 mr-3">
                        <Ionicons
                          name={
                            resource.type === "pdf"
                              ? "document-text"
                              : resource.type === "video"
                                ? "videocam"
                                : resource.type === "note"
                                  ? "document"
                                  : "link"
                          }
                          size={20}
                          color="#3B82F6"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 text-base font-outfit-semi-bold mb-1">
                          {resource.title}
                        </Text>
                        {resource.description && (
                          <Text
                            className="text-gray-600 text-sm font-outfit-regular"
                            numberOfLines={2}
                          >
                            {resource.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    {(resource.subject || resource.area) && (
                      <View className="flex-row flex-wrap gap-2 mt-2">
                        {resource.subject && (
                          <View className="bg-gray-100 rounded-full px-3 py-1">
                            <Text className="text-gray-700 text-xs font-outfit-regular">
                              {resource.subject}
                            </Text>
                          </View>
                        )}
                        {resource.area && (
                          <View className="bg-gray-100 rounded-full px-3 py-1">
                            <Text className="text-gray-700 text-xs font-outfit-regular">
                              {resource.area}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {!searchQuery && !isLoading && (
          <View className="items-center justify-center py-20">
            <Ionicons name="search" size={48} color="#9CA3AF" />
            <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
              Start searching
            </Text>
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
              Enter a search query to find knowledge vaults
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
