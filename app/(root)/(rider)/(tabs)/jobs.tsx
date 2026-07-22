import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { riderApi, AvailableOrder } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import * as SecureStore from 'expo-secure-store';
import { calculateTotalDistance } from '@/lib/map';
import { useUserLocation } from '@/hooks/useUserLocation';

/** Straight-line fallback when the Directions API is unavailable. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RiderJobs() {
  const [applying, setApplying] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [distances, setDistances] = useState<Record<string, number>>({});

  useUserLocation();

  const { data: jobs, loading, error, refetch } = useApi(
    () => riderApi.getAvailableOrders(), []
  );

  // Compute each job's pickup→delivery distance once jobs load.
  useEffect(() => {
    if (!jobs) return;
    (async () => {
      const results: Record<string, number> = {};
      for (const job of jobs) {
        try {
          const d = await calculateTotalDistance({
            userLatitude: job.pickupLat ?? 0,
            userLongitude: job.pickupLng ?? 0,
            destinationLatitude: job.deliveryLat ?? 0,
            destinationLongitude: job.deliveryLng ?? 0,
          });
          results[job.orderId] = d.distanceInKm;
        } catch {
          // Directions API failed — fall back to straight-line distance
          if (job.pickupLat && job.deliveryLat) {
            results[job.orderId] = Math.round(
              haversineKm(job.pickupLat, job.pickupLng, job.deliveryLat, job.deliveryLng) * 10
            ) / 10;
          } else {
            results[job.orderId] = 0;
          }
        }
      }
      setDistances(results);
    })();
  }, [jobs]);

  async function handleApply(job: AvailableOrder) {
    setApplying(job.orderId);
    try {
      const riderId = await SecureStore.getItemAsync('account_id');
      if (!riderId) throw new Error('Not logged in');
      await riderApi.applyForOrder(riderId, job.orderId);
      Alert.alert(
        'Applied! 🏍️',
        'The customer will review your application. Once accepted, the job appears on your Route tab.',
        [
          {
            text: 'View route',
            onPress: () =>
              router.push({
                pathname: '/(root)/(rider)/(tabs)/route' as any,
                params: {
                  orderId: job.orderId,
                  orderNumber: job.orderNumber,
                  businessName: job.businessName,
                  businessAddress: job.deliveryAddress,
                  businessLat: String(job.deliveryLat ?? ''),
                  businessLng: String(job.deliveryLng ?? ''),
                  customerAddress: job.pickupAddress,
                  customerLat: String(job.pickupLat ?? ''),
                  customerLng: String(job.pickupLng ?? ''),
                  estimatedPay: String(job.deliveryFee ?? '0'),
                },
              }),
          },
          { text: 'OK' },
        ]
      );
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setApplying(null);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View>
          <Text className="text-sm text-slate-500">Available jobs</Text>
          <Text className="text-2xl font-extrabold text-slate-900">Job Board</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(root)/(rider)/(tabs)/earnings' as any)}
          className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center"
        >
          <MaterialCommunityIcons name="wallet-outline" size={22} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-5 mt-2 mb-8">
          {loading ? (
            <ActivityIndicator color="#2563EB" />
          ) : error ? (
            <Text className="text-red-500 text-sm">{error}</Text>
          ) : (jobs ?? []).length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
              <MaterialCommunityIcons name="moped-outline" size={32} color="#cbd5e1" />
              <Text className="text-slate-400 text-sm mt-2">No available orders right now</Text>
              <Text className="text-slate-300 text-xs mt-1">Pull down to refresh</Text>
            </View>
          ) : (
            (jobs ?? []).map((job: AvailableOrder) => {
              const distanceKm = distances[job.orderId] ?? 0;
              const pay = Number(job.deliveryFee ?? 0);
              return (
                <View key={job.orderId} className="bg-white rounded-2xl p-4 mb-3 border border-slate-100">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center">
                      <MaterialCommunityIcons name="washing-machine" size={24} color="#2563EB" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-bold text-slate-900">{job.businessName}</Text>
                        {distanceKm > 0 && (
                          <Text className="text-blue-600 text-sm font-bold">{distanceKm} km</Text>
                        )}
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="location-outline" size={12} color="#94a3b8" />
                        <Text className="text-xs text-slate-400" numberOfLines={1}>{job.deliveryAddress}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2 mb-3">
                    <Ionicons name="person-outline" size={14} color="#94a3b8" />
                    <Text className="text-sm text-slate-500" numberOfLines={1}>{job.pickupAddress}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleApply(job)}
                    disabled={applying === job.orderId}
                    className={`flex-row rounded-xl py-3 items-center justify-between px-4 ${applying === job.orderId ? 'bg-blue-300' : 'bg-blue-600'}`}
                  >
                    {applying === job.orderId
                      ? <ActivityIndicator color="#fff" />
                      : <>
                        <Text className="text-white font-bold">Apply for Job</Text>
                        <View className="bg-blue-700 rounded-lg px-3 py-1">
                          <Text className="text-white font-bold text-sm">GHS {pay.toFixed(2)}</Text>
                        </View>
                      </>}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
