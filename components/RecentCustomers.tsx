import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserInfo } from '@/lib/api';

interface RecentCustomersProps {
  customers: UserInfo[];
}

export default function RecentCustomers({ customers }: RecentCustomersProps) {
  if (customers.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
        <Ionicons name="people-outline" size={32} color="#cbd5e1" />
        <Text className="text-slate-400 text-sm mt-2">No customers yet</Text>
      </View>
    );
  }

  return (
    <>
      {customers.slice(0, 3).map((c, i) => (
        <View key={i} className="bg-white rounded-2xl p-4 mb-2 flex-row items-center gap-3 border border-slate-100">
          <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
            <Text className="text-blue-600 font-bold text-sm">
              {c.firstName?.[0]}{c.lastName?.[0]}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-slate-900">{c.firstName} {c.lastName}</Text>
            <Text className="text-xs text-slate-400">{c.email}</Text>
          </View>
        </View>
      ))}
    </>
  );
}