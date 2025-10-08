import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

const Signup = () => {
  return (
    <View>
      <Text>Signup</Text>
      <Button onPress={() => router.push("/login")}>Login</Button>
    </View>
  );
};

export default Signup;
