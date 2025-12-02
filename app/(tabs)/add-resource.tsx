import React, { useState } from "react";
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
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const addResourceSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(255),
    type: z.enum(["pdf", "video", "note", "link"]),
    fileUrl: z.string().url().optional().or(z.literal("")),
    subject: z.string().max(100).optional(),
    grade: z.string().max(50).optional(),
    area: z.string().max(100).optional(),
    language: z.string().max(50).optional(),
    tags: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "link") {
        return (
          data.fileUrl &&
          data.fileUrl !== "" &&
          z.string().url().safeParse(data.fileUrl).success
        );
      }
      return true;
    },
    {
      message: "URL is required and must be valid for link type resources",
      path: ["fileUrl"],
    }
  );

type AddResourceForm = z.infer<typeof addResourceSchema>;

export default function AddResource() {
  const { vaultId } = useLocalSearchParams<{ vaultId: string }>();
  const queryClient = useQueryClient();
  const { resource, vault } = useServices();
  const [fileUri, setFileUri] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "pdf" | "video" | "note" | "link"
  >("note");

  const { data: vaultData } = useQuery({
    queryKey: ["vault", vaultId],
    queryFn: () => vault.getVault(vaultId!),
    enabled: !!vaultId,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<AddResourceForm>({
    resolver: zodResolver(addResourceSchema),
    defaultValues: {
      type: "note",
      fileUrl: "",
    },
  });

  const resourceType = watch("type");

  const pickFile = async () => {
    try {
      if (resourceType === "video") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["videos"],
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setFileUri(result.assets[0].uri);
        }
      } else if (resourceType === "pdf" || resourceType === "note") {
        // For now, we'll use image picker for PDFs too
        // In production, use expo-document-picker
        Alert.alert(
          "Info",
          "File picker will be implemented with expo-document-picker"
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const createResourceMutation = useMutation({
    mutationFn: async (data: AddResourceForm) => {
      let fileUrl = data.fileUrl;

      // For file uploads, we need to create the resource first, then upload the file
      // The upload endpoint requires resourceId, so we create first
      const createData: any = {
        vaultId: vaultId!,
        type: data.type,
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        area: data.area,
        language: data.language,
      };

      if (data.tags) {
        createData.tags = data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      }

      // For link type, fileUrl is required and should be provided
      if (data.type === "link" && fileUrl) {
        createData.fileUrl = fileUrl;
      }

      // Create resource first (without fileUrl for file uploads)
      const createdResource = await resource.createResource(createData);

      // If we have a local file to upload, upload it now
      if (fileUri && fileUri.startsWith("file://") && data.type !== "link") {
        try {
          fileUrl = await resource.uploadFile(
            fileUri,
            data.type as "pdf" | "video" | "note",
            vaultId!,
            createdResource.id
          );
        } catch (error) {
          // Continue even if file upload fails - resource is already created
        }
      }

      // Return the created resource (fileUrl will be updated by the upload endpoint)
      return createdResource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["allResources"] });
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      Alert.alert("Success", "Resource created successfully");
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create resource";
      Alert.alert("Error", errorMessage);
    },
  });

  const onSubmit = async (data: AddResourceForm) => {
    if (!vaultId) {
      Alert.alert("Error", "Vault ID is required");
      return;
    }
    createResourceMutation.mutate(data);
  };

  const resourceTypes = [
    { value: "pdf" as const, label: "PDF", icon: "document-text" },
    { value: "video" as const, label: "Video", icon: "videocam" },
    { value: "note" as const, label: "Note", icon: "document" },
    { value: "link" as const, label: "Link", icon: "link" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Add Resource" showBackButton />
      {vaultData && (
        <View className="px-6 pb-4">
          <Text className="text-gray-600 text-sm font-outfit-regular">
            Adding to: {vaultData.title}
          </Text>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          {/* Resource Type Selection */}
          <View className="mb-6">
            <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-3">
              Resource Type <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {resourceTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => {
                    setSelectedType(type.value);
                    setValue("type", type.value);
                    setFileUri(undefined);
                    setValue("fileUrl", "");
                  }}
                  className={`px-4 py-3 rounded-lg border-2 flex-row items-center ${
                    resourceType === type.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={resourceType === type.value ? "#3B82F6" : "#6B7280"}
                  />
                  <Text
                    className={`ml-2 text-sm font-outfit-semi-bold ${
                      resourceType === type.value
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.type && (
              <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                {errors.type.message}
              </Text>
            )}
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

          {/* File Upload or URL */}
          {resourceType !== "link" && (
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
                      resourceType === "video"
                        ? "videocam"
                        : resourceType === "pdf"
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

          {resourceType === "link" && (
            <View className="mb-6">
              <Text className="text-gray-900 text-sm font-outfit-semi-bold mb-2">
                URL <Text className="text-red-500">*</Text>
              </Text>
              <ControlledInput
                control={control}
                name="fileUrl"
                label=""
                placeholder="https://example.com"
                keyboardType="url"
                autoCapitalize="none"
              />
              {errors.fileUrl && (
                <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                  {errors.fileUrl.message}
                </Text>
              )}
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
              title="Create Resource"
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting || createResourceMutation.isPending || isUploading
              }
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => router.back()}
              disabled={
                isSubmitting || createResourceMutation.isPending || isUploading
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
