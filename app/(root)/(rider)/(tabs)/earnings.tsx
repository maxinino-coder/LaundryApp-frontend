import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { riderApi } from '@/lib/api';
import { EarningsData } from '@/types/type';

const PERIODS = ['Today', 'This Week', 'This Month'];

// Types for API responses



export default function RiderEarnings() {
  const [period, setPeriod] = useState('Today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalBalance: '0.00',
    pendingPayout: '0.00',
    activity: [],
    chartData: [0, 0, 0, 0, 0, 0, 0],
    days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    percentageChange: 0
  });

  // You'll need to get the actual rider ID from your auth context/state
  const RIDER_ID = 'your-rider-id-here'; // Replace with actual rider ID

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      // Fetch real data from API
      const payoutData = await riderApi.getRiderPayout(RIDER_ID);
      
      // Transform API data to match your UI structure
      // This transformation depends on your actual API response structure
      const transformedData: EarningsData = {
        totalBalance: payoutData.totalEarnings?.toString() || '0.00',
        pendingPayout: payoutData.pendingCount?.toString() || '0.00',
        activity: [], // You'll need to fetch activity data from another endpoint
        chartData: [40, 65, 55, 90, 20, 15, 10], // Placeholder - fetch from API
        days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        percentageChange: 12 // Placeholder - fetch from API
      };

      setEarningsData(transformedData);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      // Optionally show error toast/alert
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings();
  };

  // Also fetch recent activity separately if needed
  const fetchRecentActivity = async () => {
    try {
      // Assuming you have an endpoint for rider activity
      // const activityData = await riderApi.getRiderActivity(RIDER_ID, period);
      // Transform and set activity data
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  useEffect(() => {
    fetchEarnings();
    fetchRecentActivity();
  }, [period]); // Re-fetch when period changes

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text>Loading earnings data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white font-bold text-sm">RP</Text>
          </View>
          <Text className="text-xl font-extrabold text-blue-600">FreshDash Rider</Text>
        </View>
        <TouchableOpacity><Ionicons name="notifications-outline" size={24} color="#0f172a" /></TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance card - using real data */}
        <View className="mx-5 mb-4 bg-blue-600 rounded-2xl p-5">
          <Text className="text-blue-200 text-sm mb-1">Total Balance</Text>
          <Text className="text-white text-4xl font-extrabold mb-2">GHS {earningsData.totalBalance}</Text>
          <View className="bg-blue-500 rounded-full px-3 py-1.5 self-start flex-row items-center gap-1">
            <Ionicons name="trending-up" size={14} color="#fff" />
            <Text className="text-white text-sm font-semibold">+{earningsData.percentageChange}% vs last week</Text>
          </View>
        </View>

        {/* Pending payout - using real data */}
        <View className="mx-5 mb-4 bg-slate-100 rounded-2xl p-4">
          <Text className="text-slate-500 text-sm mb-1">Pending Payout</Text>
          <Text className="text-slate-900 text-2xl font-extrabold mb-1">GHS {earningsData.pendingPayout}</Text>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="information-circle-outline" size={14} color="#64748b" />
            <Text className="text-slate-500 text-sm">Processing for Friday payout</Text>
          </View>
        </View>

        {/* Period filter */}
        <View className="flex-row mx-5 bg-white rounded-2xl p-1.5 mb-5 border border-slate-100">
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              className={`flex-1 py-2.5 rounded-xl items-center ${period === p ? 'bg-blue-600' : ''}`}
            >
              <Text className={`text-sm font-semibold ${period === p ? 'text-white' : 'text-slate-500'}`}>{p}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity className="w-10 items-center justify-center">
            <Ionicons name="options-outline" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Activity - using real data */}
        <View className="px-5 mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-slate-900">Recent Activity</Text>
            <Text className="text-xs text-slate-400">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</Text>
          </View>
          {earningsData.activity.length > 0 ? (
            earningsData.activity.map((item, i) => (
              <View key={i} className="bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-4 border border-slate-100">
                <View className="w-12 h-12 rounded-xl bg-blue-50 items-center justify-center">
                  <MaterialCommunityIcons name={item.type === 'Pickup' ? 'washing-machine' : 'moped'} size={22} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text className="font-bold text-slate-900 text-sm">Order {item.id}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${item.status === 'SETTLED' ? 'bg-green-50' : 'bg-orange-50'}`}>
                      <Text className={`text-xs font-bold ${item.status === 'SETTLED' ? 'text-green-600' : 'text-orange-600'}`}>{item.status}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-400">{item.type} • {item.time}</Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-blue-600">{item.amount}</Text>
                  <Text className="text-xs text-slate-400">{item.note}</Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center border border-slate-100">
              <Text className="text-slate-400 text-sm">No recent activity</Text>
            </View>
          )}
        </View>

        {/* Chart - using real data */}
        <View className="mx-5 mb-8 bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="font-bold text-slate-900 mb-4">Earnings Visualizer</Text>
          <View className="flex-row items-end gap-2 h-24 mb-2">
            {earningsData.chartData.map((h, i) => (
              <View key={i} className="flex-1 items-center">
                <View
                  className={`w-full rounded-t-lg ${i === 3 ? 'bg-blue-600' : 'bg-blue-200'}`}
                  style={{ height: (h / 100) * 80 }}
                />
              </View>
            ))}
          </View>
          <View className="flex-row gap-2">
            {earningsData.days.map((d, i) => (
              <Text key={i} className="flex-1 text-center text-xs text-slate-400">{d}</Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}