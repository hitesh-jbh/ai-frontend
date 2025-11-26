import { Alert } from "react-native";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const toast = ({ title, description, variant = "default" }: ToastOptions) => {
  if (variant === "destructive") {
    Alert.alert(title, description || "", [{ text: "OK" }]);
  } else {
    Alert.alert(title, description || "", [{ text: "OK" }]);
  }
};

