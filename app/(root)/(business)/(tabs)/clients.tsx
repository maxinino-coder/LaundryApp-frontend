import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { businessApi, Order, UserInfo } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';

// const CLIENTS = [
//   { id: '1', name: 'Alex Johnson', initials: 'AJ', location: 'San Francisco, CA', orders: 15, lastOrder: 'Oct 24, 2023', status: 'Active' },
//   { id: '2', name: 'Sarah Lee', initials: 'SL', location: 'Oakland, CA', orders: 8, lastOrder: 'Oct 21, 2023', status: 'Active' },
// ];
type Client = Partial<Order & UserInfo>;

export default function BusinessClients() {

  const [users, setUsers] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null); 

    useEffect(() => {
    const getAccountId = async () => {
      try {
        const id = await SecureStore.getItemAsync('account_id');
        setAccountId(id);
      } catch (error) {
        console.log('Error getting account ID:', error);
      }
    };
    getAccountId();
  }, []);

  const loadOrders = async () => {
    if (!accountId) return;
    
    try {
      setLoading(true);
      const response = await businessApi.getUsersByPurchased(accountId);
      setUsers(response);
    } catch (error) {
      console.log('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };
   if (loading && users.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text>Loading users...</Text>
      </SafeAreaView>
    );
  }
  // Helper function to count orders
const getOrderCount = (userId: string) => {
  return users.filter(user => user.userId === userId).length;
};

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
       <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      ></ScrollView>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="washing-machine" size={22} color="#2563EB" />
          <Text className="text-xl font-extrabold text-blue-600">LaundroManager</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity><Ionicons name="notifications-outline" size={22} color="#0f172a" /></TouchableOpacity>
          <View className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center">
            <Ionicons name="person" size={14} color="#64748b" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-extrabold text-slate-900 mb-1">My Customers</Text>
        <Text className="text-slate-500 text-sm mb-5">Manage and track your laundry service clients.</Text>

        <TouchableOpacity className="bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center gap-2 mb-5">
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text className="text-white font-bold">Add New Customer</Text>
        </TouchableOpacity>

        {/* Search & filters */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-100">
          <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 gap-3 mb-3">
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput placeholder="Search by name, phone, or city..." placeholderTextColor="#94a3b8" className="flex-1 text-sm text-slate-700" />
          </View>
          <View className="flex-row gap-3">
            {['Filter', 'Sort'].map((b) => (
              <TouchableOpacity key={b} className="flex-row items-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5">
                <Ionicons name="filter-outline" size={14} color="#64748b" />
                <Text className="text-sm text-slate-600 font-semibold">{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {users.map((client) => (
          <View key={client.id} className="bg-white rounded-2xl p-5 mb-4 border border-slate-100" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}>
            <View className="flex-row items-center gap-4 mb-4">
              <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-blue-600 font-bold text-lg">{client.lastName} {client.firstName}</Text>
              </View>
              <View>
                <Text className="text-lg font-bold text-slate-900">{client.address}</Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="location-outline" size={13} color="#94a3b8" />
                  <Text className="text-sm text-slate-400">{client.email}</Text>
                </View>
              </View>
            </View>
            <View className="flex-row gap-6 mb-4">
              <View>
                <Text className="text-xs text-slate-400 mb-0.5">Total Orders</Text>
                <Text className="font-bold text-slate-900">{getOrderCount(client.userId|| '')} Orders</Text>
              </View>
              <View>
                <Text className="text-xs text-slate-400 mb-0.5">Last Order</Text>
                <Text className="font-bold text-slate-900">{client.createdAt}</Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="bg-green-50 rounded-full px-3 py-1">
                <Text className="text-green-600 text-sm font-semibold">{client.phone}</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity className="absolute bottom-24 right-5 w-14 h-14 bg-blue-600 rounded-full items-center justify-center" style={{ elevation: 4 }}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}