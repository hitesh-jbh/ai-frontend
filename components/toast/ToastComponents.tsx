import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const TOAST_WIDTH = WINDOW_WIDTH * 0.9;

// App theme colors
const COLORS = {
  primary: "#3B82F6", // Blue-500
  success: "#10B981", // Green-500
  error: "#EF4444", // Red-500
  info: "#6B7280", // Gray-500
  background: "#FFFFFF",
  textPrimary: "#111827", // Gray-900
  textSecondary: "#6B7280", // Gray-500
  border: "#E5E7EB", // Gray-200
};

// Custom Success Toast Component
export const SuccessToast = ({ text1, text2, hide }: any) => {
  return (
    <View style={[styles.toastContainer, { borderLeftColor: COLORS.primary }]}>
      <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>
          {text1}
        </Text>
        {text2 && (
          <Text style={[styles.message, { color: COLORS.textSecondary }]}>
            {text2}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={hide} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

// Custom Error Toast Component
export const ErrorToast = ({ text1, text2, hide }: any) => {
  return (
    <View style={[styles.toastContainer, { borderLeftColor: COLORS.error }]}>
      <Ionicons name="close-circle" size={28} color={COLORS.error} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>
          {text1}
        </Text>
        {text2 && (
          <Text style={[styles.message, { color: COLORS.textSecondary }]}>
            {text2}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={hide} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

// Custom Info Toast Component
export const InfoToast = ({ text1, text2, hide }: any) => {
  return (
    <View style={[styles.toastContainer, { borderLeftColor: COLORS.info }]}>
      <Ionicons name="information-circle" size={28} color={COLORS.info} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>
          {text1}
        </Text>
        {text2 && (
          <Text style={[styles.message, { color: COLORS.textSecondary }]}>
            {text2}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={hide} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    width: TOAST_WIDTH,
    backgroundColor: COLORS.background,
    borderRadius: 36,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#333",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 24,
    minHeight: 70,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: "400",
    fontFamily: "Outfit-Regular",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
});
