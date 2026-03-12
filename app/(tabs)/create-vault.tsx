import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { ControlledInput } from "../../components/ui/Input";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

// Same schema as CreateVault
const editVaultSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  summary: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type EditVaultForm = z.infer<typeof editVaultSchema>;

export default function EditVault() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { vault } = useServices();

  // Fetch existing vault data
  const { data: vaultData, isLoading: isLoadingVault } = useQuery({
    queryKey: ["vault", id],
    queryFn: () => vault.getVault(id!),
    enabled: !!id,
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditVaultForm>({
    resolver: zodResolver(editVaultSchema),
    defaultValues: {
      title: "",
      description: "",
      summary: "",
      phone: "",
      email: "",
    },
  });

  // Populate form when data is loaded
  React.useEffect(() => {
    if (vaultData) {
      reset({
        title: vaultData.title,
        description: vaultData.description || "",
        summary: vaultData.summary || "",
        phone: vaultData.phone || "",
        email: vaultData.email || "",
      });
    }
  }, [vaultData, reset]);

  const editVaultMutation = useMutation({
    mutationFn: (data: EditVaultForm) => {
      // 👇 Log the payload to see what's being sent
      console.log("Edit payload:", data);

      // 👇 Map fields to match your backend expectations.
      // If your API expects, for example, 'phone_number' and 'email_address', use this:
      const payload = {
        title: data.title,
        description: data.description,
        summary: data.summary,                // keep as is or remove if not updatable
        phone_number: data.phone,              // change key if needed
        email_address: data.email,              // change key if needed
      };

      // If the backend does NOT allow updating summary, phone, or email, remove them from payload.
      // Example: only title and description are updatable
      // const payload = {
      //   title: data.title,
      //   description: data.description,
      // };

      return vault.updateVault(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["vault", id] });
      queryClient.invalidateQueries({ queryKey: ["vaultResourceCounts"] });
      showSuccessToast("Success", "Vault updated successfully");
      router.back();
    },
    onError: (error: any) => {
      console.error("Vault update error:", error);
      // Log the full error response to see field-specific issues
      if (error?.response) {
        console.log("Error response data:", error.response.data);
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update vault. Please try again.";
      showErrorToast("Error", errorMessage);
    },
  });

  const onSubmit = async (data: EditVaultForm) => {
    editVaultMutation.mutate(data);
  };

  // Helper for single-line inputs
  const renderInputSection = (
    name: keyof EditVaultForm,
    label: string,
    placeholder: string,
    options?: {
      keyboardType?: "default" | "email-address" | "phone-pad";
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
    }
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

  if (isLoadingVault) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text>Loading vault...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Edit Vault"
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
              <Ionicons name="folder-open" size={28} color="#3B82F6" />
            </View>
            <Text className="text-lg font-outfit-semibold text-gray-800 mt-3">
              Edit Vault
            </Text>
            <Text className="text-xs font-outfit-regular text-gray-400">
              Update your vault details
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

            {/* Update Button */}
            <View className="mt-8">
              <Button
                title="Update Vault"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting || editVaultMutation.isPending}
                className="bg-blue-600 rounded-lg py-4"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}