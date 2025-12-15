import {
  ErrorToast,
  InfoToast,
  SuccessToast,
} from "@/components/toast/ToastComponents";
import React from "react";
import { Toast } from "toastify-react-native";

// Toast configuration
export const toastConfig = {
  success: (props: any) => React.createElement(SuccessToast, props),
  error: (props: any) => React.createElement(ErrorToast, props),
  info: (props: any) => React.createElement(InfoToast, props),
};

/**
 * Show a success toast notification
 * @param title - The main message/title
 * @param message - Optional subtitle/message
 */
export const showSuccessToast = (title: string, message?: string) => {
  Toast.show({
    type: "success",
    text1: title,
    text2: message,
    visibilityTime: 1500,
  });
};

/**
 * Show an error toast notification
 * @param title - The main message/title
 * @param message - Optional subtitle/message
 */
export const showErrorToast = (title: string, message?: string) => {
  Toast.show({
    type: "error",
    text1: title,
    text2: message,
    visibilityTime: 1500,
  });
};

/**
 * Show an info toast notification
 * @param title - The main message/title
 * @param message - Optional subtitle/message
 */
export const showInfoToast = (title: string, message?: string) => {
  Toast.show({
    type: "info",
    text1: title,
    text2: message,
    visibilityTime: 1500,
  });
};
