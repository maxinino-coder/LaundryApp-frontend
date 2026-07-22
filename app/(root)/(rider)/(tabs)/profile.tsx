import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { riderApi } from '@/lib/api';
import { RiderInfo } from '@/types/type';
import * as SecureStore from 'expo-secure-store';
import { clearAuth } from '@/utils/tokenStoreage';
import FormInput from '@/components/FormInput';

const MENU_ITEMS = [
  { key: 'vehicle', icon: 'moped-outline', label: 'Vehicle Info' },
  { key: 'payment', icon: 'wallet-outline', label: 'Payout Settings' },
  { key: 'earnings', icon: 'cash-multiple', label: 'My Earnings' },
  { key: 'settings', icon: 'cog-outline', label: 'Help & Support' },
];

export default function RiderProfile() {
  const [profile, setProfile] = useState<RiderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountIdLoaded, setAccountIdLoaded] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Editable fields only. Excluded on purpose:
  //   id            → immutable
  //   isVerified    → backend/admin-controlled, not user-editable
  //   currentLat/currentLng → system-set from live location, not user-editable
  const [form, setForm] = useState<Partial<RiderInfo>>({});

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
        Alert.alert('Error', 'Rider not authenticated. Please log in again.');
        router.replace('/(auth)/sign-in');
        return;
      }
      const data = await riderApi.getProfile(accountId);
      setProfile(data);
      setForm({
        firstName: data.firstName,
        lastName: data.lastName,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        momoNumber: data.momoNumber,
        isAvailable: data.isAvailable,
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

  function update<K extends keyof RiderInfo>(key: K, value: RiderInfo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!accountId) return;
    setSaving(true);
    try {
      await riderApi.updateRiderInfo(accountId, form);
      Alert.alert('Saved', 'Your profile has been updated.');
      setEditing(false);
      fetchProfile();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const handleMenuItemPress = (key: string) => {
    switch (key) {
      case 'vehicle':
      case 'payment':
        setEditing(true);
        break;
      case 'earnings':
        router.push('/(root)/(rider)/(tabs)/earnings' as any);
        break;
      case 'settings':
        Alert.alert('Support', 'Email us at support@laundrygo.app');
        break;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-slate-500">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-slate-500">Failed to load profile</Text>
        <TouchableOpacity className="mt-4 bg-blue-600 rounded-xl px-6 py-3" onPress={fetchProfile}>
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
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
          <FormInput label="Vehicle Plate" value={form.vehiclePlate ?? ''} onChangeText={(v) => update('vehiclePlate', v)} autoCapitalize="characters" />
          <FormInput label="Mobile Money Number" value={form.momoNumber ?? ''} onChangeText={(v) => update('momoNumber', v)} keyboardType="phone-pad" />

          <View className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-4 border border-slate-100">
            <Text className="font-bold text-slate-900">Available for jobs</Text>
            <Switch
              value={!!form.isAvailable}
              onValueChange={(v) => update('isAvailable', v)}
              trackColor={{ true: '#2563EB' }}
            />
          </View>

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
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white font-bold text-sm">
              {profile.firstName?.[0]}{profile.lastName?.[0] || ''}
            </Text>
          </View>
          <Text className="text-xl font-extrabold text-blue-600">FreshDash Rider</Text>
        </View>
        <TouchableOpacity onPress={() => setEditing(true)}>
          <Ionicons name="create-outline" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="items-center py-6">
          <View className="relative mb-3">
            <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center border-4 border-blue-600">
              <Text className="text-3xl font-bold text-blue-600">
                {profile.firstName?.[0]}{profile.lastName?.[0] || ''}
              </Text>
            </View>
            <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 items-center justify-center border-2 border-white">
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
            </View>
          </View>
          <Text className="text-2xl font-extrabold text-slate-900">
            {profile.firstName} {profile.lastName}
          </Text>
          {profile.isAvailable && (
            <View className="mt-2 bg-green-50 rounded-full px-3 py-1 flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-green-500" />
              <Text className="text-green-600 text-xs font-bold">ONLINE</Text>
            </View>
          )}
        </View>

        <View className="px-5 gap-3 mb-5">
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              className="bg-white rounded-2xl p-4 flex-row items-center gap-4 border border-slate-100"
              onPress={() => handleMenuItemPress(item.key)}
            >
              <View className="w-11 h-11 rounded-xl bg-blue-50 items-center justify-center">
                <MaterialCommunityIcons name={item.icon as any} size={22} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-slate-400 mb-0.5">{item.label}</Text>
                {item.key === 'vehicle' && (
                  <Text className="font-bold text-slate-900">{profile.vehicleType} — {profile.vehiclePlate || 'N/A'}</Text>
                )}
                {item.key === 'payment' && (
                  <Text className="font-bold text-slate-900">Momo: {profile.momoNumber || 'Not set'}</Text>
                )}
                {item.key === 'earnings' && (
                  <Text className="font-bold text-slate-900">Payouts & delivery history</Text>
                )}
                {item.key === 'settings' && (
                  <Text className="font-bold text-slate-900">FAQs & contact us</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        <View className="px-5 mb-4">
          <TouchableOpacity
            className="bg-slate-100 rounded-2xl py-4 flex-row items-center justify-center gap-3"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 font-bold text-base">Logout</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-slate-400 text-xs mb-8">Version 2.4.1 (CleanBuild)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}