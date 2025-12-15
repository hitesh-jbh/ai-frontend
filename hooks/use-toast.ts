import { showSuccessToast, showErrorToast, showInfoToast } from "../utils/toast";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export const toast = ({ title, description, variant = "default" }: ToastOptions) => {
  if (variant === "destructive") {
    showErrorToast(title, description);
  } else {
    showInfoToast(title, description);
  }
};

