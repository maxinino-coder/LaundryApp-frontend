import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const SERVICES = [
  { name: 'Wash & Fold', desc: 'General cleaning', price: 'GHS 20.00', unit: '/kg', active: true, iconBg: '#dbeafe', iconColor: '#2563EB', icon: 'washing-machine' },
  { name: 'Dry Clean', desc: 'Suits, dresses, silk', price: 'GHS 15.00', unit: '/item', active: true, iconBg: '#f1f5f9', iconColor: '#64748b', icon: 'hanger' },
  { name: 'Iron Only', desc: 'Pressed & hung', price: 'GHS 5.00', unit: '/item', active: false, iconBg: '#ffedd5', iconColor: '#ea580c', icon: 'iron-outline' },
];

export default function BusinessCatalog() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="washing-machine" size={22} color="#2563EB" />
          <Text className="text-xl font-extrabold text-blue-600">LaundroManager</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity><Ionicons name="search-outline" size={22} color="#0f172a" /></TouchableOpacity>
          <View className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center">
            <Ionicons name="person" size={14} color="#64748b" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-extrabold text-slate-900 mb-1">My Services</Text>
        <Text className="text-slate-500 text-sm mb-5">Manage your laundry offerings and pricing</Text>

        {SERVICES.map((s, i) => (
          <View key={i} className="bg-white rounded-2xl p-4 mb-3 border border-slate-100" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: s.iconBg }}>
                  <MaterialCommunityIcons name={s.icon as any} size={24} color={s.iconColor} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900">{s.name}</Text>
                  <Text className="text-sm text-slate-500">{s.desc}</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Ionicons name="pencil-outline" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-slate-400 mb-0.5">Price</Text>
                <Text className="font-bold text-blue-600">{s.price} <Text className="text-slate-400 font-normal">{s.unit}</Text></Text>
              </View>
              <Switch value={s.active} trackColor={{ true: '#2563EB' }} />
            </View>
          </View>
        ))}

        {/* Add service */}
        <TouchableOpacity className="border-2 border-dashed border-slate-200 rounded-2xl p-6 items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mb-2">
            <Ionicons name="add" size={20} color="#94a3b8" />
          </View>
          <Text className="text-slate-500 font-semibold">Add Another Service</Text>
        </TouchableOpacity>

        {/* Promo tip */}
        <View className="bg-blue-600 rounded-2xl p-5 mb-8">
          <Text className="text-white text-xl font-extrabold mb-2">Optimize your Catalog</Text>
          <Text className="text-blue-200 text-sm mb-4">Services with descriptive text and accurate itemized pricing see a 15% higher conversion rate from new customers.</Text>
          <TouchableOpacity className="bg-white rounded-xl px-5 py-2.5 self-start">
            <Text className="text-blue-600 font-bold text-sm">Learn Best Practices</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity className="absolute bottom-24 right-5 w-14 h-14 bg-blue-600 rounded-full items-center justify-center" style={{ elevation: 4 }}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}