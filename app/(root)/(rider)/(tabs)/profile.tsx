import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, 
  RefreshControl, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { riderApi } from '@/lib/api';
import { RiderInfo } from '@/types/type';
import * as SecureStore from 'expo-secure-store';

// Define the menu items with their keys for dynamic data
const MENU_ITEMS = [
  { key: 'vehicle', icon: 'moped-outline', label: 'Vehicle Info' },
  { key: 'payment', icon: 'wallet-outline', label: 'Payout Settings' },
  { key: 'verification', icon: 'clipboard-check-outline', label: 'Document Verification' },
  { key: 'settings', icon: 'cog-outline', label: 'Settings' },
];

export default function RiderProfile() {
  const [profile, setProfile] = useState<RiderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
   const [accountId, setAccountId] = useState<string | null>(null);

   React.useEffect(() => {
    SecureStore.getItemAsync('account_id').then(setAccountId);
  }, []);
  // You'll need to get the actual rider ID from your auth context/state


  const fetchProfile = async () => {
    try {
      setLoading(true);
         if (!accountId) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      router.replace('/(auth)/sign-in');
      return;
    }
      const data = await riderApi.getProfile(accountId);
      setProfile(data);
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

  // Format display values based on profile data
  const getDisplayValue = (key: string) => {
    if (!profile) return 'Loading...';
    
    switch (key) {
      case 'vehicle':
        return `${profile.vehicleType || 'No vehicle'} - ${profile.vehiclePlate || 'N/A'}`;
      case 'payment':
        return `Momo: ${profile.momoNumber || 'Not set'}`;
      case 'verification':
        return profile.isVerified ? 'Verified' : 'Not verified';
      case 'settings':
        return 'App preferences, privacy & security';
      default:
        return '';
    }
  };

  const getBadge = (key: string) => {
    if (!profile) return null;
    
    switch (key) {
      case 'verification':
        return profile.isVerified ? 'VERIFIED' : 'PENDING';
      default:
        return null;
    }
  };

  const getBadgeColor = (key: string) => {
    if (!profile) return 'bg-gray-50';
    
    switch (key) {
      case 'verification':
        return profile.isVerified ? 'bg-green-50' : 'bg-orange-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getBadgeTextColor = (key: string) => {
    if (!profile) return 'text-gray-600';
    
    switch (key) {
      case 'verification':
        return profile.isVerified ? 'text-green-600' : 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => router.replace('/(auth)/sign-in')
        }
      ]
    );
  };

  const handleMenuItemPress = (key: string) => {
    // Navigate to appropriate screens
    switch (key) {
      case 'vehicle':
        // Navigate to vehicle info edit screen
        Alert.alert('Vehicle Info', 'Navigate to vehicle info edit screen');
        break;
      case 'payment':
        // Navigate to payout settings
        Alert.alert('Payout Settings', 'Navigate to payout settings screen');
        break;
      case 'verification':
        // Navigate to verification status
        Alert.alert('Document Verification', 'Navigate to verification screen');
        break;
      case 'settings':
        // Navigate to settings
        Alert.alert('Settings', 'Navigate to settings screen');
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
        <TouchableOpacity 
          className="mt-4 bg-blue-600 rounded-xl px-6 py-3"
          onPress={fetchProfile}
        >
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white font-bold text-sm">
              {profile.firstName?.[0]}{profile.lastName?.[0] || ''}
            </Text>
          </View>
          <Text className="text-xl font-extrabold text-blue-600">FreshDash Rider</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Avatar */}
        <View className="items-center py-6">
          <View className="relative mb-3">
            <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center border-4 border-blue-600">
              {profile.avatar ? (
                // If you have an image component, use it here
                <Ionicons name="person" size={40} className="#2563EB" />
              ) : (
                <Text className="text-3xl font-bold text-blue-600">
                  {profile.firstName?.[0]}{profile.lastName?.[0] || ''}
                </Text>
              )}
            </View>
            <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 items-center justify-center border-2 border-white">
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
            </View>
          </View>
          <Text className="text-2xl font-extrabold text-slate-900">
            {profile.firstName} {profile.lastName}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Ionicons name="star-outline" size={16} color="#2563EB" />
            {/* <Text className="text-blue-600 font-bold">
              {profile.rating?.toFixed(1) || 'N/A'}
            </Text>
            <Text className="text-slate-400 text-sm">
              ({profile.totalReviews || 0} reviews)
            </Text> */}
          </View>
          {profile.isAvailable && (
            <View className="mt-2 bg-green-50 rounded-full px-3 py-1 flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-green-500" />
              <Text className="text-green-600 text-xs font-bold">ONLINE</Text>
            </View>
          )}
        </View>

        {/* Menu items - Now using dynamic data */}
        <View className="px-5 gap-3 mb-5">
          {MENU_ITEMS.map((item) => {
            const value = getDisplayValue(item.key);
            const badge = getBadge(item.key);
            const badgeColor = getBadgeColor(item.key);
            const badgeTextColor = getBadgeTextColor(item.key);
            
            return (
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
                  <View className="flex-row items-center gap-2">
                    <Text className="font-bold text-slate-900">{value}</Text>
                    {badge && (
                      <View className={`${badgeColor} rounded-full px-2 py-0.5`}>
                        <Text className={`${badgeTextColor} text-xs font-bold`}>{badge}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout */}
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