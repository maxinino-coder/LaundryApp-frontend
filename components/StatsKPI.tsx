import React from 'react';
import { View, Text } from 'react-native';

interface KPIItem {
  label: string;
  value: string;
  color: string;
}

interface StatsKPIProps {
  stats: KPIItem[];
}

export default function StatsKPI({ stats }: StatsKPIProps) {
  return (
    <View className="flex-row flex-wrap gap-3 mb-5">
      {stats.map((s, i) => (
        <View key={i} className="bg-white rounded-2xl p-4 flex-1 min-w-[44%] border border-slate-100">
          <Text className="text-xs text-slate-500 mb-2">{s.label}</Text>
          <Text className="text-3xl font-extrabold text-slate-900">{s.value}</Text>
        </View>
      ))}
    </View>
  );
}