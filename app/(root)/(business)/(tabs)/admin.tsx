import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { businessApi, BusinessInfo } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { clearAuth } from '@/utils/tokenStoreage';

import BackHeader from '@/components/BackHeader';
import BusinessProfileForm from '@/components/ProfileForm';

type Page = 'main' | 'profile';

export default function BusinessAdmin() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [page, setPage] = useState<Page>('main');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BusinessInfo | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('account_id').then(id => setAccountId(id));
  }, []);

  const loadProfile = useCallback(async () => {
    if (!accountId) return;
    try {
      const biz = await businessApi.getBusinessInfo(accountId);
      setProfile(biz ?? null);
    } catch (e: any) {
      console.log('Admin load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
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
  };

  // ─── Profile / update page ──────────────────────────────────
  if (page === 'profile') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <BackHeader title="Business Profile" onBack={() => setPage('main')} />
        <BusinessProfileForm accountId={accountId!} profile={profile} onUpdate={loadProfile} />
      </SafeAreaView>
    );
  }

  // ─── Main page — current account info only ──────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="washing-machine" size={22} color="#2563EB" />
          <Text className="text-xl font-extrabold text-blue-600">Account</Text>
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-5">
          {/* Current account info */}
          <View className="bg-white rounded-2xl p-5 mb-4 border border-slate-100">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-2xl bg-blue-50 items-center justify-center mb-3">
                <MaterialCommunityIcons name="storefront-outline" size={28} color="#2563EB" />
              </View>
              <Text className="text-xl font-extrabold text-slate-900">
                {profile?.businessName || 'Your Business'}
              </Text>
              {profile?.description && (
                <Text className="text-sm text-slate-500 mt-1 text-center">{profile.description}</Text>
              )}
            </View>

            <View className="bg-slate-100 rounded-xl p-3 mb-3">
              <Text className="text-xs text-slate-400 mb-0.5">Business ID</Text>
              <Text className="text-sm font-mono text-slate-600">{accountId}</Text>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="location-outline" size={18} color="#94a3b8" />
                <Text className="text-sm text-slate-700 flex-1">
                  {profile?.address ? `${profile.address}, ${profile.city}` : 'No address set'}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Ionicons name="time-outline" size={18} color="#94a3b8" />
                <Text className="text-sm text-slate-700 flex-1">
                  {profile?.openingTime && profile?.closingTime
                    ? `${profile.openingTime} – ${profile.closingTime}`
                    : 'Hours not set'}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className={`w-2 h-2 rounded-full ${profile?.isOpen ? 'bg-green-500' : 'bg-slate-300'}`} />
                <Text className="text-sm text-slate-700 flex-1">
                  {profile?.isOpen ? 'Currently open' : 'Currently closed'}
                </Text>
              </View>
            </View>
          </View>

          {/* Touchable to open the update form */}
          <TouchableOpacity
            onPress={() => setPage('profile')}
            className="bg-blue-600 rounded-2xl p-4 flex-row items-center justify-between mb-4"
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text className="text-white font-bold">Edit Business Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>

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