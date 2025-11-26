import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps } from "react-native";

interface LinkProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export const Link: React.FC<LinkProps> = ({
  children,
  variant = "primary",
  className,
  ...props
}) => {
  const textColor = variant === "primary" ? "text-blue-500" : "text-gray-600";

  return (
    <TouchableOpacity activeOpacity={0.7} {...props}>
      <Text
        className={`${textColor} text-sm font-outfit-medium ${className || ""}`}
        numberOfLines={1}
        style={{ flexShrink: 0 }}
        allowFontScaling={true}
        adjustsFontSizeToFit={false}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};
