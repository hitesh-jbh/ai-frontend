import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { ControlledInput } from "../../components/ui/Input";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

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

  // Pick file from document picker
  const pickDocument = async () => {
    try {
      let mimeTypes: string[] = [];
      if (resourceType === "pdf") {
        mimeTypes = ["application/pdf"];
      } else if (resourceType === "note") {
        mimeTypes = [
          "application/pdf",
          "text/plain",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.oasis.opendocument.text",
        ];
      } else {
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes,
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        if (result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (asset.uri) {
            setFileUri(asset.uri);
            showSuccessToast("Success", `File selected: ${asset.name || "file"}`);
          } else {
            showErrorToast("Error", "File URI not found");
          }
        } else {
          showErrorToast("Error", "No file selected");
        }
      }
    } catch (error: any) {
      console.error("Error picking document:", error);
      showErrorToast("Error", error?.message || "Failed to pick document");
    }
  };

  // Pick image from gallery (for note type)
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFileUri(result.assets[0].uri);
        showSuccessToast("Success", "Image selected");
      }
    } catch (error: any) {
      console.error("Error picking image:", error);
      showErrorToast("Error", error?.message || "Failed to pick image");
    }
  };

  // Pick video from gallery (for video type)
  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFileUri(result.assets[0].uri);
        showSuccessToast("Success", "Video selected");
      }
    } catch (error: any) {
      console.error("Error picking video:", error);
      showErrorToast("Error", error?.message || "Failed to pick video");
    }
  };

  const createResourceMutation = useMutation({
    mutationFn: async (data: AddResourceForm) => {
      let fileUrl = data.fileUrl;

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

      if (data.type === "link" && fileUrl) {
        createData.fileUrl = fileUrl;
      }

      const createdResource = await resource.createResource(createData);

      if (fileUri && fileUri.startsWith("file://") && data.type !== "link") {
        try {
          fileUrl = await resource.uploadFile(
            fileUri,
            data.type as "pdf" | "video" | "note",
            vaultId!,
            createdResource.id
          );
        } catch (error) {
          // Continue even if file upload fails
        }
      }

      return createdResource;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["allResources"] });
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["vaultResourceCounts"] });
      
      if (vaultId) {
        queryClient.invalidateQueries({ queryKey: ["vaultResources", vaultId] });
        queryClient.invalidateQueries({ queryKey: ["vault", vaultId] });
      }
      
      queryClient.invalidateQueries({ queryKey: ["topEarners"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["userRank"] });
      queryClient.invalidateQueries({ queryKey: ["analyticsChart"] });
      
      showSuccessToast("Success", "Resource created successfully");
      router.back();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create resource";
      showErrorToast("Error", errorMessage);
    },
  });

  const onSubmit = async (data: AddResourceForm) => {
    if (!vaultId) {
      showErrorToast("Error", "Vault ID is required");
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

  // Helper to render input section with minimal label
  const renderInputSection = (
    name: keyof AddResourceForm,
    label: string,
    placeholder: string,
    options?: {
      multiline?: boolean;
      numberOfLines?: number;
      keyboardType?: "default" | "email-address" | "phone-pad" | "url";
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
      required?: boolean;
    }
  ) => (
    <View className="mb-5">
      <View className="flex-row items-center mb-1">
        <Text className="text-xs font-outfit-medium text-gray-500 uppercase tracking-wider">
          {label}
        </Text>
        {options?.required && <Text className="text-red-500 text-xs ml-1">*</Text>}
      </View>
      <ControlledInput
        control={control}
        name={name}
        label=""
        placeholder={placeholder}
        multiline={options?.multiline}
        numberOfLines={options?.numberOfLines}
        keyboardType={options?.keyboardType || "default"}
        autoCapitalize={options?.autoCapitalize}
        style={options?.multiline ? { minHeight: 100, textAlignVertical: "top" } : {}}
        className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
      />
      {errors[name] && (
        <Text className="text-red-500 text-xs font-outfit-regular mt-1">
          {errors[name]?.message}
        </Text>
      )}
    </View>
  );

  const renderFilePicker = () => {
    if (resourceType === "link") return null;

    if (resourceType === "video") {
      return (
        <TouchableOpacity
          onPress={pickVideo}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center bg-gray-50"
          activeOpacity={0.7}
        >
          <Ionicons name="videocam" size={32} color="#6B7280" />
          <Text className="text-gray-600 text-sm font-outfit-regular mt-2">
            {fileUri ? "Video selected" : "Tap to select video"}
          </Text>
          {fileUri && (
            <View className="bg-blue-50 rounded-lg px-3 py-1 mt-2">
              <Text
                className="text-blue-700 text-xs font-outfit-regular"
                numberOfLines={1}
              >
                {fileUri.split("/").pop()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (resourceType === "pdf") {
      return (
        <TouchableOpacity
          onPress={pickDocument}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center bg-gray-50"
          activeOpacity={0.7}
        >
          <Ionicons name="document-text" size={32} color="#6B7280" />
          <Text className="text-gray-600 text-sm font-outfit-regular mt-2">
            {fileUri ? "PDF selected" : "Tap to select PDF"}
          </Text>
          {fileUri && (
            <View className="bg-blue-50 rounded-lg px-3 py-1 mt-2">
              <Text
                className="text-blue-700 text-xs font-outfit-regular"
                numberOfLines={1}
              >
                {fileUri.split("/").pop()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (resourceType === "note") {
      return (
        <View className="space-y-3">
          <TouchableOpacity
            onPress={pickDocument}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center bg-gray-50"
            activeOpacity={0.7}
          >
            <Ionicons name="document" size={32} color="#6B7280" />
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2">
              Select Document (PDF, Word, Text)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickImage}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center bg-gray-50"
            activeOpacity={0.7}
          >
            <Ionicons name="image" size={32} color="#6B7280" />
            <Text className="text-gray-600 text-sm font-outfit-regular mt-2">
              Select Image from Gallery
            </Text>
          </TouchableOpacity>

          {fileUri && (
            <View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <Text className="text-blue-700 text-sm font-outfit-regular" numberOfLines={1}>
                Selected: {fileUri.split("/").pop()}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader title="Add Resource" showBackButton />
      
      {/* Vault context */}
      {vaultData && (
        <View className="px-6 pb-2">
          <View className="bg-gray-100 rounded-lg px-4 py-2 flex-row items-center">
            <Ionicons name="folder" size={16} color="#6B7280" />
            <Text className="text-gray-600 text-sm font-outfit-regular ml-2">
              Adding to: {vaultData.title}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Header with icon */}
        <View className="items-center mt-4 mb-6">
          <View className="bg-blue-50 p-4 rounded-full">
            <Ionicons name="cloud-upload" size={28} color="#3B82F6" />
          </View>
          <Text className="text-lg font-outfit-semibold text-gray-800 mt-3">
            New Resource
          </Text>
          <Text className="text-xs font-outfit-regular text-gray-400">
            Add content to your vault
          </Text>
        </View>

        <View className="px-6">
          {/* Resource Type Selection */}
          <View className="mb-6">
            <Text className="text-xs font-outfit-medium text-gray-500 uppercase tracking-wider mb-3">
              Resource Type <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {resourceTypes.map((type) => {
                const isActive = resourceType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => {
                      setSelectedType(type.value);
                      setValue("type", type.value);
                      setFileUri(undefined);
                      setValue("fileUrl", "");
                    }}
                    className={`flex-1 min-w-[80px] py-4 rounded-xl border-2 items-center ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={24}
                      color={isActive ? "#3B82F6" : "#6B7280"}
                    />
                    <Text
                      className={`mt-1 text-xs font-outfit-medium ${
                        isActive ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.type && (
              <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                {errors.type.message}
              </Text>
            )}
          </View>

          {/* Title Field */}
          {renderInputSection("title", "TITLE", "Enter resource title", { required: true })}

          {/* File Upload Section */}
          <View className="mb-6">
            <View className="flex-row items-center mb-2">
              <Text className="text-xs font-outfit-medium text-gray-500 uppercase tracking-wider">
                {resourceType === "link" ? "URL" : "FILE"}
              </Text>
              {resourceType !== "link" && <Text className="text-red-500 text-xs ml-1">*</Text>}
            </View>
            {resourceType === "link" ? (
              <>
                <ControlledInput
                  control={control}
                  name="fileUrl"
                  label=""
                  placeholder="https://example.com"
                  keyboardType="url"
                  autoCapitalize="none"
                  className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
                />
                {errors.fileUrl && (
                  <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                    {errors.fileUrl.message}
                  </Text>
                )}
              </>
            ) : (
              renderFilePicker()
            )}
          </View>

          {/* Optional Fields - grouped in a card */}
          <View className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
            <Text className="text-sm font-outfit-semibold text-gray-700 mb-4">
              Additional Information (Optional)
            </Text>
            
            {renderInputSection("subject", "SUBJECT", "e.g., Mathematics")}
            {renderInputSection("grade", "GRADE", "e.g., Grade 10")}
            {renderInputSection("area", "AREA", "e.g., Algebra")}
            {renderInputSection("language", "LANGUAGE", "e.g., English")}
            {renderInputSection("tags", "TAGS", "comma separated", {
              autoCapitalize: "none",
            })}
          </View>

          {/* Action Buttons */}
          <View className="gap-3 mt-4">
            <Button
              title="Create Resource"
              onPress={handleSubmit(onSubmit)}
              loading={
                isSubmitting || createResourceMutation.isPending || isUploading
              }
              className="bg-blue-600 rounded-lg py-4"
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => router.back()}
              disabled={
                isSubmitting || createResourceMutation.isPending || isUploading
              }
              className="border border-gray-300 rounded-lg py-4"
              textClassName="text-gray-700"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}