import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { riderApi, AvailableOrder, ApiError } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import * as SecureStore from 'expo-secure-store';
import { calculateTotalDistance } from '@/lib/map';
import { useLocalSearchParams } from 'expo-router';

export default async function RiderJobs() {
  const [online, setOnline] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: jobs, loading, error, refetch } = useApi(
    () => riderApi.getAvailableOrders(), []
  );

  async function handleApply(orderId: string) {
    setApplying(orderId);
    try {
      const riderId = await SecureStore.getItemAsync('account_id');
      if (!riderId) throw new Error('Not logged in');
      await riderApi.applyForOrder(riderId, orderId);
      Alert.alert('Success', 'You have applied for this job!');
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setApplying(null);
    }
  }
 const params = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
    businessName?: string;
    businessAddress?: string;
    businessLat?: string;
    businessLng?: string;
    customerAddress?: string;
    customerLat?: string;
    customerLng?: string;
    estimatedPay?: string;
  }>();
  
const distance = await calculateTotalDistance({
  userLatitude: parseFloat(params.customerLat || '0'),
  userLongitude: parseFloat(params.customerLng || '0'),
  destinationLatitude: parseFloat(params.businessLat || '0'),
  destinationLongitude: parseFloat(params.businessLng || '0'),
});

const distanceEarning = distance.distanceInKm * 0.5; // $0.5 per km

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white font-bold text-sm">JD</Text>
          </View>
          <Text className="text-xl font-extrabold text-blue-600">FreshDash Rider</Text>
        </View>
        <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#0f172a" /></TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Online toggle */}
        <View className="mx-5 mb-4 bg-white rounded-2xl p-4 flex-row items-center justify-between border border-slate-100">
          <View>
            <Text className="text-sm text-slate-500">Service Status</Text>
            <Text className="font-bold text-blue-600">{online ? 'You are Online' : 'You are Offline'}</Text>
          </View>
          <Switch value={online} onValueChange={setOnline} trackColor={{ true: '#2563EB' }} />
        </View>

        {/* Earnings */}
        <View className="mx-5 mb-4 bg-blue-600 rounded-2xl p-5">
          <Text className="text-blue-200 text-xs font-semibold uppercase mb-1">Today's Earnings</Text>
          <Text className="text-white text-4xl font-extrabold mb-2">GHS 125.00</Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-blue-200 text-sm">Total Jobs</Text>
              <Text className="text-white font-bold">8 Deliveries</Text>
            </View>
            <TouchableOpacity className="bg-white/20 rounded-xl px-4 py-2">
              <Text className="text-white text-sm font-semibold">View Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        {[
          { icon: 'timer-outline', label: 'Active Time', value: '4h 22m' },
          { icon: 'star-outline', label: 'Rider Rating', value: '4.9/5.0' },
        ].map((s, i) => (
          <TouchableOpacity key={i} className="mx-5 mb-3 bg-white rounded-2xl p-4 flex-row items-center gap-4 border border-slate-100">
            <Ionicons name={s.icon as any} size={22} color="#94a3b8" />
            <View className="flex-1">
              <Text className="text-sm text-slate-500">{s.label}</Text>
              <Text className="font-bold text-slate-900">{s.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ))}

        {/* Available Jobs from API */}
        <View className="px-5 mt-2 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-slate-900">Available Orders</Text>
            {jobs && (
              <View className="bg-blue-600 rounded-full px-3 py-1">
                <Text className="text-white text-xs font-bold">{jobs.length} New</Text>
              </View>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color="#2563EB" />
          ) : error ? (
            <Text className="text-red-500 text-sm">{error}</Text>
          ) : (jobs ?? []).length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
              <MaterialCommunityIcons name="moped-outline" size={32} color="#cbd5e1" />
              <Text className="text-slate-400 text-sm mt-2">No available orders right now</Text>
            </View>
          ) : (
            (jobs ?? []).map((job: AvailableOrder) => (
              <View key={job.orderId} className="bg-white rounded-2xl p-4 mb-3 border border-slate-100">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center">
                    <MaterialCommunityIcons name="washing-machine" size={24} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-bold text-slate-900">{job.businessName}</Text>
                      {distance.distanceInKm > 0 && (
                        <Text className="text-blue-600 text-sm font-bold">{distance.distanceInKm} km away</Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="location-outline" size={12} color="#94a3b8" />
                      <Text className="text-xs text-slate-400">{job.deliveryAddress}</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="person-outline" size={14} color="#94a3b8" />
                  <Text className="text-sm text-slate-500">{job.pickupAddress}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleApply(job.orderId)}
                  disabled={applying === job.orderId}
                  className={`flex-row rounded-xl py-3 items-center justify-between px-4 ${applying === job.orderId ? 'bg-blue-300' : 'bg-blue-600'}`}
                >
                  {applying === job.orderId
                    ? <ActivityIndicator color="#fff" />
                    : <>
                      <Text className="text-white font-bold">Accept Job</Text>
                      <View className="bg-blue-700 rounded-lg px-3 py-1">
                        <Text className="text-white font-bold text-sm">GHS {distanceEarning.toFixed(2)}</Text>
                      </View>
                    </>}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}