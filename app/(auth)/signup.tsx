import { router } from "expo-router";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ControlledInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/Checkbox";
import { Link } from "../../components/ui/Link";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../store/auth-store";
import {
  signupSchema,
  type SignupFormData,
} from "../../lib/validations/auth.schema";
import { Ionicons } from "@expo/vector-icons";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const login = useAuthStore((state) => state.login);

  const { control, handleSubmit, watch } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const acceptTerms = watch("acceptTerms");

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: async (data) => {
      // Fetch full profile to get bio and profilePicture (if available)
      try {
        const profile = await authService.getProfile();
        login(
          { ...data.user, ...profile },
          data.accessToken,
          data.refreshToken
        );
      } catch (error) {
        // If profile fetch fails, use user data from registration
        login(data.user, data.accessToken, data.refreshToken);
      }
      router.replace("/(tabs)/home");
    },
    onError: (error: any) => {
      let message =
        "Registration failed. Please check your information and try again.";

      if (
        error?.message === "Network Error" ||
        error?.code === "ECONNABORTED"
      ) {
        message =
          "Unable to connect to the server. Please check:\n\n• Is the backend server running?\n• Are you connected to the internet?\n• Check the API URL in console logs";
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.status) {
        message = `Server error (${error.response.status}). Please try again.`;
      }

      Alert.alert("Registration Failed", message, [{ text: "OK" }]);
    },
  });

  const onSubmit = (data: SignupFormData) => {
    registerMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
    });
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
              Register
            </Text>
            <Text className="text-gray-600 text-base font-outfit-regular">
              Join our community today
            </Text>
          </View>

          <ControlledInput
            name="name"
            control={control}
            label="Name *"
            placeholder="Enter your name"
            autoCapitalize="words"
            autoComplete="name"
          />

          <ControlledInput
            name="email"
            control={control}
            label="Email *"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <ControlledInput
            name="password"
            control={control}
            label="Password *"
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            }
          />

          <ControlledInput
            name="confirmPassword"
            control={control}
            label="Confirm Password *"
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            }
          />

          <View className="mb-6">
            <Controller
              control={control}
              name="acceptTerms"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <>
                  <Checkbox
                    checked={value}
                    onToggle={() => onChange(!value)}
                    label="I accept the terms and conditions."
                  />
                  {error && (
                    <Text className="text-red-500 text-xs font-outfit-regular mt-1">
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </View>

          <Button
            title="Sign Up"
            onPress={handleSubmit(onSubmit)}
            loading={registerMutation.isPending}
            className="mb-6"
          />

          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600 text-sm font-outfit-regular">
              Already have an account?{" "}
            </Text>
            <Link
              onPress={() => router.push("/(auth)/login")}
              style={{ flexShrink: 0, minWidth: "auto" }}
            >
              Login
            </Link>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Signup;
