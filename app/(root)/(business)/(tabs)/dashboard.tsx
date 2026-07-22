
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Order, OrderStatus,  } from '@/types/type';
import { businessApi } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';

const STATS = [
  { label: "Today's Orders", value: '12', icon: 'basket-outline', color: '#dbeafe' },
  { label: 'Revenue', value: 'GHS 450', icon: 'cash-multiple', color: '#dcfce7' },
  { label: 'Pending', value: '4', icon: 'timer-outline', color: '#fef3c7' },
  { label: 'Completed', value: '8', icon: 'checkmark-circle-outline', color: '#f0fdf4' },
];

const statusColor: Record<string, string> = {
  'PENDING': 'bg-yellow-100 text-yellow-700',
  'CONFIRMED': 'bg-blue-100 text-blue-700',
  'PICKED_UP': 'bg-purple-100 text-purple-700',
  'IN_PROGRESS': 'bg-indigo-100 text-indigo-700',
  'READY': 'bg-green-100 text-green-700',
  'OUT_FOR_DELIVERY': 'bg-orange-100 text-orange-700',
  'DELIVERED': 'bg-emerald-100 text-emerald-700',
  'CANCELLED': 'bg-red-100 text-red-700',
  'REFUNDED': 'bg-gray-100 text-gray-700',
  'ACCEPTED': 'bg-teal-100 text-teal-700',
};

const statusBadgeColor: Record<string, string> = {
  'PENDING': 'bg-yellow-500',
  'CONFIRMED': 'bg-blue-500',
  'PICKED_UP': 'bg-purple-500',
  'IN_PROGRESS': 'bg-indigo-500',
  'READY': 'bg-green-500',
  'OUT_FOR_DELIVERY': 'bg-orange-500',
  'DELIVERED': 'bg-emerald-500',
  'CANCELLED': 'bg-red-500',
  'REFUNDED': 'bg-gray-500',
  'ACCEPTED': 'bg-teal-500',
};

