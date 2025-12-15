import { router } from "expo-router";
import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ControlledInput } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/Checkbox";
import { Link } from "../../components/ui/Link";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../store/auth-store";
import {
  loginSchema,
  type LoginFormData,
} from "../../lib/validations/auth.schema";
import { Ionicons } from "@expo/vector-icons";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

const Login = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      // Fetch full profile to get bio and profilePicture
      try {
        const profile = await authService.getProfile();
        login(
          { ...data.user, ...profile },
          data.accessToken,
          data.refreshToken
        );
      } catch (error) {
        // If profile fetch fails, use user data from login
        login(data.user, data.accessToken, data.refreshToken);
      }
      showSuccessToast("Login Successful", "Welcome back!");
      router.replace("/(tabs)/home");
    },
    onError: (error: any) => {
      let message =
        "Login failed. Please check your credentials and try again.";

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

      showErrorToast("Login Failed", message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
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
              Welcome back!
            </Text>
            <Text className="text-gray-600 text-base font-outfit-regular">
              Sign in to your account to continue
            </Text>
          </View>

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
            autoComplete="password"
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

          <View className="flex-row justify-between items-center mb-6 flex-wrap">
            <Checkbox
              checked={rememberMe}
              onToggle={() => setRememberMe(!rememberMe)}
              label="Remember me"
            />
            <Link
              onPress={() => router.push("/(auth)/forgot-password")}
              style={{ flexShrink: 0 }}
            >
              Forgot password?
            </Link>
          </View>

          <Text className="text-gray-600 text-sm font-outfit-regular text-center mb-6">
            By signing in, you agree to our{" "}
            <Text className="text-blue-500">Terms of use</Text> and{" "}
            <Text className="text-blue-500">Privacy Policy</Text>.
          </Text>

          <Button
            title="Login"
            onPress={handleSubmit(onSubmit)}
            loading={loginMutation.isPending}
            className="mb-6"
          />

          <View className="flex-row justify-center items-center flex-wrap">
            <Text className="text-gray-600 text-sm font-outfit-regular">
              Don't have an account?{" "}
            </Text>
            <Link
              onPress={() => router.push("/(auth)/signup")}
              style={{ flexShrink: 0 }}
            >
              Sign up
            </Link>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Login;
