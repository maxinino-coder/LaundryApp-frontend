import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BusinessPayoutDTO, SettlementStatus } from '@/types/type';

interface PayoutHistoryProps {
  payouts: BusinessPayoutDTO['payouts'];
}

export default function PayoutHistory({ payouts }: PayoutHistoryProps) {
  if (!payouts || payouts.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
        <MaterialCommunityIcons name="cash-multiple" size={32} color="#cbd5e1" />
        <Text className="text-slate-400 text-sm mt-2">No payouts yet</Text>
      </View>
    );
  }

  return (
    <>
      {payouts.map((p, i) => (
        <View key={i} className="bg-white rounded-2xl p-4 mb-3 border border-slate-100">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs text-blue-600 font-bold">#{p.order_id.slice(0, 8)}</Text>
            <View className={`px-2 py-0.5 rounded-full ${p.status === SettlementStatus.SETTLED ? 'bg-green-50' : p.status === SettlementStatus.FAILED ? 'bg-red-50' : 'bg-orange-50'}`}>
              <Text className={`text-xs font-bold ${p.status === SettlementStatus.SETTLED ? 'text-green-600' : p.status === SettlementStatus.FAILED ? 'text-red-600' : 'text-orange-600'}`}>
                {p.status}
              </Text>
            </View>
          </View>
          <Text className="font-extrabold text-slate-900 text-lg">GHS {p.net_payout?.toFixed(2)}</Text>
          <Text className="text-xs text-slate-400">
            Revenue: GHS {p.order_revenue?.toFixed(2)} · Commission: GHS {p.platform_commission?.toFixed(2)}
          </Text>
          {p.settled_at && (
            <Text className="text-xs text-slate-400 mt-1">
              Settled: {new Date(p.settled_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      ))}
    </>
  );
}