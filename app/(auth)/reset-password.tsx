import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { View, Text, Alert, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ControlledInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { authService } from "../../services/auth.service";
import { Ionicons } from "@expo/vector-icons";
import { z } from "zod";

const resetPasswordSchema = z.object({
  otp: z.string().min(4, "OTP must be at least 6 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  
  // States to toggle visibility for both password fields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { control, handleSubmit, setError } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetPasswordFormData) => 
      authService.resetPassword({ email, otp: data.otp, newPassword: data.password }),
    onSuccess: () => {
      Alert.alert("Success", "Password updated successfully!", [
        { text: "Login Now", onPress: () => router.replace("/(auth)/login") }
      ]);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to reset password. Invalid OTP.";
      setError("otp", { message });
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

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
              Reset Password
            </Text>
            <Text className="text-gray-600 text-base font-outfit-regular">
              Enter the verification code sent to <Text className="font-outfit-bold text-gray-900">{email}</Text>
            </Text>
          </View>

          {/* OTP Field */}
          <ControlledInput
            name="otp"
            control={control}
            label="Verification Code (OTP) *"
            placeholder="Enter OTP"
            keyboardType="number-pad"
          />

          {/* New Password Field with Eye Toggle */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">New Password *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="flex-1 py-3 text-gray-900 text-base" // Forces text color to be dark gray/black
                    placeholder="Enter new password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Field with Eye Toggle */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">Confirm New Password *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 px-3">
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="flex-1 py-3 text-gray-900 text-base" // Forces text color to be dark gray/black
                    placeholder="Re-enter new password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Update Password"
            onPress={handleSubmit(onSubmit)}
            loading={resetPasswordMutation.isPending}
            className="mt-4 mb-6"
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default ResetPassword;