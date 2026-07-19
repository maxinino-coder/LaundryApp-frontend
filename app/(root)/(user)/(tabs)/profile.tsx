import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { userApi, UserInfo } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';
import { clearAuth } from '@/utils/tokenStoreage';

export default function UserProfile() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
     const [accountId, setAccountId] = useState<string | null>(null);
       const [refreshing, setRefreshing] = useState(false);

   React.useEffect(() => {
    SecureStore.getItemAsync('account_id').then(setAccountId);
  }, []);


    const fetchProfile = async () => {
    try {
      setLoading(true);
         if (!accountId) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      router.replace('/(auth)/sign-in');
      return;
    }
      const data = await userApi.getUserById(accountId);
      setUser(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
    const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [accountId]);

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/sign-in' as any);
        },
      },
    ]);
  }

  const MENU = [
    { icon: 'person-outline', label: 'Account Info', subtitle: 'Name, email, phone' },
    { icon: 'location-outline', label: 'Saved Addresses', subtitle: 'Home, work, other' },
    { icon: 'notifications-outline', label: 'Notifications', subtitle: 'Push, email preferences' },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Security', subtitle: 'Password, data' },
    { icon: 'help-circle-outline', label: 'Help & Support', subtitle: 'FAQs, contact us' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
     <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-5 pt-4 pb-3">
          <Text className="text-2xl font-extrabold text-slate-900">Profile</Text>
        </View>

        {/* Avatar */}
        <View className="items-center py-6">
          <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-3 border-4 border-blue-600">
            <Ionicons name="person" size={40} color="#2563EB" />
          </View>
          <Text className="text-xl font-extrabold text-slate-900">
            {user ? `${user.firstName} ${user.lastName}` : 'Alex Johnson'}
          </Text>
          <Text className="text-slate-400 text-sm mt-0.5">
            {user?.email ?? 'alex@example.com'}
          </Text>
        </View>

        {/* Menu */}
        <View className="px-5 gap-3 mb-5">
          {MENU.map((item, i) => (
            <TouchableOpacity
              key={i}
              className="bg-white rounded-2xl p-4 flex-row items-center gap-4 border border-slate-100"
            >
              <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
                <Ionicons name={item.icon as any} size={20} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900">{item.label}</Text>
                <Text className="text-xs text-slate-400">{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-5 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 rounded-2xl py-4 flex-row items-center justify-center gap-3"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 font-bold">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}