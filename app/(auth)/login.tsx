import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useAuthStore } from "../../store/auth-store";

const Login = () => {
  const login = useAuthStore((state) => state.login);

  const handleLogin = () => {
    login({
      id: "1",
      email: "user@example.com",
      name: "John Doe",
    });
  };

  return (
    <View>
      <Text>Login</Text>
      <Button onPress={handleLogin}>Login</Button>
      <Button onPress={() => router.push("/signup")}>Signup</Button>
    </View>
  );
};

export default Login;
