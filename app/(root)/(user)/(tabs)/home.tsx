import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, FlatList, ActivityIndicator, RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { userApi, BusinessInfo, Order, UserInfo } from '@/lib/api';
import { OrderStatus } from '@/types/type';
import { useApi } from '@/hooks/useApi';
import { useUserLocation } from '@/hooks/useUserLocation';
import * as SecureStore from 'expo-secure-store';

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.ACCEPTED,
  OrderStatus.PICKED_UP, OrderStatus.IN_PROGRESS, OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
];

export default function UserHome() {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountIdLoaded, setAccountIdLoaded] = useState(false);

  useUserLocation(); // populate the location store for maps/distances

  useEffect(() => {
    SecureStore.getItemAsync('account_id').then((id) => {
      setAccountId(id);
      setAccountIdLoaded(true);
    });
  }, []);

  const fetchProfile = async () => {
    try {
      if (!accountId) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        router.replace('/(auth)/sign-in');
        return;
      }
      const data = await userApi.getUserById(accountId);
      setUser(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!accountIdLoaded) return; // wait for the SecureStore read to finish
    fetchProfile();
  }, [accountId, accountIdLoaded]);

  const { data: businesses, loading: bLoading, error: bError, refetch: refetchB } =
    useApi(() => userApi.getBusinesses(search || undefined), [search]);

  const { data: orders, loading: oLoading, refetch: refetchO } =
    useApi<Order[]>(() =>
      SecureStore.getItemAsync('account_id').then(id =>
        id ? userApi.getOrdersByUserId(id) : Promise.resolve([] as Order[])
      ), []);

  const activeOrders = (orders ?? []).filter(o => ACTIVE_STATUSES.includes(o.status));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchB(), refetchO(), fetchProfile()]);
    setRefreshing(false);
  };

  const handleSearch = () => refetchB();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-full bg-blue-600 items-center justify-center">
              <Ionicons name="person" size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-sm text-slate-500">Welcome back,</Text>
              <Text className="text-lg font-bold text-slate-900">{user?.firstName || 'Customer'} 👋</Text>
            </View>
          </View>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.push('/(root)/(user)/(tabs)/orders' as any)}
          >
            <Ionicons name="receipt-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="mx-5 mb-4 flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-slate-100 rounded-2xl px-4 py-3 gap-3">
            <Ionicons name="search-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder="Find a laundry service..."
              placeholderTextColor="#94a3b8"
              className="flex-1 text-slate-700 text-sm"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            onPress={handleSearch}
            className="bg-blue-600 rounded-2xl px-4 items-center justify-center"
          >
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Promo */}
        <View className="mx-5 mb-6 rounded-2xl bg-blue-600 h-44 justify-center px-6">
          <Text className="text-white text-2xl font-extrabold mb-1">30% off your{'\n'}first wash</Text>
          <Text className="text-blue-200 text-sm mb-4">Use code: FRESH30</Text>
          <TouchableOpacity
            className="bg-white rounded-xl px-5 py-2.5 self-start"
            onPress={() => {
              const first = (businesses ?? [])[0];
              if (first) {
                router.push(`/(root)/(user)/business/${first.id}` as any);
              }
            }}
          >
            <Text className="text-blue-600 font-bold text-sm">Book Now</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Businesses */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="text-lg font-bold text-slate-900">Nearby Businesses</Text>
            <TouchableOpacity onPress={() => { setSearch(''); refetchB(); }}>
              <Text className="text-blue-600 text-sm font-semibold">See All</Text>
            </TouchableOpacity>
          </View>

          {bLoading ? (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginLeft: 20 }} />
          ) : bError ? (
            <Text className="text-red-500 text-sm px-5">{bError}</Text>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={businesses ?? []}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text className="text-slate-400 text-sm">No businesses found</Text>
              }
              renderItem={({ item }: { item: BusinessInfo }) => (
                <TouchableOpacity
                  className="w-40 bg-white rounded-2xl p-4 border border-slate-100"
                  style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}
                  onPress={() =>
                    router.push({
                      pathname: '/(root)/(user)/business/[id]' as any,
                      params: {
                        id: item.id,
                        name: item.businessName,
                        address: item.address ?? '',
                        city: item.city ?? '',
                      },
                    })
                  }
                >
                  <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center mb-3">
                    <MaterialCommunityIcons name="washing-machine" size={24} color="#2563EB" />
                  </View>
                  <Text className="font-bold text-slate-900 mb-0.5">{item.businessName}</Text>
                  <Text className="text-xs text-slate-500 mb-2" numberOfLines={1}>
                    {item.address || item.city || ''}
                  </Text>
                  <View className="rounded-lg px-2 py-1 self-start bg-green-50">
                    <Text className="text-xs font-bold text-green-600">ORDER NOW</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* Active Orders */}
        <View className="px-5 mb-8">
          <Text className="text-lg font-bold text-slate-900 mb-3">Your Active Orders</Text>
          {oLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : activeOrders.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-slate-100">
              <MaterialCommunityIcons name="package-variant-closed" size={32} color="#cbd5e1" />
              <Text className="text-slate-400 text-sm mt-2">No active orders yet</Text>
            </View>
          ) : (
            activeOrders.map((order) => (
              <TouchableOpacity
                key={order.orderId}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 flex-row items-center gap-4"
                onPress={() =>
                  router.push({
                    pathname: '/(root)/(user)/order/[orderId]' as any,
                    params: { orderId: order.orderId },
                  })
                }
              >
                <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center">
                  <MaterialCommunityIcons name="washing-machine" size={24} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-bold text-slate-900 text-sm">{order.orderNumber || 'Order'}</Text>
                    <View className="px-2 py-1 rounded-lg bg-blue-50">
                      <Text className="text-xs font-bold text-blue-600">{order.status}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-500">
                    GHS {order.totalAmount?.toFixed?.(2) ?? order.totalAmount}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
