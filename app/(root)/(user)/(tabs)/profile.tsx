import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { userApi, UserInfo } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';
import { clearAuth } from '@/utils/tokenStoreage';
import FormInput from '@/components/FormInput';

export default function UserProfile() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountIdLoaded, setAccountIdLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Excluded on purpose: id (immutable), latitude/longitude (system-set)
  const [form, setForm] = useState<Partial<UserInfo>>({});

  useEffect(() => {
    SecureStore.getItemAsync('account_id').then((id) => {
      setAccountId(id);
      setAccountIdLoaded(true);
    });
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
      setForm({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
      });
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
    if (!accountIdLoaded) return;
    fetchProfile();
  }, [accountId, accountIdLoaded]);

  function update<K extends keyof UserInfo>(key: K, value: UserInfo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!accountId) return;
    setSaving(true);
    try {
      await userApi.updateUserInfo(accountId, form);
      Alert.alert('Saved', 'Your profile has been updated.');
      setEditing(false);
      fetchProfile();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

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
    {
      icon: 'create-outline', label: 'Edit Profile', subtitle: 'Name, contact, address',
      onPress: () => setEditing(true),
    },
    {
      icon: 'receipt-outline', label: 'My Orders', subtitle: 'Track and review orders',
      onPress: () => router.push('/(root)/(user)/(tabs)/orders' as any),
    },
    {
      icon: 'chatbubbles-outline', label: 'Messages', subtitle: 'Chats with riders & laundries',
      onPress: () => router.push('/(root)/(user)/(tabs)/messages' as any),
    },
    {
      icon: 'help-circle-outline', label: 'Help & Support', subtitle: 'FAQs, contact us',
      onPress: () => Alert.alert('Help & Support', 'Email us at support@laundrygo.app'),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (editing) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <TouchableOpacity onPress={() => setEditing(false)} className="p-1 -ml-1">
            <Ionicons name="arrow-back" size={26} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-900 ml-3">Edit Profile</Text>
        </View>
        <ScrollView className="flex-1 px-5 pt-2">
          <FormInput label="First Name" value={form.firstName ?? ''} onChangeText={(v) => update('firstName', v)} autoCapitalize="words" />
          <FormInput label="Last Name" value={form.lastName ?? ''} onChangeText={(v) => update('lastName', v)} autoCapitalize="words" />
          <FormInput label="Email" value={form.email ?? ''} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <FormInput label="Phone Number" value={form.phone ?? ''} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
          <FormInput label="Address" value={form.address ?? ''} onChangeText={(v) => update('address', v)} autoCapitalize="words" />
          <FormInput label="City" value={form.city ?? ''} onChangeText={(v) => update('city', v)} autoCapitalize="words" />

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`h-14 rounded-2xl items-center justify-center my-4 ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Text className="text-2xl font-extrabold text-slate-900">Profile</Text>
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <View className="items-center py-6">
          <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-3 border-4 border-blue-600">
            <Ionicons name="person" size={40} color="#2563EB" />
          </View>
          <Text className="text-xl font-extrabold text-slate-900">
            {user ? `${user.firstName} ${user.lastName}` : ''}
          </Text>
          <Text className="text-slate-400 text-sm mt-0.5">{user?.email ?? ''}</Text>
        </View>

        <View className="px-5 gap-3 mb-5">
          {MENU.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={item.onPress}
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
          <TouchableOpacity onPress={handleLogout} className="bg-red-50 rounded-2xl py-4 flex-row items-center justify-center gap-3">
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 font-bold">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}