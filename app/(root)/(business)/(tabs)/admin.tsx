import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { businessApi } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { clearAuth } from '@/utils/tokenStoreage';
import { OrderStatus } from '@/types/type';

// ─── Import Components ──────────────────────────────────────
import BackHeader from '@/components/BackHeader';
import SettingsList from '@/components/SettingsList';
import EarningsCard from '@/components/EarningsCard';
import RecentCustomers from '@/components/RecentCustomers';
import ProfileForm from '@/components/ProfileForm';
import PaymentDetailsForm from '@/components/PaymentDetailsForm';
import ServiceForm from '@/components/ServiceForm';
import PayoutHistory from '@/components/PayoutHistory';
import StatsKPI from '@/components/StatsKPI';
import NotificationToggle from '@/components/NotificationToggle';

type SettingsPage =
  | 'main'
  | 'profile'
  | 'notifications'
  | 'payout'
  | 'staff'
  | 'analytics'
  | 'security'
  | 'services';

const SETTINGS_ITEMS = [
  { key: 'profile', icon: 'storefront-outline', label: 'Business Profile', subtitle: 'Name, address, hours' },
  { key: 'services', icon: 'list-outline', label: 'Service Items', subtitle: 'Manage your catalog' },
  { key: 'notifications', icon: 'notifications-outline', label: 'Notifications', subtitle: 'Push, email, SMS' },
  { key: 'payout', icon: 'card-outline', label: 'Payout & Earnings', subtitle: 'Bank, MoMo, history' },
  { key: 'staff', icon: 'people-outline', label: 'Staff Management', subtitle: 'Manage your team' },
  { key: 'analytics', icon: 'bar-chart-outline', label: 'Analytics', subtitle: 'Revenue, performance' },
  { key: 'security', icon: 'shield-checkmark-outline', label: 'Security', subtitle: 'Password, 2FA' },
] as const;

const NOTIFICATION_ITEMS = [
  { label: 'Push Notifications', sub: 'New orders, status updates', defaultEnabled: true },
  { label: 'Email Alerts', sub: 'Daily summaries, payouts', defaultEnabled: true },
  { label: 'SMS Alerts', sub: 'Critical alerts only', defaultEnabled: false },
];

