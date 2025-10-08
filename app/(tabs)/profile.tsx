import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { useAuthStore } from "../../store/auth-store";

export default function Profile() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    // Navigation will happen automatically via the TabsLayout redirect
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-base text-center text-slate-700 font-outfit-regular">
        Profile
      </Text>
      {user && (
        <Text className="text-sm text-center text-slate-600 mt-2">
          {user.name} - {user.email}
        </Text>
      )}
      <Button
        className="bg-slate-800 text-white h-10"
        onPress={() => router.push("/home")}
      >
        Go to home
      </Button>
      <Button
        className="bg-red-600 text-white h-10 mt-4"
        onPress={handleLogout}
      >
        Logout
      </Button>
    </View>
  );
}
