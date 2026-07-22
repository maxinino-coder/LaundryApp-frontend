import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SERVICE_OPTIONS, PICKUP_FEE, DROPOFF_FEE } from '@/constants/services';

/**
 * Platform service catalog (read-only). Prices are fixed platform-wide —
 * this is the same table users order from and the backend prices with
 * (backend: ServicePricing.java, frontend: constants/services.ts).
 */
export default function BusinessCatalog() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="washing-machine" size={22} color="#2563EB" />
          <Text className="text-xl font-extrabold text-blue-600">Service Catalog</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-extrabold text-slate-900 mb-1">My Services</Text>
        <Text className="text-slate-500 text-sm mb-5">
          These are the platform's fixed service categories and prices customers order from.
        </Text>

        {SERVICE_OPTIONS.map((s) => (
          <View
            key={s.category}
            className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 flex-row items-center gap-4"
            style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}
          >
            <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center">
              <MaterialCommunityIcons name={s.icon as any} size={24} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900">{s.label}</Text>
              <Text className="text-xs text-slate-500">{s.description}</Text>
            </View>
            <View className="items-end">
              <Text className="font-extrabold text-blue-600">GHS {s.unitPrice.toFixed(2)}</Text>
              <Text className="text-xs text-slate-400">/item</Text>
            </View>
          </View>
        ))}

        {/* Delivery fees */}
        <Text className="text-lg font-bold text-slate-900 mt-4 mb-3">Delivery fees</Text>
        <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-100">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="arrow-up-circle-outline" size={18} color="#2563EB" />
              <Text className="text-sm text-slate-600">Pickup (customer → you)</Text>
            </View>
            <Text className="font-bold text-slate-900">GHS {PICKUP_FEE.toFixed(2)}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="arrow-down-circle-outline" size={18} color="#16a34a" />
              <Text className="text-sm text-slate-600">Delivery (you → customer)</Text>
            </View>
            <Text className="font-bold text-slate-900">GHS {DROPOFF_FEE.toFixed(2)}</Text>
          </View>
        </View>

        <View className="bg-blue-50 rounded-2xl p-4 mb-8 border border-blue-100 flex-row gap-3">
          <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
          <Text className="text-xs text-blue-700 flex-1">
            Rider fees are paid by the customer and go to the rider after each delivery leg is confirmed.
            Your revenue is the service subtotal, settled to your Paystack subaccount.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
