import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { businessApi, UserInfo } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';

export default function BusinessClients() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadClients = useCallback(async () => {
    try {
      const accountId = await SecureStore.getItemAsync('account_id');
      if (!accountId) return;
      const response = await businessApi.getUsersByPurchased(accountId);
      setUsers(response);
    } catch (error) {
      console.log('Error loading clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        (u.city ?? '').toLowerCase().includes(q) ||
        (u.address ?? '').toLowerCase().includes(q))
    : users;

  const initialsOf = (u: UserInfo) =>
    `${(u.firstName?.[0] ?? '')}${(u.lastName?.[0] ?? '')}`.toUpperCase() || '?';

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
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="account-group-outline" size={22} color="#2563EB" />
          <Text className="text-xl font-extrabold text-blue-600">Customers</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text className="text-2xl font-extrabold text-slate-900 mb-1">My Customers</Text>
        <Text className="text-slate-500 text-sm mb-5">
          Customers who have ordered from your laundry.
        </Text>

        {/* Search */}
        <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-100">
          <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 gap-3">
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              placeholder="Search by name or city..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              className="flex-1 text-sm text-slate-700"
            />
          </View>
        </View>

        {filtered.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center border border-slate-100 mb-8">
            <MaterialCommunityIcons name="account-off-outline" size={36} color="#cbd5e1" />
            <Text className="text-slate-400 text-sm mt-2">
              {q ? 'No customers match your search' : 'No customers yet'}
            </Text>
          </View>
        ) : (
          filtered.map((client, i) => (
            <View
              key={client.id ?? i}
              className="bg-white rounded-2xl p-5 mb-4 border border-slate-100"
              style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}
            >
              <View className="flex-row items-center gap-4">
                <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
                  <Text className="text-blue-600 font-bold text-lg">{initialsOf(client)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900">
                    {client.firstName} {client.lastName}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="location-outline" size={13} color="#94a3b8" />
                    <Text className="text-sm text-slate-400" numberOfLines={1}>
                      {[client.address, client.city].filter(Boolean).join(', ') || 'No address'}
                    </Text>
                  </View>
                  {client.phone ? (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Ionicons name="call-outline" size={13} color="#94a3b8" />
                      <Text className="text-sm text-slate-400">{client.phone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
