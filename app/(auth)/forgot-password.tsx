import { router } from "expo-router";
import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ControlledInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Link } from "../../components/ui/Link";
import { authService } from "../../services/auth.service";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../../lib/validations/auth.schema";
import { Ionicons } from "@expo/vector-icons";

const ForgotPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    control,
    handleSubmit,
    setError,
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      setSubmittedEmail(getValues("email"));
      setIsSuccess(true);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to send reset link. Please try again.";
      setError("email", { message });
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  if (isSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-4">
            <View className="mb-8">
              <Text className="text-gray-900 text-3xl font-outfit-bold mb-2">
                Check your email
              </Text>
              <Text className="text-gray-600 text-base font-outfit-regular">
                We've sent a password reset link to {submittedEmail}
              </Text>
            </View>

            <Button
              title="Back to Login"
              onPress={() => router.push("/(auth)/login")}
              className="mb-6"
            />
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View className="px-6 py-4">
          <View className="mb-8">
            <Text className="text-gray-900 text-3xl font-outfit-bold mb-2">
              Forgot Password?
            </Text>
            <Text className="text-gray-600 text-base font-outfit-regular">
              We will send you a link to reset your password.
            </Text>
          </View>

          <ControlledInput
            name="email"
            control={control}
            label="Email Address *"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Button
            title="Send Reset Link"
            onPress={handleSubmit(onSubmit)}
            loading={forgotPasswordMutation.isPending}
            className="mb-6"
          />

          <View className="flex-row items-center justify-center flex-wrap">
            <Ionicons name="arrow-back" size={16} color="#3B82F6" />
            <Link onPress={() => router.push("/(auth)/login")} className="ml-2" style={{ flexShrink: 0 }}>
              Back to Login
            </Link>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
