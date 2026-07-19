import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BackHeaderProps {
  title: string;
  onBack: () => void;
}

export default function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <View className="flex-row items-center gap-3 px-5 pt-4 pb-3 bg-white border-b border-slate-100">
      <TouchableOpacity onPress={onBack} className="p-1">
        <Ionicons name="arrow-back" size={24} color="#0f172a" />
      </TouchableOpacity>
      <Text className="text-xl font-extrabold text-slate-900">{title}</Text>
    </View>
  );
}