export default function BusinessAdmin() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [page, setPage] = useState<SettingsPage>('main');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data state
  const [customers, setCustomers] = useState<any[]>([]);
  const [payout, setPayout] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    SecureStore.getItemAsync('account_id').then(id => setAccountId(id));
  }, []);

  const loadAll = useCallback(async () => {
    if (!accountId) return;
    try {
      const [c, p, o] = await Promise.all([
        businessApi.getUsersByPurchased(accountId),
        businessApi.getBusinessPayout(accountId),
        businessApi.getOrders(accountId),
      ]);
      setCustomers(c ?? []);
      setPayout(p ?? null);
      setOrders(o ?? []);
    } catch (e: any) {
      console.log('Admin load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
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

  // ─── SUB-PAGES ─────────────────────────────────────────────

  // Profile Page
  if (page === 'profile') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <BackHeader title="Business Profile" onBack={() => setPage('main')} />
        <ProfileForm accountId={accountId!} profile={profile} onUpdate={loadAll} />
      </SafeAreaView>
    );
  }

  // Payout Page
  if (page === 'payout') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <BackHeader title="Payout Settings" onBack={() => setPage('main')} />
        <ScrollView className="flex-1 px-5 pt-5">
          {/* Earnings summary */}
          {payout ? (
            <View className="bg-blue-600 rounded-2xl p-5 mb-5">
              <Text className="text-blue-200 text-sm mb-1">Total Net Payout</Text>
              <Text className="text-white text-4xl font-extrabold mb-3">
                GHS {payout.totalNetPayout?.toFixed(2) ?? '0.00'}
              </Text>
              <View className="flex-row gap-4">
                {[
                  { label: 'Revenue', value: payout.totalRevenue },
                  { label: 'Commission', value: payout.totalCommission },
                  { label: 'Rider Fees', value: payout.totalRiderFee },
                ].map((s, i) => (
                  <View key={i} className="flex-1 bg-white/10 rounded-xl p-3">
                    <Text className="text-blue-200 text-xs mb-1">{s.label}</Text>
                    <Text className="text-white font-bold text-sm">GHS {s.value?.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <ActivityIndicator color="#2563EB" style={{ marginVertical: 20 }} />
          )}

          <Text className="text-lg font-bold text-slate-900 mb-3">Payout History</Text>
          <PayoutHistory payouts={payout?.payouts} />

          <Text className="text-lg font-bold text-slate-900 mt-4 mb-3">Payment Details</Text>
          <PaymentDetailsForm accountId={accountId!} profile={{}} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Analytics Page
  if (page === 'analytics') {
    const delivered = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const cancelled = orders.filter(o => o.status === OrderStatus.CANCELLED);
    const totalRev = delivered.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
    const avgOrder = delivered.length ? totalRev / delivered.length : 0;

    const stats = [
      { label: 'Total Orders', value: String(orders.length), color: '#dbeafe' },
      { label: 'Completed', value: String(delivered.length), color: '#dcfce7' },
      { label: 'Cancelled', value: String(cancelled.length), color: '#fee2e2' },
      { label: 'Customers', value: String(customers.length), color: '#fef3c7' },
    ];

    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <BackHeader title="Analytics" onBack={() => setPage('main')} />
        <ScrollView className="flex-1 px-5 pt-5">
          <StatsKPI stats={stats} />

          <View className="bg-blue-600 rounded-2xl p-5 mb-5">
            <Text className="text-blue-200 text-sm mb-1">Total Revenue</Text>
            <Text className="text-white text-4xl font-extrabold">GHS {totalRev.toFixed(2)}</Text>
            <Text className="text-blue-200 text-sm mt-2">Avg order: GHS {avgOrder.toFixed(2)}</Text>
          </View>

          {payout && (
            <View className="bg-white rounded-2xl p-5 mb-5 border border-slate-100">
              <Text className="text-slate-500 text-sm mb-1">Net Payout (after fees)</Text>
              <Text className="text-slate-900 text-3xl font-extrabold">
                GHS {payout.totalNetPayout?.toFixed(2)}
              </Text>
              <View className="h-px bg-slate-100 my-3" />
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-sm">Pending payouts</Text>
                <Text className="font-bold text-orange-600">{payout.pendingCount}</Text>
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-slate-400 text-sm">Settled payouts</Text>
                <Text className="font-bold text-green-600">{payout.settledCount}</Text>
              </View>
            </View>
          )}

          <Text className="text-lg font-bold text-slate-900 mb-3">Recent Customers</Text>
          <RecentCustomers customers={customers} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Services Page
  if (page === 'services') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <BackHeader title="Service Items" onBack={() => setPage('main')} />
        <ScrollView className="flex-1 px-5 pt-5">
          <ServiceForm accountId={accountId!} onSuccess={loadAll} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Notifications Page
  if (page === 'notifications') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <BackHeader title="Notifications" onBack={() => setPage('main')} />
        <ScrollView className="flex-1 px-5 pt-5">
          <NotificationToggle items={NOTIFICATION_ITEMS} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Security Page
  if (page === 'security') {
    // ... keep existing security page code (unchanged)
  }

  // Staff Page
  if (page === 'staff') {
    // ... keep existing staff page code (unchanged)
  }

  // ─── MAIN PAGE ─────────────────────────────────────────────

  const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING).length;
  const deliveredCount = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
  const totalRevenue = orders
    .filter(o => o.status === OrderStatus.DELIVERED)
    .reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="washing-machine" size={22} color="#2563EB" />
          <Text className="text-xl font-extrabold text-blue-600">Admin</Text>
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <EarningsCard
          loading={loading}
          totalEarnings={payout?.totalNetPayout ?? totalRevenue}
          ordersCount={orders.length}
          deliveredCount={deliveredCount}
          pendingCount={pendingCount}
          customersCount={customers.length}
        />

        <View className="px-5 mb-5">
          <Text className="text-lg font-bold text-slate-900 mb-3">Recent Customers</Text>
          <RecentCustomers customers={customers} />
        </View>

        <View className="px-5 mb-5">
          <Text className="text-lg font-bold text-slate-900 mb-3">Settings</Text>
          <SettingsList items={SETTINGS_ITEMS as any} onPress={(key) => setPage(key as SettingsPage)} />
        </View>

        <View className="px-5 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 rounded-2xl py-4 flex-row items-center justify-center gap-3"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-500 font-bold">Logout</Text>
          </TouchableOpacity>
          <Text className="text-center text-slate-400 text-xs mt-4">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}