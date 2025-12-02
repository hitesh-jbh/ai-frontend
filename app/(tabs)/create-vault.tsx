import React from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ControlledInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const createVaultSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
});

type CreateVaultForm = z.infer<typeof createVaultSchema>;

export default function CreateVault() {
  const queryClient = useQueryClient();
  const { vault } = useServices();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateVaultForm>({
    resolver: zodResolver(createVaultSchema),
  });

  const createVaultMutation = useMutation({
    mutationFn: (data: CreateVaultForm) => vault.createVault(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["allResources"] });
      Alert.alert("Success", "Vault created successfully");
      router.back();
    },
    onError: (error: any) => {
      console.error("Vault creation error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create vault. Please try again.";
      Alert.alert("Error", errorMessage);
    },
  });

  const onSubmit = async (data: CreateVaultForm) => {
    createVaultMutation.mutate(data);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Create Vault"
        showBackButton
        onBackPress={() => router.push("/(tabs)/vaults")}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          <ControlledInput
            control={control}
            name="title"
            label="Title"
            placeholder="Enter vault title"
          />
          {errors.title && (
            <Text className="text-red-500 text-xs font-outfit-regular mt-1 mb-4">
              {errors.title.message}
            </Text>
          )}

          <View className="mb-6">
            <Text className="text-gray-800 text-sm font-outfit-medium mb-2">
              Description
            </Text>
            <ControlledInput
              control={control}
              name="description"
              label=""
              placeholder="Enter vault description (optional)"
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: "top" }}
            />
          </View>

          <Button
            title="Create Vault"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || createVaultMutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
