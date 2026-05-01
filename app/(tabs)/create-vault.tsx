import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { ControlledInput } from "../../components/ui/Input";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import { useAuthStore } from "../../store/auth-store";
import { gmailSchema, phoneSchema } from "../../lib/validations/auth.schema";

const createVaultSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  summary: z.string().max(500).optional(),
  phone: phoneSchema,
  email: gmailSchema,
});

type CreateVaultForm = z.infer<typeof createVaultSchema>;

export default function CreateVault() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { vault } = useServices();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateVaultForm>({
    resolver: zodResolver(createVaultSchema),
    defaultValues: {
      title: "",
      description: "",
      summary: "",
      phone: user?.phone || "",
      email: user?.email || "",
    },
  });

  const createVaultMutation = useMutation({
    mutationFn: async (data: CreateVaultForm) => {
      // Return the created vault object (must include its `id`)
      const newVault = await vault.createVault({
        title: data.title,
        description: data.description,
        summary: data.summary,
        mobileNumber: data.phone,
        email: data.email,
      });
      return newVault;
    },
    onSuccess: (newVault) => {
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["vaultResourceCounts"] });
      showSuccessToast("Success", "Vault created successfully");

      // Navigate to Add Resource screen with the new vault ID
      if (newVault?.id) {
        // Adjust the pathname to match your actual Add Resource route
        router.push({
          pathname: "/add-resource", // e.g., "/resources/add" or "/vaults/[vaultId]/add-resource"
          params: { vaultId: newVault.id },
        });
      } else {
        // Fallback: if ID is missing, go back
        console.warn("No vault ID returned, falling back to previous screen");
        router.back();
      }
    },
    onError: (error: any) => {
      console.error("Vault creation error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create vault. Please try again.";
      showErrorToast("Error", errorMessage);
    },
  });

  const onSubmit = async (data: CreateVaultForm) => {
    createVaultMutation.mutate(data);
  };

  // Helper for single-line inputs
  const renderInputSection = (
    name: keyof CreateVaultForm,
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: "default" | "email-address" | "phone-pad";
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
    },
  ) => (
    <View className="mb-5">
      <Text className="text-xs font-outfit-medium text-gray-500 mb-1 uppercase tracking-wider">
        {label}
      </Text>
      <ControlledInput
        control={control}
        name={name}
        label=""
        placeholder={placeholder}
        keyboardType={options?.keyboardType || "default"}
        autoCapitalize={options?.autoCapitalize}
        className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
      />
      {errors[name] && (
        <Text className="text-red-500 text-xs font-outfit-regular mt-1">
          {errors[name]?.message}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Create Vault"
        showBackButton
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center mt-4 mb-8">
            <View className="bg-blue-50 p-4 rounded-full">
              <Ionicons name="add-circle" size={28} color="#3B82F6" />
            </View>
            <Text className="text-lg font-outfit-semibold text-gray-800 mt-3">
              Create Vault
            </Text>
            <Text className="text-xs font-outfit-regular text-gray-400">
              Create a new vault
            </Text>
          </View>

          <View className="px-6">
            {/* Title */}
            {renderInputSection("title", "TITLE", "e.g., My Project", {
              autoCapitalize: "words",
            })}

            {/* Description - large box */}
            <View className="mb-5">
              <Text className="text-xs font-outfit-medium text-gray-500 mb-1 uppercase tracking-wider">
                DESCRIPTION
              </Text>
              <View className="h-[500px] border border-gray-300 rounded-lg bg-white overflow-hidden">
                <ControlledInput
                  control={control}
                  name="description"
                  label=""
                  placeholder="Write a detailed description..."
                  multiline
                  numberOfLines={8}
                  className="flex-1 px-4 py-3"
                  style={{ textAlignVertical: "top" }}
                />
              </View>
              {errors.description && (
                <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                  {errors.description.message}
                </Text>
              )}
            </View>

            {/* Summary - single line */}
            <View className="mb-5">
              <Text className="text-xs font-outfit-medium text-gray-500 mb-1 uppercase tracking-wider">
                SUMMARY
              </Text>
              <ControlledInput
                control={control}
                name="summary"
                label=""
                placeholder="Brief overview"
                autoCapitalize="sentences"
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              />
              {errors.summary && (
                <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                  {errors.summary.message}
                </Text>
              )}
            </View>

            {/* Phone */}
            {renderInputSection("phone", "PHONE", "+1 234 567 890", {
              keyboardType: "phone-pad",
            })}

            {/* Email */}
            {renderInputSection("email", "EMAIL", "you@example.com", {
              keyboardType: "email-address",
              autoCapitalize: "none",
            })}

            {/* Create Button */}
            <View className="mt-8">
              <Button
                title="Create Vault"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting || createVaultMutation.isPending}
                className="bg-blue-600 rounded-lg py-4"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
