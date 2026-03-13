import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { Button } from "../../components/ui/Button";
import { ControlledInput } from "../../components/ui/Input";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { useServices } from "../../hooks/useServices";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

const editVaultSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
});

type EditVaultForm = z.infer<typeof editVaultSchema>;

export default function EditVault() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { vault } = useServices();

  const { data: vaultData, isLoading } = useQuery({
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
      title: vaultData?.title || "",
      description: vaultData?.description || "",
    },
  });

  React.useEffect(() => {
    if (vaultData) {
      reset({
        title: vaultData.title,
        description: vaultData.description || "",
      });
    }
  }, [vaultData, reset]);

  const updateVaultMutation = useMutation({
    mutationFn: (data: EditVaultForm) => vault.updateVault(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      queryClient.invalidateQueries({ queryKey: ["vault", id] });
      showSuccessToast("Success", "Vault updated successfully");
      router.back();
    },
    onError: (error: any) => {
      console.error("Vault update error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update vault. Please try again.";
      showErrorToast("Error", errorMessage);
    },
  });

  const onSubmit = async (data: EditVaultForm) => {
    updateVaultMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-sm font-outfit-regular">
            Loading vault...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Edit Vault"
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
            title="Update Vault"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting || updateVaultMutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
