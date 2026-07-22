import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { riderApi } from '@/lib/api';
import { RiderPayoutDTO } from '@/types/type';

export default function RiderEarnings() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payout, setPayout] = useState<RiderPayoutDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      const accountId = await SecureStore.getItemAsync('account_id');
      if (!accountId) {
        setError('Not logged in');
        return;
      }
      const data = await riderApi.getRiderPayout(accountId);
      setPayout(data);
      setError(null);
    } catch (e: any) {
      console.error('Error fetching earnings:', e);
      setError(e.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEarnings();
    }, [fetchEarnings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  const fmt = (n?: number) => Number(n ?? 0).toFixed(2);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
            <MaterialCommunityIcons name="wallet-outline" size={20} color="#fff" />
          </View>
          <Text className="text-xl font-extrabold text-blue-600">Earnings</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? (
          <View className="mx-5 bg-red-50 rounded-2xl p-4 border border-red-100 mb-4">
            <Text className="text-red-600 text-sm">{error}</Text>
          </View>
        ) : null}

        {/* Balance card */}
        <View className="mx-5 mb-4 bg-blue-600 rounded-2xl p-5">
          <Text className="text-blue-200 text-sm mb-1">Total Earnings</Text>
          <Text className="text-white text-4xl font-extrabold mb-2">
            GHS {fmt(payout?.totalEarnings)}
          </Text>
          <View className="bg-blue-500 rounded-full px-3 py-1.5 self-start flex-row items-center gap-1">
            <MaterialCommunityIcons name="moped" size={14} color="#fff" />
            <Text className="text-white text-sm font-semibold">
              {payout?.totalOrders ?? 0} deliveries completed
            </Text>
          </View>
        </View>

        {/* Settled / Pending split */}
        <View className="mx-5 mb-4 flex-row gap-3">
          <View className="flex-1 bg-green-50 rounded-2xl p-4 border border-green-100">
            <Text className="text-green-600 text-xs font-semibold mb-1">PAID OUT</Text>
            <Text className="text-slate-900 text-xl font-extrabold">GHS {fmt(payout?.totalSettled)}</Text>
            <Text className="text-slate-400 text-xs mt-1">{payout?.settledCount ?? 0} payouts</Text>
          </View>
          <View className="flex-1 bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <Text className="text-orange-600 text-xs font-semibold mb-1">PENDING</Text>
            <Text className="text-slate-900 text-xl font-extrabold">GHS {fmt(payout?.totalPending)}</Text>
            <Text className="text-slate-400 text-xs mt-1">{payout?.pendingCount ?? 0} pending</Text>
          </View>
        </View>

        {/* Per-leg split */}
        <View className="mx-5 mb-4 bg-white rounded-2xl p-4 border border-slate-100">
          <Text className="font-bold text-slate-900 mb-3">Earnings by leg</Text>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="arrow-up-circle-outline" size={18} color="#2563EB" />
              <Text className="text-sm text-slate-600">Pickups (customer → laundry)</Text>
            </View>
            <Text className="font-bold text-slate-900">GHS {fmt(payout?.pickupEarnings)}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="arrow-down-circle-outline" size={18} color="#16a34a" />
              <Text className="text-sm text-slate-600">Deliveries (laundry → customer)</Text>
            </View>
            <Text className="font-bold text-slate-900">GHS {fmt(payout?.dropoffEarnings)}</Text>
          </View>
        </View>

        {/* Earnings history */}
        <View className="px-5 mb-8">
          <Text className="text-lg font-bold text-slate-900 mb-3">History</Text>
          {(payout?.earnings ?? []).length > 0 ? (
            (payout?.earnings ?? []).map((item, i) => {
              const settled = String(item.status) === 'SETTLED';
              const failed = String(item.status) === 'FAILED';
              return (
                <View key={i} className="bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-4 border border-slate-100">
                  <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center">
                    <MaterialCommunityIcons name="moped" size={22} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text className="font-bold text-slate-900 text-sm">
                        {String((item as any).leg ?? item.payment_type ?? '').replace('RIDE_', '') || 'Delivery'}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-full ${settled ? 'bg-green-50' : failed ? 'bg-red-50' : 'bg-orange-50'}`}>
                        <Text className={`text-xs font-bold ${settled ? 'text-green-600' : failed ? 'text-red-600' : 'text-orange-600'}`}>
                          {String(item.status)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                  <Text className="font-bold text-blue-600">GHS {fmt(item.amount)}</Text>
                </View>
              );
            })
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center border border-slate-100">
              <MaterialCommunityIcons name="cash-remove" size={32} color="#cbd5e1" />
              <Text className="text-slate-400 text-sm mt-2">No earnings yet</Text>
              <Text className="text-slate-300 text-xs mt-1">Complete deliveries to earn</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
