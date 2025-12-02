import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "../../components/ui/SearchBar";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { Resource } from "../../services/search.service";
import { Ionicons } from "@expo/vector-icons";

export default function Search() {
  const params = useLocalSearchParams<{ query?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.query || "");
  const [filters, setFilters] = useState<{
    subject?: string;
    grade?: string;
    language?: string;
    type?: "pdf" | "video" | "note" | "link";
  }>({});
  const [showFilters, setShowFilters] = useState(false);
  const { search } = useServices();

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["filterOptions"],
    queryFn: () => search.getFilterOptions(),
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch search results
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["search", searchQuery, filters],
    queryFn: () =>
      search.search({
        query: searchQuery,
        filters,
        limit: 20,
        offset: 0,
      }),
    enabled: !!searchQuery && searchQuery.length > 0,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      refetch();
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    refetch();
  };

  const clearFilter = (key: keyof typeof filters) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const activeFiltersCount = Object.keys(filters).filter((key) => filters[key as keyof typeof filters]).length;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Search" showBackButton />
      <View className="px-6 pb-4 border-b border-gray-200">
        <View className="mt-2">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSearch={handleSearch}
            onSuggestionSelect={handleSuggestionSelect}
            placeholder="Search for knowledge vault.."
            showSuggestions={true}
          />
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          className="flex-row items-center mt-3 self-start"
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="filter" size={18} color="#3B82F6" />
          <Text className="text-blue-600 text-sm font-outfit-semi-bold ml-2">
            Filters
          </Text>
          {activeFiltersCount > 0 && (
            <View className="bg-blue-500 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-white text-xs font-outfit-semi-bold">
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-3">
            {filters.subject && (
              <View className="bg-blue-100 rounded-full px-3 py-1.5 flex-row items-center">
                <Text className="text-blue-700 text-xs font-outfit-regular">
                  Subject: {filters.subject}
                </Text>
                <TouchableOpacity
                  onPress={() => clearFilter("subject")}
                  className="ml-2"
                >
                  <Ionicons name="close-circle" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            )}
            {filters.grade && (
              <View className="bg-blue-100 rounded-full px-3 py-1.5 flex-row items-center">
                <Text className="text-blue-700 text-xs font-outfit-regular">
                  Grade: {filters.grade}
                </Text>
                <TouchableOpacity
                  onPress={() => clearFilter("grade")}
                  className="ml-2"
                >
                  <Ionicons name="close-circle" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            )}
            {filters.language && (
              <View className="bg-blue-100 rounded-full px-3 py-1.5 flex-row items-center">
                <Text className="text-blue-700 text-xs font-outfit-regular">
                  Language: {filters.language}
                </Text>
                <TouchableOpacity
                  onPress={() => clearFilter("language")}
                  className="ml-2"
                >
                  <Ionicons name="close-circle" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            )}
            {filters.type && (
              <View className="bg-blue-100 rounded-full px-3 py-1.5 flex-row items-center">
                <Text className="text-blue-700 text-xs font-outfit-regular">
                  Type: {filters.type}
                </Text>
                <TouchableOpacity
                  onPress={() => clearFilter("type")}
                  className="ml-2"
                >
                  <Ionicons name="close-circle" size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-900 text-xl font-outfit-bold">
                Filters
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Subject Filter */}
              <View className="mb-6">
                <Text className="text-gray-900 text-base font-outfit-semi-bold mb-3">
                  Subject
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {filterOptions?.subjects.map((subject) => (
                    <TouchableOpacity
                      key={subject}
                      className={`rounded-full px-4 py-2 border ${
                        filters.subject === subject
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-gray-300"
                      }`}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          subject: prev.subject === subject ? undefined : subject,
                        }))
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-sm font-outfit-regular ${
                          filters.subject === subject
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {subject}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Grade Filter */}
              <View className="mb-6">
                <Text className="text-gray-900 text-base font-outfit-semi-bold mb-3">
                  Grade
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {filterOptions?.grades.map((grade) => (
                    <TouchableOpacity
                      key={grade}
                      className={`rounded-full px-4 py-2 border ${
                        filters.grade === grade
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-gray-300"
                      }`}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          grade: prev.grade === grade ? undefined : grade,
                        }))
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-sm font-outfit-regular ${
                          filters.grade === grade
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Language Filter */}
              <View className="mb-6">
                <Text className="text-gray-900 text-base font-outfit-semi-bold mb-3">
                  Language
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {filterOptions?.languages.map((language) => (
                    <TouchableOpacity
                      key={language}
                      className={`rounded-full px-4 py-2 border ${
                        filters.language === language
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-gray-300"
                      }`}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          language:
                            prev.language === language ? undefined : language,
                        }))
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-sm font-outfit-regular ${
                          filters.language === language
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {language}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Type Filter */}
              <View className="mb-6">
                <Text className="text-gray-900 text-base font-outfit-semi-bold mb-3">
                  Resource Type
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {["pdf", "video", "note", "link"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      className={`rounded-full px-4 py-2 border ${
                        filters.type === type
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-gray-300"
                      }`}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          type: prev.type === type ? undefined : (type as any),
                        }))
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-sm font-outfit-regular capitalize ${
                          filters.type === type
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Apply Button */}
              <TouchableOpacity
                className="bg-blue-500 rounded-lg py-4 items-center mt-4"
                onPress={() => {
                  setShowFilters(false);
                  if (searchQuery.trim()) {
                    refetch();
                  }
                }}
                activeOpacity={0.7}
              >
                <Text className="text-white text-base font-outfit-semi-bold">
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                  Try a different search query or adjust your filters
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                {searchResults.resources.map((resource: Resource) => (
                  <TouchableOpacity
                    key={resource.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push(`/(tabs)/view-resource?id=${resource.id}`)
                    }
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
