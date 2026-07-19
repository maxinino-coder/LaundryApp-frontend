import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { businessApi } from '@/lib/api';
import SecureStore from 'expo-secure-store';
import { OrderStatus, Order } from '@/types/type';

const FILTERS = ['All', 'Pending', 'In Progress', 'Ready', 'Delivered'];

const statusStyle: Record<string, string> = {
  'PENDING': 'text-orange-600 bg-orange-50',
  'CONFIRMED': 'text-blue-600 bg-blue-50',
  'IN_PROGRESS': 'text-blue-600 bg-blue-50',
  'READY': 'text-green-600 bg-green-50',
  'OUT_FOR_DELIVERY': 'text-purple-600 bg-purple-50',
  'DELIVERED': 'text-emerald-600 bg-emerald-50',
  'CANCELLED': 'text-red-600 bg-red-50',
};

export default function BusinessOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
      const response = await businessApi.getOrders(accountId);
      setOrders(response);
      applyFilters(response, activeFilter);
    } catch (error) {
      console.log('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (orderList: Order[], filter: string) => {
    let filtered = [...orderList];
    
    // Apply status filter
    if (filter !== 'All') {
      const statusMap: Record<string, OrderStatus> = {
        'Pending': OrderStatus.PENDING,
        'In Progress': OrderStatus.IN_PROGRESS,
        'Ready': OrderStatus.READY,
        'Delivered': OrderStatus.DELIVERED,
      };
      const status = statusMap[filter];
      if (status) {
        filtered = filtered.filter(order => order.status === status);
      }
    }
    
    // Apply sorting (by createdAt)
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredOrders(filtered);
  };

  const handleFilterPress = (filter: string) => {
    setActiveFilter(filter);
    applyFilters(orders, filter);
  };

  const handleSortToggle = () => {
    const newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newSortOrder);
    applyFilters(orders, activeFilter);
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await businessApi.updateOrderStatus(orderId, newStatus);
      
      // Update local state
      const updatedOrders = orders.map(order => 
        order.orderId === orderId 
          ? { ...order, status: newStatus }
          : order
      );
      setOrders(updatedOrders);
      applyFilters(updatedOrders, activeFilter);
      
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.log('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const handleConfirmOrder = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.CONFIRMED);
  };

  const handleMarkReady = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.READY);
  };

  const handleDispatchDelivery = (orderId: string) => {
    updateOrderStatus(orderId, OrderStatus.OUT_FOR_DELIVERY);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    if (accountId) {
      loadOrders();
      const interval = setInterval(loadOrders, 15000);
      return () => clearInterval(interval);
    }
  }, [accountId]);

  // Get action button text and handler based on status
  const getActionButton = (order: Order) => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return {
          text: 'Confirm',
          handler: () => handleConfirmOrder(order.orderId),
          color: 'bg-blue-600',
        };
      case OrderStatus.CONFIRMED:
      case OrderStatus.IN_PROGRESS:
        return {
          text: 'Mark Ready',
          handler: () => handleMarkReady(order.orderId),
          color: 'bg-green-600',
        };
      case OrderStatus.READY:
        return {
          text: 'Dispatch Delivery',
          handler: () => handleDispatchDelivery(order.orderId),
          color: 'bg-slate-700',
        };
      case OrderStatus.OUT_FOR_DELIVERY:
        return {
          text: 'Delivered',
          handler: () => updateOrderStatus(order.orderId, OrderStatus.DELIVERED),
          color: 'bg-emerald-600',
        };
      default:
        return null;
    }
  };

  // Get status display text
  const getStatusDisplay = (status: OrderStatus): string => {
    const map: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.CONFIRMED]: 'Confirmed',
      [OrderStatus.PICKED_UP]: 'Picked Up',
      [OrderStatus.IN_PROGRESS]: 'In Progress',
      [OrderStatus.READY]: 'Ready',
      [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled',
      [OrderStatus.REFUNDED]: 'Refunded',
      [OrderStatus.ACCEPTED]: 'Accepted',
    };
    return map[status] ?? String(status);
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
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name="washing-machine" size={22} color="#2563EB" />
          <Text className="text-xl font-extrabold text-blue-600">LaundryManager</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={handleSortToggle}>
            <Ionicons name={sortOrder === 'desc' ? 'arrow-down-outline' : 'arrow-up-outline'} size={22} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity><Ionicons name="search-outline" size={22} color="#0f172a" /></TouchableOpacity>
          <TouchableOpacity><Ionicons name="notifications-outline" size={22} color="#0f172a" /></TouchableOpacity>
          <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
            <Ionicons name="person" size={14} color="#fff" />
          </View>
        </View>
      </View>

      <View className="px-5 mb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-extrabold text-slate-900">All Orders</Text>
        <Text className="text-sm text-slate-500">{filteredOrders.length} orders</Text>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 8 }}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => handleFilterPress(f)}
            className={`px-4 py-2 rounded-full border ${activeFilter === f ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
          >
            <Text className={`text-sm font-semibold ${activeFilter === f ? 'text-white' : 'text-slate-600'}`}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        className="flex-1 px-5" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredOrders.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-slate-500">No orders found</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const actionButton = getActionButton(order);
            const statusDisplay = getStatusDisplay(order.status);
            
            return (
              <View key={order.orderId} className="bg-white rounded-2xl p-4 mb-4 border border-slate-100" style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 }}>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-blue-600 font-bold">{order.orderNumber || order.orderId}</Text>
                  <View className={`px-3 py-1 rounded-full ${statusStyle[order.status]?.split(' ')[1] || 'bg-gray-50'}`}>
                    <Text className={`text-xs font-bold ${statusStyle[order.status]?.split(' ')[0] || 'text-gray-600'}`}>
                      {statusDisplay}
                    </Text>
                  </View>
                </View>
                <Text className="text-lg font-bold text-slate-900 mb-2">Customer: {order.userId}</Text>
                
                {/* ✅ Single OrderItem - NOT an array */}
                <View className="flex-row items-center gap-4 mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="layers-outline" size={14} color="#64748b" />
                    <Text className="text-sm text-slate-500">
                      {order.orderItems?.Quantity || 0} items
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <MaterialCommunityIcons name="cash-multiple" size={14} color="#64748b" />
                    <Text className="text-sm text-slate-500">
                      {order.orderItems?.LineTotal ? `GHS ${order.orderItems.LineTotal.toFixed(2)}` : 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <View className="h-px bg-slate-100 my-2" />
                
                {/* ✅ Single OrderItem service */}
                <Text className="text-sm text-slate-500 mb-0.5">
                  Service: {order.orderItems?.serviceCategory || 'Service'}
                </Text>
                <Text className="text-xs text-slate-400 mb-3">
                  Order Time: {new Date(order.createdAt).toLocaleString()}
                </Text>
                
                <View className="flex-row gap-3">
                  {actionButton && (
                    <TouchableOpacity 
                      className={`flex-1 rounded-xl py-3 items-center flex-row justify-center gap-2 ${actionButton.color}`}
                      onPress={actionButton.handler}
                    >
                      {order.status === OrderStatus.READY && (
                        <MaterialCommunityIcons name="truck-delivery-outline" size={16} color="#fff" />
                      )}
                      <Text className="text-white font-bold">{actionButton.text}</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === OrderStatus.PENDING && (
                    <TouchableOpacity className="w-12 border border-slate-200 rounded-xl items-center justify-center">
                      <Text className="text-slate-500 font-bold">···</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}