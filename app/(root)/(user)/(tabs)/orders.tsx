import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { userApi } from '@/lib/api';
import { Order, OrderStatus } from '@/types/type';

const STATUS_COLORS: Partial<Record<OrderStatus, { bg: string; text: string }>> = {
  [OrderStatus.PENDING]:          { bg: 'bg-orange-100', text: 'text-orange-600' },
  [OrderStatus.CONFIRMED]:        { bg: 'bg-blue-100',   text: 'text-blue-600' },
  [OrderStatus.ACCEPTED]:         { bg: 'bg-blue-100',   text: 'text-blue-600' },
  [OrderStatus.PICKED_UP]:        { bg: 'bg-purple-100', text: 'text-purple-600' },
  [OrderStatus.IN_PROGRESS]:      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  [OrderStatus.READY]:            { bg: 'bg-green-100',  text: 'text-green-600' },
  [OrderStatus.OUT_FOR_DELIVERY]: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  [OrderStatus.DELIVERED]:        { bg: 'bg-slate-100',  text: 'text-slate-600' },
  [OrderStatus.CANCELLED]:        { bg: 'bg-red-100',    text: 'text-red-600' },
};

const FILTERS = ['All', 'Active', 'Completed'] as const;

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.ACCEPTED,
  OrderStatus.PICKED_UP, OrderStatus.IN_PROGRESS, OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
];

export default function UserOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const load = useCallback(async () => {
    try {
      const accountId = await SecureStore.getItemAsync('account_id');
      if (!accountId) return;
      const data = await userApi.getOrdersByUserId(accountId);
      setOrders(data);
    } catch (e) {
      console.error('Orders load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh whenever the tab regains focus (e.g. after placing an order)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filtered = orders.filter((o) => {
    if (filter === 'Active') return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'Completed')
      return o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED;
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-extrabold text-slate-900">My Orders</Text>
      </View>

      {/* Filter chips */}
      <View className="flex-row px-5 gap-2 mb-3">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`rounded-full px-4 py-2 ${filter === f ? 'bg-blue-600' : 'bg-white border border-slate-200'}`}
          >
            <Text className={`text-sm font-semibold ${filter === f ? 'text-white' : 'text-slate-600'}`}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="bg-white rounded-2xl p-8 items-center border border-slate-100 mt-4">
              <MaterialCommunityIcons name="package-variant-closed" size={40} color="#cbd5e1" />
              <Text className="text-slate-400 text-sm mt-3">No orders here yet</Text>
              <TouchableOpacity
                onPress={() => router.push('/(root)/(user)/(tabs)/home' as any)}
                className="mt-4 bg-blue-600 rounded-xl px-5 py-2.5"
              >
                <Text className="text-white font-bold text-sm">Find a laundry</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const colors = STATUS_COLORS[item.status] ?? { bg: 'bg-slate-100', text: 'text-slate-600' };
            return (
              <TouchableOpacity
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
                onPress={() =>
                  router.push({
                    pathname: '/(root)/(user)/order/[orderId]' as any,
                    params: { orderId: item.orderId },
                  })
                }
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-bold text-slate-900">{item.orderNumber}</Text>
                  <View className={`px-2 py-1 rounded-lg ${colors.bg}`}>
                    <Text className={`text-xs font-bold ${colors.text}`}>{item.status}</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2 mb-1">
                  <Ionicons name="location-outline" size={14} color="#94a3b8" />
                  <Text className="text-xs text-slate-500 flex-1" numberOfLines={1}>
                    {item.pickupAddress}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-xs text-slate-400">
                    {item.orderItems?.length ?? 0} item{(item.orderItems?.length ?? 0) === 1 ? '' : 's'}
                  </Text>
                  <Text className="font-bold text-blue-600">
                    GHS {item.totalAmount?.toFixed?.(2) ?? item.totalAmount}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
