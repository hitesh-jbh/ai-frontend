import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useServices } from "../../hooks/useServices";

interface AnalyticsChartProps {
  period?: "all" | "daily" | "weekly" | "monthly";
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  period: initialPeriod = "weekly",
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "daily" | "weekly" | "monthly"
  >(initialPeriod);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const { analytics } = useServices();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["analyticsChart", selectedPeriod, 4],
    queryFn: () => analytics.getTopCreatorsForChart(4, selectedPeriod),
    staleTime: 1000 * 60 * 60, // Cache for 30 seconds
  });
  const data = chartData || [];
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 1); // Avoid division by zero

  const periodLabels: Record<"all" | "daily" | "weekly" | "monthly", string> = {
    all: "All Time",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };

  const periods: Array<"all" | "daily" | "weekly" | "monthly"> = [
    "all",
    "daily",
    "weekly",
    "monthly",
  ];

  const getBarColor = (index: number, value: number) => {
    const colors = ["#3B82F6", "#10B981", "#EF4444", "#8B5CF6"]; // Removed orange (#F59E0B)
    return colors[index % colors.length];
  };

  return (
    <View className="bg-white rounded-lg p-4 mb-6">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name="analytics" size={20} color="#3B82F6" />
          <Text className="text-gray-900 text-xl font-outfit-semi-bold ml-2">
            Top Creators
          </Text>
        </View>
        <TouchableOpacity
          className="bg-gray-100 rounded-lg px-3 py-1.5 flex-row items-center"
          activeOpacity={0.7}
          onPress={() => setShowPeriodModal(true)}
        >
          <Text className="text-gray-700 text-base font-outfit-regular mr-1">
            {periodLabels[selectedPeriod]}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="h-32 items-center justify-center">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      ) : data.length === 0 ? (
        <View className="h-32 items-center justify-center">
          <Ionicons name="bar-chart-outline" size={32} color="#9CA3AF" />
          <Text className="text-gray-500 text-sm font-outfit-regular mt-2">
            No data available
          </Text>
        </View>
      ) : (
        <>
          {/* Chart Bars */}
          <View className="flex-row items-end justify-between h-32 mb-2 mt-8">
            {data.map((item, index) => {
              const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const barColor = getBarColor(index, item.value);

              return (
                <View key={index} className="flex-1 items-center mx-1">
                  <View
                    className="w-full items-center justify-end relative"
                    style={{ height: "100%" }}
                  >
                    {/* Value label on top of bar */}
                    <View className="absolute -top-6 w-full items-center">
                      <Text
                        className="text-sm font-outfit-semi-bold"
                        style={{ color: barColor }}
                      >
                        {item.value}
                      </Text>
                    </View>

                    {/* Bar */}
                    <View
                      className="rounded-t-lg w-full relative"
                      style={{
                        height: `${Math.max(height, 5)}%`, // Minimum 5% height
                        backgroundColor: barColor,
                        minHeight: 8,
                      }}
                    >
                      {/* Gradient effect simulation with opacity */}
                      <View
                        className="absolute inset-0 rounded-t-lg"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                        }}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Labels */}
          <View className="flex-row justify-between mt-2">
            {data.map((item, index) => (
              <View key={index} className="flex-1 items-center">
                <Text
                  className="text-gray-500 text-sm font-outfit-regular text-center"
                  numberOfLines={1}
                >
                  {item.name.length > 8
                    ? `${item.name.substring(0, 6)}...`
                    : item.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Max value indicator */}
          {maxValue > 0 && (
            <View className="mt-2 pt-2 border-t border-gray-100">
              <Text className="text-gray-400 text-sm font-outfit-regular text-center">
                Max: {maxValue} coins
              </Text>
            </View>
          )}
        </>
      )}

      {/* Period Selection Modal */}
      <Modal
        visible={showPeriodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-900 text-xl font-outfit-bold">
                Select Period
              </Text>
              <TouchableOpacity
                onPress={() => setShowPeriodModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              {periods.map((period) => (
                <TouchableOpacity
                  key={period}
                  className={`rounded-lg p-4 border ${
                    selectedPeriod === period
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white border-gray-200"
                  }`}
                  onPress={() => {
                    setSelectedPeriod(period);
                    setShowPeriodModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-base font-outfit-semi-bold ${
                      selectedPeriod === period
                        ? "text-blue-700"
                        : "text-gray-900"
                    }`}
                  >
                    {periodLabels[period]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
