import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsItem {
  key: string;
  icon: string;
  label: string;
  subtitle: string;
}

interface SettingsListProps {
  items: SettingsItem[];
  onPress: (key: string) => void;
}

export default function SettingsList({ items, onPress }: SettingsListProps) {
  return (
    <View className="gap-3">
      {items.map((s) => (
        <TouchableOpacity
          key={s.key}
          onPress={() => onPress(s.key)}
          className="bg-white rounded-2xl p-4 flex-row items-center gap-4 border border-slate-100"
        >
          <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
            <Ionicons name={s.icon as any} size={20} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-slate-900">{s.label}</Text>
            <Text className="text-xs text-slate-400">{s.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      ))}
    </View>
  );
}