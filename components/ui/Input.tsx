import React from "react";
import { TextInput, Text, View, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  rightIcon,
  ...props
}) => {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-800 text-sm font-outfit-medium">
          {label}
        </Text>
      )}
      <View className="relative">
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          className={`bg-gray-100 rounded-lg px-4 py-4 text-gray-900 font-outfit-regular ${
            error ? "border border-red-500" : ""
          } ${rightIcon ? "pr-12" : ""}`}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {rightIcon && (
          <View className="absolute right-4 top-0 bottom-0 justify-center">
            {rightIcon}
          </View>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-xs font-outfit-regular mt-1">
          {error}
        </Text>
      )}
    </View>
  );
};

interface ControlledInputProps<T extends FieldValues>
  extends Omit<InputProps, "value" | "onChangeText" | "error"> {
  name: FieldPath<T>;
  control: Control<T>;
}

export function ControlledInput<T extends FieldValues>({
  name,
  control,
  ...props
}: ControlledInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => (
        <Input
          {...props}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
        />
      )}
    />
  );
}
