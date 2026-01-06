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
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../store/auth-store";
import {
  loginSchema,
  type LoginFormData,
} from "../../lib/validations/auth.schema";
import { Ionicons } from "@expo/vector-icons";
import { showErrorToast, showSuccessToast } from "../../utils/toast";
import { getFontSizeAndLineHeight } from "@/utils/font-scale";

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
            <Text
              style={getFontSizeAndLineHeight("3xl")}
              className="text-gray-700 font-outfit-bold mb-2"
            >
              Welcome back!
            </Text>
            <Text
              style={getFontSizeAndLineHeight("base")}
              className="text-gray-600 text-base font-outfit-regular"
            >
              Sign in to your account to continue
            </Text>
          </View>

          <ControlledInput
            required
            name="email"
            control={control}
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <ControlledInput
            required
            name="password"
            control={control}
            label="Password"
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
            <TouchableOpacity
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text
                style={getFontSizeAndLineHeight("sm")}
                className="text-blue-600 font-outfit-regular"
              >
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* <Text
            style={getFontSizeAndLineHeight("sm")}
            className="text-gray-600 font-outfit-regular mb-6"
          >
            By signing in, you agree to our{" "}
            <Text
              style={getFontSizeAndLineHeight("sm")}
              className="text-blue-500 font-outfit-regular"
            >
              Terms of use
            </Text>{" "}
            and{" "}
            <Text
              style={getFontSizeAndLineHeight("sm")}
              className="text-blue-500 font-outfit-regular"
            >
              Privacy Policy
            </Text>
            .
          </Text> */}

          <Button
            title="Login"
            onPress={handleSubmit(onSubmit)}
            loading={loginMutation.isPending}
            className="mb-6"
          />

          <View className="flex-row justify-center items-center flex-wrap">
            <Text
              style={getFontSizeAndLineHeight("sm")}
              className="text-gray-600 font-outfit-regular"
            >
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
              <Text
                style={getFontSizeAndLineHeight("sm")}
                className="text-blue-600 font-outfit-regular"
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default Login;