export default function BusinessDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);


  // Get account ID from storage
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
  },[]);

  const loadOrders = async () => {
    if (!accountId) return;
    
    try {
      setLoading(true);
      const response = await businessApi.getOrders(accountId);
      setOrders(response);
    } catch (error) {
      console.log('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await businessApi.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.log('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const confirmOrder = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.CONFIRMED);
  };

  const acceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.ACCEPTED);
  };

  const cancelOrder = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => updateOrderStatus(orderId, OrderStatus.CANCELLED) }
      ]
    );
  };

  const markAsReady = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.READY);
  };

  const markAsDelivered = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.DELIVERED);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Filter orders by status
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.ACCEPTED);
  const activeOrders = orders.filter(o => 
    o.status === OrderStatus.PICKED_UP || 
    o.status === OrderStatus.IN_PROGRESS || 
    o.status === OrderStatus.READY || 
    o.status === OrderStatus.OUT_FOR_DELIVERY
  );
  const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);

  // Calculate stats
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter(o => o.status === OrderStatus.DELIVERED)
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingCount = pendingOrders.length;
  const completedCount = completedOrders.length;

  const stats = [
    { label: "Today's Orders", value: totalOrders.toString(), icon: 'basket-outline', color: '#dbeafe' },
    { label: 'Revenue', value: `GHS ${totalRevenue.toFixed(2)}`, icon: 'cash-multiple', color: '#dcfce7' },
    { label: 'Pending', value: pendingCount.toString(), icon: 'timer-outline', color: '#fef3c7' },
    { label: 'Completed', value: completedCount.toString(), icon: 'checkmark-circle-outline', color: '#f0fdf4' },
  ];



  useEffect(() => {
    if (accountId) {
      loadOrders();
      const interval = setInterval(loadOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [accountId]);

  // Render order item details
  const renderOrderItems = (order: Order) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      return <Text className="text-xs text-slate-400">No items</Text>;
    }

    return order.orderItems.map((item, idx) => (
      <View key={`${order.orderId}-${idx}`} className="flex-row items-center gap-2">
        <MaterialCommunityIcons name="washing-machine" size={14} color="#64748b" />
        <Text className="text-sm text-slate-600">
          {String(item.serviceCategory || 'Service').replace(/_/g, ' ')} x{item.quantity}
        </Text>
      </View>
    ));
  };

  // Render action buttons based on order status
  const renderActionButtons = (order: Order) => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return (
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity 
              className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
              onPress={() => confirmOrder(order.orderId)}
            >
              <Text className="text-white font-bold">Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 bg-red-500 rounded-xl py-3 items-center"
              onPress={() => cancelOrder(order.orderId)}
            >
              <Text className="text-white font-bold">Reject</Text>
            </TouchableOpacity>
          </View>
        );
      
      case OrderStatus.CONFIRMED:
      case OrderStatus.ACCEPTED:
        return (
          <View className="flex-row gap-3 mt-3">
            <View className="flex-1 bg-slate-100 rounded-xl py-3 items-center">
              <Text className="text-slate-500 font-bold text-xs">Awaiting pickup by rider…</Text>
            </View>
          </View>
        );

      case OrderStatus.PICKED_UP:
      case OrderStatus.IN_PROGRESS:
        return (
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity
              className="flex-1 bg-green-600 rounded-xl py-3 items-center"
              onPress={() => markAsReady(order.orderId)}
            >
              <Text className="text-white font-bold">Mark Ready for Delivery</Text>
            </TouchableOpacity>
          </View>
        );
      
      case OrderStatus.READY:
        return (
          <View className="flex-row gap-3 mt-3">
            <View className="flex-1 bg-slate-100 rounded-xl py-3 items-center">
              <Text className="text-slate-500 font-bold text-xs">Waiting for delivery rider…</Text>
            </View>
          </View>
        );
      
      case OrderStatus.OUT_FOR_DELIVERY:
        return (
          <View className="flex-row gap-3 mt-3">
            <TouchableOpacity 
              className="flex-1 bg-emerald-600 rounded-xl py-3 items-center"
              onPress={() => markAsDelivered(order.orderId)}
            >
              <Text className="text-white font-bold">Mark Delivered</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <Text>Loading orders...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-4">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="washing-machine" size={22} color="#2563EB" />
            <Text className="text-xl font-extrabold text-blue-600">QuickClean Pro</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.push('/(root)/(business)/(tabs)/orders' as any)}>
              <Ionicons name="receipt-outline" size={24} color="#0f172a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(root)/(business)/(tabs)/admin' as any)}>
              <View className="w-9 h-9 rounded-full bg-blue-600 items-center justify-center">
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats grid */}
        <View className="flex-row flex-wrap px-5 gap-3 mb-5">
          {stats.map((s, i) => (
            <View key={i} className="bg-white rounded-2xl p-4 flex-1 min-w-[44%]" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm text-slate-500">{s.label}</Text>
                <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: s.color }}>
                  <Ionicons name={s.icon as any} size={16} color="#2563EB" />
                </View>
              </View>
              <Text className="text-3xl font-extrabold text-slate-900">{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Pending Orders - Need Confirmation */}
        {pendingOrders.length > 0 && (
          <View className="px-5 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-slate-900">Pending Orders</Text>
              <View className="bg-yellow-100 rounded-full px-3 py-1">
                <Text className="text-yellow-600 text-xs font-bold">New ({pendingOrders.length})</Text>
              </View>
            </View>
            {pendingOrders.map((order) => (
              <View key={order.orderId} className="bg-white rounded-2xl p-4 mb-3 border border-slate-100" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-blue-600 font-semibold">{order.orderNumber}</Text>
                  <View className="bg-yellow-100 px-2 py-1 rounded">
                    <Text className="text-yellow-700 text-xs font-bold">{order.status}</Text>
                  </View>
                </View>
                <Text className="text-lg font-bold text-slate-900 mb-1">
                  Order #{order.orderNumber}
                </Text>
                <View className="mb-2">
                  {renderOrderItems(order)}
                </View>
                <Text className="text-sm font-bold text-blue-600 mb-2">
                  GHS {order.totalAmount?.toFixed(2) || '0.00'}
                </Text>
                {renderActionButtons(order)}
              </View>
            ))}
          </View>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <View className="px-5 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-slate-900">Active Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(root)/(business)/(tabs)/orders' as any)}><Text className="text-blue-600 text-sm font-semibold">View all</Text></TouchableOpacity>
            </View>
            <View className="bg-white rounded-2xl overflow-hidden border border-slate-100">
              <View className="flex-row bg-slate-50 px-4 py-3 border-b border-slate-100">
                <Text className="text-xs font-bold text-slate-400 flex-1">ORDER ID</Text>
                <Text className="text-xs font-bold text-slate-400 flex-1">STATUS</Text>
                <Text className="text-xs font-bold text-slate-400 flex-1">ACTION</Text>
              </View>
              {activeOrders.map((order, i) => (
                <View key={i} className={`flex-row px-4 py-3 items-center ${i < activeOrders.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <Text className="text-xs text-blue-600 font-semibold flex-1">{order.orderNumber}</Text>
                  <View className={`flex-1 rounded-lg px-2 py-1 self-start ${statusColor[order.status]?.split(' ')[0] ?? 'bg-slate-100'}`}>
                    <Text className={`text-xs font-bold ${statusColor[order.status]?.split(' ')[1] ?? 'text-slate-600'}`}>
                      {order.status}
                    </Text>
                  </View>
                  <View className="flex-1">
                    {renderActionButtons(order)}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Confirmed/Ready Orders */}
        {confirmedOrders.length > 0 && (
          <View className="px-5 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-slate-900">Ready for Processing</Text>
              <View className="bg-blue-100 rounded-full px-3 py-1">
                <Text className="text-blue-600 text-xs font-bold">{confirmedOrders.length}</Text>
              </View>
            </View>
            {confirmedOrders.map((order) => (
              <View key={order.orderId} className="bg-white rounded-2xl p-4 mb-3 border border-slate-100" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-blue-600 font-semibold">{order.orderNumber}</Text>
                  <View className={`px-2 py-1 rounded ${statusBadgeColor[order.status]}`}>
                    <Text className="text-white text-xs font-bold">{order.status}</Text>
                  </View>
                </View>
                <Text className="text-lg font-bold text-slate-900 mb-1">
                  Order #{order.orderNumber}
                </Text>
                <View className="mb-2">
                  {renderOrderItems(order)}
                </View>
                <Text className="text-sm font-bold text-blue-600 mb-2">
                  GHS {order.totalAmount?.toFixed(2) || '0.00'}
                </Text>
                {renderActionButtons(order)}
              </View>
            ))}
          </View>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <View className="px-5 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-slate-900">Completed Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(root)/(business)/(tabs)/orders' as any)}><Text className="text-blue-600 text-sm font-semibold">View all</Text></TouchableOpacity>
            </View>
            <View className="bg-white rounded-2xl overflow-hidden border border-slate-100">
              <View className="flex-row bg-slate-50 px-4 py-3 border-b border-slate-100">
                <Text className="text-xs font-bold text-slate-400 flex-1">ORDER ID</Text>
                <Text className="text-xs font-bold text-slate-400 flex-1">TOTAL</Text>
                <Text className="text-xs font-bold text-slate-400 flex-1">STATUS</Text>
              </View>
              {completedOrders.map((order, i) => (
                <View key={i} className={`flex-row px-4 py-3 items-center ${i < completedOrders.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <Text className="text-xs text-blue-600 font-semibold flex-1">{order.orderNumber}</Text>
                  <Text className="text-xs font-bold text-slate-900 flex-1">
                    GHS {order.totalAmount?.toFixed(2) || '0.00'}
                  </Text>
                  <View className={`flex-1 rounded-lg px-2 py-1 self-start ${statusColor[order.status]?.split(' ')[0] ?? 'bg-slate-100'}`}>
                    <Text className={`text-xs font-bold ${statusColor[order.status]?.split(' ')[1] ?? 'text-slate-600'}`}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* In-person order button */}
        <View className="flex-row px-5 gap-3 mb-8">
          {/* <TouchableOpacity 
            className="flex-1 bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center gap-2"
            onPress={() => {
              // Navigate to create order screen for walk-in customers
              // router.push('/(business)/create-order');
              Alert.alert('New Order', 'Navigate to create order for walk-in customer');
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text className="text-white font-bold">New Walk-in Order</Text>
          </TouchableOpacity> */}
          <TouchableOpacity 
            className="flex-1 border border-slate-200 bg-white rounded-2xl py-4 flex-row items-center justify-center gap-2"
            onPress={() => Alert.alert('Support', 'Contact support team')}
          >
            <Ionicons name="headset-outline" size={20} color="#64748b" />
            <Text className="text-slate-600 font-bold">Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}