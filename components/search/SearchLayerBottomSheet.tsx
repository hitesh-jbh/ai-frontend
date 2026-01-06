import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSearchPreferencesStore, SearchLayer } from "../../store/search-preferences-store";
import { useAuthStore } from "../../store/auth-store";

interface SearchLayerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface LayerOption {
  value: SearchLayer;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const layerOptions: LayerOption[] = [
  {
    value: "automatic",
    label: "Automatic (Recommended)",
    description: "Let the system choose the best layer for you",
    icon: "sparkles",
    color: "#3B82F6",
  },
  {
    value: "cache",
    label: "Cached Answers",
    description: "Fast answers from previous searches",
    icon: "flash",
    color: "#10B981",
  },
  {
    value: "competitive",
    label: "Web-Based Answers",
    description: "Answers built from web search results (no AI)",
    icon: "globe",
    color: "#3B82F6",
  },
  {
    value: "community",
    label: "Community Answers",
    description: "Answers contributed by other users",
    icon: "people",
    color: "#8B5CF6",
  },
  {
    value: "paid_ai",
    label: "AI Generated",
    description: "Advanced AI-generated answers (uses tokens)",
    icon: "sparkles",
    color: "#F59E0B",
  },
];

export const SearchLayerBottomSheet: React.FC<SearchLayerBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const { preferredLayer, setPreferredLayer } = useSearchPreferencesStore();
  const { user } = useAuthStore();

  const handleSelectLayer = async (layer: SearchLayer) => {
    if (user?.id) {
      await setPreferredLayer(layer, user.id);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Search Preferences</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Description */}
              <Text style={styles.description}>
                Choose how you want your search results to be generated
              </Text>

              {/* Layer Options */}
              <View style={styles.optionsContainer}>
                {layerOptions.map((option) => {
                  const isSelected = preferredLayer === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.option,
                        isSelected && styles.optionSelected,
                      ]}
                      onPress={() => handleSelectLayer(option.value)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionContent}>
                        <View
                          style={[
                            styles.iconContainer,
                            { backgroundColor: `${option.color}20` },
                          ]}
                        >
                          <Ionicons
                            name={option.icon}
                            size={24}
                            color={option.color}
                          />
                        </View>
                        <View style={styles.optionText}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && styles.optionLabelSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={styles.optionDescription}>
                            {option.description}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={option.color}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    color: "#6B7280",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  optionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  option: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
    color: "#111827",
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: "#3B82F6",
  },
  optionDescription: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    color: "#6B7280",
  },
});

