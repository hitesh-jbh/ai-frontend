import { getFontSizeAndLineHeight } from "@/utils/font-scale";
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
}

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = "primary",
  disabled,
  className,
  ...props
}) => {
  const baseClasses = "rounded-lg py-3 px-6 items-center justify-center w-full";
  const variantClasses = {
    primary: "bg-blue-500",
    secondary: "bg-gray-200",
    outline: "bg-transparent border border-blue-500",
  };
  const textClasses = {
    primary: "text-white",
    secondary: "text-gray-800",
    outline: "text-blue-500",
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${
        disabled || loading ? "opacity-50" : ""
      } ${className || ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#3B82F6"}
        />
      ) : (
        <Text
          style={getFontSizeAndLineHeight("base")}
          className={`font-outfit-semi-bold ${textClasses[variant]}`}
          allowFontScaling
          adjustsFontSizeToFit
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
