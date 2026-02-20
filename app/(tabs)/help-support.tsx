import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ScreenHeader } from "../../components/ui/ScreenHeader";

// --- Constants ---
const SUPPORT_EMAIL = "support@knowvaults.com";
const PRIVACY_URL = "https://knowvaults.com/privacy";
const TERMS_URL = "https://knowvaults.com/terms";

// --- FAQ Data ---
const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "What is KnowVaults?",
    answer:
      "KnowVaults is a knowledge platform where you can create and explore vaults of curated content. You earn coins for contributing and engaging, and can use them for rewards or premium features.",
  },
  {
    question: "How do coins work?",
    answer:
      "You earn coins by participating in the community—creating content, getting upvotes, and completing actions. Coins can be used to unlock features, redeem rewards, or support creators.",
  },
  {
    question: "How can I redeem coins?",
    answer:
      "Go to Wallet from the Options menu. Once you have enough coins and a valid UPI ID set in your profile, you can request a withdrawal. Redemptions are processed according to our payout schedule.",
  },
  {
    question: "Why was my query limit reached?",
    answer:
      "Search and AI features have daily limits to keep the service fair for everyone. Limits reset each day. Subscribers get higher or unlimited limits depending on their plan.",
  },
  {
    question: "How do subscriptions work?",
    answer:
      "Subscriptions give you access to premium vaults, higher query limits, and other benefits. Manage your plan under Options → Manage Subscriptions. You can upgrade, downgrade, or cancel anytime.",
  },
];

// --- Reusable Accordion Item ---
function FaqAccordionItem({
  question,
  answer,
  isOpen,
  onPress,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onPress: () => void;
}) {
  const rotation = useSharedValue(isOpen ? 1 : 0);
  React.useEffect(() => {
    rotation.value = withTiming(isOpen ? 1 : 0, { duration: 200 });
  }, [isOpen, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <View
      className="bg-white rounded-xl overflow-hidden border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center justify-between px-4 py-4"
      >
        <Text className="flex-1 text-gray-900 font-outfit-semi-bold text-[15px] pr-3">
          {question}
        </Text>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </Animated.View>
      </TouchableOpacity>
      {isOpen && (
        <Animated.View
          layout={Layout.duration(200)}
          className="border-t border-gray-100 px-4 pb-4 pt-1"
        >
          <Text className="text-gray-600 font-outfit-regular text-[14px] leading-5">
            {answer}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// --- Section Wrapper ---
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-8">
      <Text className="text-gray-500 text-xs font-outfit-semi-bold uppercase tracking-wider mb-3">
        {title}
      </Text>
      {children}
    </View>
  );
}

// --- Card Wrapper ---
function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="bg-white rounded-2xl p-5 border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

export default function HelpSupport() {
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Re-fetch main data (this screen uses static FAQ; add API refetch here if needed)
    Promise.resolve()
      .then(() => {
        // Simulate minimal load so spinner is visible; replace with actual refetch when API exists
        return new Promise((resolve) => setTimeout(resolve, 400));
      })
      .finally(() => setRefreshing(false));
  }, []);

  const handleFaqPress = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const openMailto = (subject?: string, body?: string) => {
    const mailto = `mailto:${SUPPORT_EMAIL}${subject || body ? "?" : ""}${subject ? `subject=${encodeURIComponent(subject)}` : ""}${subject && body ? "&" : ""}${body ? `body=${encodeURIComponent(body)}` : ""}`;
    Linking.openURL(mailto);
  };

  const handleContactUs = () => {
    if (showContactForm && (contactName || contactEmail || contactMessage)) {
      const body = [
        contactName && `Name: ${contactName}`,
        contactEmail && `Email: ${contactEmail}`,
        contactMessage && `\nMessage:\n${contactMessage}`,
      ]
        .filter(Boolean)
        .join("\n");
      openMailto("Help & Support request", body);
    } else {
      openMailto();
    }
  };

  const handleReportIssue = () => {
    openMailto(
      "Report an issue",
      "Please describe the problem you encountered:\n\n",
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Help & Support"
        showBackButton
        onBackPress={() => router.push("/(tabs)/options")}
      />

      <View style={{ flex: 1 }}>
        <FlatList
          data={[{ key: "content" }]}
          keyExtractor={(item) => item.key}
          renderItem={() => (
            <>
              {/* FAQ Section */}
              <Section title="Frequently asked questions">
                <View className="gap-3">
                  {FAQ_ITEMS.map((item, index) => (
                    <FaqAccordionItem
                      key={index}
                      question={item.question}
                      answer={item.answer}
                      isOpen={expandedIndex === index}
                      onPress={() => handleFaqPress(index)}
                    />
                  ))}
                </View>
              </Section>

              {/* Contact Support */}
              <Section title="Contact support">
                <Card>
                  <Text className="text-gray-600 font-outfit-regular text-sm mb-4">
                    Reach out for account, billing, or general help.
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-4">
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    <Text className="text-gray-900 font-outfit-medium ml-3">
                      {SUPPORT_EMAIL}
                    </Text>
                  </View>
                  <View className="gap-3">
                    <Button
                      title="Contact Us"
                      variant="primary"
                      onPress={handleContactUs}
                    />
                    <Button
                      title={
                        showContactForm ? "Hide message form" : "Message us in-app"
                      }
                      variant="outline"
                      onPress={() => setShowContactForm((v) => !v)}
                    />
                  </View>
                  {showContactForm && (
                    <Animated.View
                      layout={Layout.duration(200)}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <Input
                        label="Name"
                        placeholder="Your name"
                        value={contactName}
                        onChangeText={setContactName}
                      />
                      <Input
                        label="Email"
                        placeholder="your@email.com"
                        value={contactEmail}
                        onChangeText={setContactEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      <View className="mb-4">
                        <Text className="text-gray-800 text-sm font-outfit-medium mb-2">
                          Message
                        </Text>
                        <TextInput
                          className="bg-gray-100 rounded-lg px-4 py-4 text-gray-900 font-outfit-regular min-h-[100px]"
                          placeholder="How can we help?"
                          placeholderTextColor="#9CA3AF"
                          value={contactMessage}
                          onChangeText={setContactMessage}
                          multiline
                          textAlignVertical="top"
                        />
                      </View>
                      <Button
                        title="Send message"
                        variant="primary"
                        onPress={handleContactUs}
                      />
                    </Animated.View>
                  )}
                </Card>
              </Section>

              {/* Report a Problem */}
              <Section title="Report a problem">
                <Card>
                  <Text className="text-gray-600 font-outfit-regular text-sm mb-4">
                    Found a bug or something not working? Let us know and we will look
                    into it.
                  </Text>
                  <Button
                    title="Report Issue"
                    variant="outline"
                    onPress={handleReportIssue}
                  />
                </Card>
              </Section>

              {/* Terms & Privacy */}
              <Section title="Legal">
                <Card>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(PRIVACY_URL)}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between py-3 border-b border-gray-100"
                  >
                    <Text className="text-gray-900 font-outfit-medium">
                      Privacy Policy
                    </Text>
                    <Ionicons name="open-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(TERMS_URL)}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-between py-3"
                  >
                    <Text className="text-gray-900 font-outfit-medium">
                      Terms of Service
                    </Text>
                    <Ionicons name="open-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </Card>
              </Section>
            </>
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: 32,
          }}
        />
      </View>
    </SafeAreaView>
  );
}
