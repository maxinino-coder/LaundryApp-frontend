import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface EarningsCardProps {
  loading: boolean;
  totalEarnings: number;
  ordersCount: number;
  deliveredCount: number;
  pendingCount: number;
  customersCount: number;
}

export default function EarningsCard({
  loading,
  totalEarnings,
  ordersCount,
  deliveredCount,
  pendingCount,
  customersCount,
}: EarningsCardProps) {
  if (loading) {
    return <ActivityIndicator color="#2563EB" style={{ marginVertical: 20 }} />;
  }

  return (
    <View className="mx-5 mb-5 bg-blue-600 rounded-2xl p-5">
      <Text className="text-blue-200 text-sm mb-1">Total Earnings</Text>
      <Text className="text-white text-4xl font-extrabold mb-3">
        GHS {totalEarnings.toFixed(2)}
      </Text>
      <View className="flex-row gap-3">
        {[
          { label: 'Orders', value: String(ordersCount) },
          { label: 'Completed', value: String(deliveredCount) },
          { label: 'Pending', value: String(pendingCount) },
          { label: 'Customers', value: String(customersCount) },
        ].map((s, i) => (
          <View key={i} className="flex-1 bg-white/10 rounded-xl p-2 items-center">
            <Text className="text-white font-extrabold text-lg">{s.value}</Text>
            <Text className="text-blue-200 text-xs">{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}