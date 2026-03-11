import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Button } from "../../components/ui/Button";
import { useServices } from "../../hooks/useServices";
import { useAuthStore } from "../../store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { showErrorToast, showSuccessToast } from "../../utils/toast";

const MIN_WITHDRAWAL_AMOUNT = 200;

export default function Wallet() {
  const { wallet: walletService, profile } = useServices();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank_transfer">("upi");
  const [upiId, setUpiId] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profile.getProfile(),
    enabled: !!user,
  });

  const { data: walletData, isLoading: isLoadingWallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => walletService.getWallet(),
  });

  const { data: dailyEarnings, isLoading: isLoadingDaily } = useQuery({
    queryKey: ["walletDailyEarnings"],
    queryFn: () => walletService.getDailyEarnings(),
  });

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["walletTransactions"],
    queryFn: () => walletService.getTransactions(50),
  });

  const { data: withdrawals, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ["walletWithdrawals"],
    queryFn: () => walletService.getWithdrawals(),
  });

  useEffect(() => {
    if (showWithdrawModal && profileData) {
      setUpiId((profileData as { upiId?: string })?.upiId || "");
    }
  }, [showWithdrawModal, profileData]);

  const requestWithdrawalMutation = useMutation({
    mutationFn: (body: {
      amount: number;
      method: "upi" | "bank_transfer";
      upiId?: string;
      bankAccountNumber?: string;
      bankIfsc?: string;
      bankName?: string;
      accountHolderName?: string;
    }) => walletService.requestWithdrawal(body),
    onSuccess: () => {
      setShowWithdrawModal(false);
      setAmount("");
      setUpiId((profileData as { upiId?: string })?.upiId || "");
      setBankAccountNumber("");
      setBankIfsc("");
      setBankName("");
      setAccountHolderName("");
      queryClient.invalidateQueries({ queryKey: ["walletWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      showSuccessToast("Success", "Withdrawal request submitted successfully!");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = err?.response?.data?.message || err?.message || "Failed to submit withdrawal";
      showErrorToast("Error", msg);
    },
  });

  const handleWithdraw = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showErrorToast("Error", "Please enter a valid amount");
      return;
    }
    if (numAmount < MIN_WITHDRAWAL_AMOUNT) {
      showErrorToast("Error", `Minimum withdrawal is ₹${MIN_WITHDRAWAL_AMOUNT}`);
      return;
    }
    const available = parseFloat(walletData?.availableBalance ?? "0");
    if (numAmount > available) {
      showErrorToast("Error", "Insufficient balance");
      return;
    }
    if (method === "upi") {
      if (!upiId?.trim() || !upiId.includes("@")) {
        showErrorToast("Error", "Please enter a valid UPI ID (e.g. name@upi)");
        return;
      }
      requestWithdrawalMutation.mutate({
        amount: numAmount,
        method: "upi",
        upiId: upiId.trim(),
      });
      return;
    }
    if (!bankAccountNumber?.trim() || !bankIfsc?.trim() || !accountHolderName?.trim()) {
      showErrorToast("Error", "Please fill bank account number, IFSC and account holder name");
      return;
    }
    requestWithdrawalMutation.mutate({
      amount: numAmount,
      method: "bank_transfer",
      bankAccountNumber: bankAccountNumber.trim(),
      bankIfsc: bankIfsc.trim(),
      bankName: bankName.trim() || undefined,
      accountHolderName: accountHolderName.trim(),
    });
  };

  const formatCurrency = (value: string | number) => {
    const n = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(n)) return "₹0.00";
    return `₹${n.toFixed(2)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earning":
        return { name: "add-circle" as const, color: "#10B981" };
      case "withdrawal":
        return { name: "remove-circle" as const, color: "#EF4444" };
      default:
        return { name: "swap-horizontal" as const, color: "#6B7280" };
    }
  };

  const getWithdrawalStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100";
      case "approved":
      case "completed":
        return "bg-green-100";
      case "rejected":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  const getWithdrawalStatusTextColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-700";
      case "approved":
      case "completed":
        return "text-green-700";
      case "rejected":
        return "text-red-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScreenHeader
        title="Wallet"
        showBackButton
        onBackPress={() => router.push("/(tabs)/options")}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-6">
          {/* Balance card */}
          <View className="bg-blue-500 rounded-2xl p-6 mb-6">
            <Text className="text-white/90 text-sm font-outfit-regular mb-1">
              Available Balance
            </Text>
            <Text className="text-white text-3xl font-outfit-bold mb-1">
              {isLoadingWallet ? "..." : formatCurrency(walletData?.availableBalance ?? "0")}
            </Text>
            <Text className="text-white/80 text-sm font-outfit-regular">
              Total earnings: {isLoadingWallet ? "..." : formatCurrency(walletData?.totalEarnings ?? "0")}
            </Text>
          </View>

          {/* Today's earnings */}
          <View className="bg-gray-50 rounded-xl p-4 mb-6 flex-row items-center">
            <View className="bg-green-100 rounded-full p-3 mr-4">
              <Ionicons name="trending-up" size={24} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 text-sm font-outfit-regular">Today&apos;s earnings</Text>
              <Text className="text-gray-900 text-lg font-outfit-bold">
                {isLoadingDaily ? "..." : formatCurrency(dailyEarnings?.estimatedEarnings ?? 0)}
              </Text>
            </View>
          </View>

          {/* Withdraw button */}
          <TouchableOpacity
            className="bg-green-500 rounded-xl p-4 mb-6 flex-row items-center justify-center"
            onPress={() => {
              const available = parseFloat(walletData?.availableBalance ?? "0");
              if (available < MIN_WITHDRAWAL_AMOUNT) {
                showErrorToast("Error", `Minimum withdrawal is ₹${MIN_WITHDRAWAL_AMOUNT}. Your balance: ${formatCurrency(available)}`);
                return;
              }
              setShowWithdrawModal(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
            <Text className="text-white text-base font-outfit-semi-bold ml-2">
              Withdraw (min ₹{MIN_WITHDRAWAL_AMOUNT})
            </Text>
          </TouchableOpacity>

          {/* Withdrawals history */}
          {withdrawals && withdrawals.length > 0 && (
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-outfit-bold mb-4">
                Withdrawal history
              </Text>
              <View className="gap-3">
                {withdrawals.map((w) => (
                  <View
                    key={w.id}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View className="bg-blue-100 rounded-full p-2 mr-3">
                          <Ionicons name="wallet-outline" size={20} color="#3B82F6" />
                        </View>
                        <View>
                          <Text className="text-gray-900 text-base font-outfit-semi-bold">
                            {formatCurrency(w.amount)}
                          </Text>
                          <Text className="text-gray-600 text-sm font-outfit-regular">
                            {w.method === "upi" ? `UPI: ${w.upiId ?? "—"}` : "Bank transfer"}
                          </Text>
                        </View>
                      </View>
                      <View className={`rounded-full px-3 py-1 ${getWithdrawalStatusColor(w.status)}`}>
                        <Text className={`text-xs font-outfit-semi-bold ${getWithdrawalStatusTextColor(w.status)}`}>
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    {w.adminNotes ? (
                      <Text className="text-gray-500 text-xs font-outfit-regular mt-2">
                        Note: {w.adminNotes}
                      </Text>
                    ) : null}
                    <Text className="text-gray-500 text-xs font-outfit-regular mt-2">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Transactions */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-outfit-bold mb-4">
              Recent transactions
            </Text>
            {isLoadingTransactions ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="text-gray-500 text-sm font-outfit-regular mt-2">
                  Loading...
                </Text>
              </View>
            ) : transactions && transactions.length > 0 ? (
              <View className="gap-3">
                {transactions.map((t) => {
                  const icon = getTransactionIcon(t.type);
                  const isCredit = t.type === "earning" || t.type === "refund";
                  const amt = parseFloat(t.amount);
                  return (
                    <View
                      key={t.id}
                      className="bg-white rounded-lg p-4 border border-gray-200 flex-row items-center"
                    >
                      <View
                        className="rounded-full p-2 mr-4"
                        style={{ backgroundColor: `${icon.color}20` }}
                      >
                        <Ionicons name={icon.name} size={22} color={icon.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 text-base font-outfit-semi-bold">
                          {t.description || (t.type === "earning" ? "Earning" : t.type === "withdrawal" ? "Withdrawal" : "Refund")}
                        </Text>
                        <Text className="text-gray-500 text-xs font-outfit-regular mt-1">
                          {new Date(t.createdAt).toLocaleString()}
                        </Text>
                      </View>
                      <Text
                        className={`text-base font-outfit-semi-bold ${isCredit ? "text-green-600" : "text-red-600"}`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatCurrency(amt)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="py-8 items-center">
                <Ionicons name="list-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-900 text-lg font-outfit-semi-bold mt-4">
                  No transactions yet
                </Text>
                <Text className="text-gray-600 text-sm font-outfit-regular mt-2 text-center">
                  Earnings from coins and ads will appear here.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Withdraw modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-4"
          activeOpacity={1}
          onPress={() => setShowWithdrawModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 500 }}
          >
            <View className="bg-white rounded-2xl shadow-2xl">
              <View className="p-6 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 text-xl font-outfit-bold">
                    Withdraw
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowWithdrawModal(false)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="p-6">
                  <Text className="text-gray-700 text-sm font-outfit-regular mb-2">
                    Available: {formatCurrency(walletData?.availableBalance ?? "0")}
                  </Text>
                  <Text className="text-gray-900 text-base font-outfit-semi-bold mb-2">
                    Amount (₹)
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder={`Min ₹${MIN_WITHDRAWAL_AMOUNT}`}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9CA3AF"
                    className="border border-gray-300 rounded-lg p-4 text-gray-900 text-base font-outfit-regular mb-4"
                  />

                  <Text className="text-gray-900 text-base font-outfit-semi-bold mb-2">
                    Method
                  </Text>
                  <View className="flex-row gap-3 mb-4">
                    <TouchableOpacity
                      onPress={() => setMethod("upi")}
                      className={`flex-1 rounded-lg p-4 border-2 ${method === "upi" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    >
                      <Text className={`text-center font-outfit-semi-bold ${method === "upi" ? "text-blue-600" : "text-gray-600"}`}>
                        UPI
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setMethod("bank_transfer")}
                      className={`flex-1 rounded-lg p-4 border-2 ${method === "bank_transfer" ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    >
                      <Text className={`text-center font-outfit-semi-bold ${method === "bank_transfer" ? "text-blue-600" : "text-gray-600"}`}>
                        Bank
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {method === "upi" ? (
                    <>
                      <Text className="text-gray-900 text-base font-outfit-semi-bold mb-2">
                        UPI ID
                      </Text>
                      <TextInput
                        value={upiId}
                        onChangeText={setUpiId}
                        placeholder="name@upi"
                        placeholderTextColor="#9CA3AF"
                        className="border border-gray-300 rounded-lg p-4 text-gray-900 text-base font-outfit-regular mb-4"
                      />
                    </>
                  ) : (
                    <>
                      <Text className="text-gray-900 text-base font-outfit-semi-bold mb-2">
                        Account holder name
                      </Text>
                      <TextInput
                        value={accountHolderName}
                        onChangeText={setAccountHolderName}
                        placeholder="Full name"
                        placeholderTextColor="#9CA3AF"
                        className="border border-gray-300 rounded-lg p-4 text-gray-900 text-base font-outfit-regular mb-3"
                      />
                      <Text className="text-gray-900 text-base font-outfit-semi-bold mb-2">
                        Account number
                      </Text>
                      <TextInput
                        value={bankAccountNumber}
                        onChangeText={setBankAccountNumber}
                        placeholder="Bank account number"
                        keyboardType="number-pad"
                        placeholderTextColor="#9CA3AF"
                        className="border border-gray-300 rounded-lg p-4 text-gray-900 text-base font-outfit-regular mb-3"
                      />
                      <Text className="text-gray-900 text-base font-outfit-semi-bold mb-2">
                        IFSC
                      </Text>
                      <TextInput
                        value={bankIfsc}
                        onChangeText={setBankIfsc}
                        placeholder="e.g. SBIN0001234"
                        placeholderTextColor="#9CA3AF"
                        className="border border-gray-300 rounded-lg p-4 text-gray-900 text-base font-outfit-regular mb-3"
                      />
                      <Text className="text-gray-900 text-base font-outfit-semi-bold mb-2">
                        Bank name (optional)
                      </Text>
                      <TextInput
                        value={bankName}
                        onChangeText={setBankName}
                        placeholder="Bank name"
                        placeholderTextColor="#9CA3AF"
                        className="border border-gray-300 rounded-lg p-4 text-gray-900 text-base font-outfit-regular mb-4"
                      />
                    </>
                  )}

                  <Button
                    title="Submit request"
                    onPress={handleWithdraw}
                    loading={requestWithdrawalMutation.isPending}
                  />
                </View>
              </KeyboardAwareScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
