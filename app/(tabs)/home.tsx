import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import { Text, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-base text-center text-slate-700 font-outfit-regular">
        Home
      </Text>
      <Button
        className="bg-slate-800 text-white h-10"
        onPress={() => router.push("/profile")}
      >
        Go to Profile
      </Button>
    </View>
  );
}
