import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ControlledInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useServices } from "../../hooks/useServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const editResourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  subject: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  area: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  tags: z.string().optional(),
});

type EditResourceForm = z.infer<typeof editResourceSchema>;

export default function EditResource() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { resource } = useServices();
  const [fileUri, setFileUri] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const { data: resourceData, isLoading } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => resource.getResource(id!),
    enabled: !!id,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditResourceForm>({
    resolver: zodResolver(editResourceSchema),
  });

  useEffect(() => {
    if (resourceData) {
      reset({
        title: resourceData.title,
        subject: resourceData.subject,
        grade: resourceData.grade,
        area: resourceData.area,
        language: resourceData.language,
        tags: resourceData.tags?.join(", ") || "",
      });
      setFileUri(resourceData.fileUrl);
    }
  }, [resourceData, reset]);

  const pickFile = async () => {
    try {
      if (resourceData?.type === "video") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaType.Videos,
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setFileUri(result.assets[0].uri);
        }
      } else if (resourceData?.type === "pdf" || resourceData?.type === "note") {
        // For PDFs and notes, file selection would require expo-document-picker
        // For now, show an alert
        Alert.alert(
          "File Selection",
          "PDF and note file selection requires expo-document-picker. Please install it or use the web interface."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const updateResourceMutation = useMutation({
    mutationFn: async (data: EditResourceForm) => {
      let fileUrl = fileUri;

      // If fileUri is a local file and different from existing, upload it
      if (fileUri && fileUri.startsWith("file://") && fileUri !== resourceData?.fileUrl) {
        setIsUploading(true);
        try {
          fileUrl = await resource.uploadFile(
            fileUri,
            resourceData?.type || "note"
          );
        } catch (error) {
          throw new Error("Failed to upload file");
        } finally {
          setIsUploading(false);
        }
      }

      const updateData: any = {
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        area: data.area,
        language: data.language,
      };

      if (data.tags) {
        updateData.tags = data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      }

      if (fileUrl) {
        updateData.fileUrl = fileUrl;
      }

      return resource.updateResource(id!, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["allResources"] });
      queryClient.invalidateQueries({ queryKey: ["resource", id] });
      Alert.alert("Success", "Resource updated successfully");
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || error?.message || "Failed to update resource";
      Alert.alert("Error", errorMessage);
    },
  });

  const onSubmit = async (data: EditResourceForm) => {
    updateResourceMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 pt-4">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-gray-900 text-xl font-outfit-bold">
            Edit Resource
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          {/* Resource Type Badge */}
          <View className="mb-6">
            <View className="bg-blue-100 rounded-full px-4 py-2 self-start">
              <Text className="text-blue-700 text-sm font-outfit-semi-bold uppercase">
                {resourceData?.type}
              </Text>
            </View>
          </View>

          {/* Title Field */}
          <View className="mb-6">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
              Title <Text className="text-red-500">*</Text>
            </Text>
            <ControlledInput
              control={control}
              name="title"
              label=""
              placeholder="Enter resource title"
            />
            {errors.title && (
              <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                {errors.title.message}
              </Text>
            )}
          </View>

          {/* File Upload */}
          {(resourceData?.type === "pdf" ||
            resourceData?.type === "video" ||
            resourceData?.type === "note") && (
            <View className="mb-6">
              <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
                File
              </Text>
              <TouchableOpacity
                onPress={pickFile}
                className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300"
                activeOpacity={0.7}
              >
                <View className="items-center">
                  <Ionicons
                    name={
                      resourceData?.type === "video"
                        ? "videocam"
                        : resourceData?.type === "pdf"
                          ? "document-text"
                          : "document"
                    }
                    size={32}
                    color="#6B7280"
                  />
                  <Text className="text-gray-600 text-sm font-outfit-regular mt-2">
                    {fileUri ? "File selected" : "Tap to select file"}
                  </Text>
                  {fileUri && (
                    <Text
                      className="text-gray-500 text-xs font-outfit-regular mt-1"
                      numberOfLines={1}
                    >
                      {fileUri.split("/").pop()}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Subject */}
          <View className="mb-6">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
              Subject
            </Text>
            <ControlledInput
              control={control}
              name="subject"
              label=""
              placeholder="e.g., Mathematics"
            />
          </View>

          {/* Grade */}
          <View className="mb-6">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
              Grade
            </Text>
            <ControlledInput
              control={control}
              name="grade"
              label=""
              placeholder="e.g., Grade 10"
            />
          </View>

          {/* Area */}
          <View className="mb-6">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
              Area
            </Text>
            <ControlledInput
              control={control}
              name="area"
              label=""
              placeholder="e.g., Algebra"
            />
          </View>

          {/* Language */}
          <View className="mb-6">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
              Language
            </Text>
            <ControlledInput
              control={control}
              name="language"
              label=""
              placeholder="e.g., English"
            />
          </View>

          {/* Tags */}
          <View className="mb-6">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
              Tags (comma separated)
            </Text>
            <ControlledInput
              control={control}
              name="tags"
              label=""
              placeholder="tag1, tag2, tag3"
            />
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Button
              title="Save Changes"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting || updateResourceMutation.isPending || isUploading}
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => router.back()}
              disabled={isSubmitting || updateResourceMutation.isPending || isUploading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

