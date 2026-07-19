import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { paymentApi, conversationApi, userApi } from '@/lib/api';
import { Order, OrderStatus, RiderInfo } from '@/types/type';
import * as SecureStore from 'expo-secure-store';
import Map from '@/components/Map';

// ─── Order status → progress step mapping ────────────────────
const STATUS_STEPS: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Confirmed',          statuses: [OrderStatus.CONFIRMED] },
  { label: 'Picked Up',         statuses: [OrderStatus.PICKED_UP] },
  { label: 'In Progress',       statuses: [OrderStatus.IN_PROGRESS] },
  { label: 'Ready for Delivery',statuses: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY] },
  { label: 'Delivered',         statuses: [OrderStatus.DELIVERED] },
];

function getStepState(
  stepStatuses: OrderStatus[],
  currentStatus: OrderStatus,
  stepIndex: number,
  currentStepIndex: number
): 'done' | 'active' | 'pending' {
  if (stepIndex < currentStepIndex) return 'done';
  if (stepIndex === currentStepIndex) return 'active';
  return 'pending';
}

function getCurrentStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex(s => s.statuses.includes(status));
}

// ─── Payment requirements per status ─────────────────────────
function getPaymentRequired(status: OrderStatus): 'pickup' | 'service' | 'dropoff' | null {
  if (status === OrderStatus.CONFIRMED) return 'pickup';
  if (status === OrderStatus.READY)     return 'service';
  if (status === OrderStatus.DELIVERED) return 'dropoff';
  return null;
}

export default function OrderTracking() {
  const params = useLocalSearchParams<{
    orderId: string;
    orderNumber?: string;
    status?: string;
    pickupAddress?: string;
    deliveryAddress?: string;
    pickupLat?: string;
    pickupLng?: string;
    deliveryLat?: string;
    deliveryLng?: string;
    totalAmount?: string;
    riderId?: string;
    riderName?: string;
    riderVehicle?: string;
    riderRating?: string;
    notes?: string;
  }>();

  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [rider, setRider] = useState<RiderInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Parse from params
  const orderId = params.orderId ?? 'demo-order-id';
  const riderId = params.riderId ?? '';
  const currentStatus = Number(params.status ?? OrderStatus.CONFIRMED) as OrderStatus;
  const currentStepIndex = getCurrentStepIndex(currentStatus);
  const paymentRequired = getPaymentRequired(currentStatus);

  const pickupLat = params.pickupLat ? parseFloat(params.pickupLat) : undefined;
  const pickupLng = params.pickupLng ? parseFloat(params.pickupLng) : undefined;
  const deliveryLat = params.deliveryLat ? parseFloat(params.deliveryLat) : undefined;
  const deliveryLng = params.deliveryLng ? parseFloat(params.deliveryLng) : undefined;

  // Load rider profile if riderId provided
  const loadRider = useCallback(async () => {
    if (!riderId) return;
    try {
      const r = await userApi.getRiders();
      const found = r.find(ri => ri.id === Number(riderId));
      if (found) setRider(found);
    } catch (e) {
      console.log('Rider load error:', e);
    }
  }, [riderId]);

  useEffect(() => {
    loadRider();
  }, [loadRider]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRider();
    setRefreshing(false);
  };

  // ── Payment handler ───────────────────────────────────────
  async function handlePay(type: 'pickup' | 'service' | 'dropoff') {
    setPayLoading(type);
    try {
      const fn =
        type === 'pickup'  ? () => paymentApi.payPickup(orderId) :
        type === 'service' ? () => paymentApi.payService(orderId) :
                             () => paymentApi.payDropoff(orderId);
      const { authorization_url } = await fn();
      await Linking.openURL(authorization_url);
    } catch (e: any) {
      Alert.alert('Payment Error', e.message);
    } finally {
      setPayLoading(null);
    }
  }

  // ── Message handler ───────────────────────────────────────
  async function handleMessage() {
    if (!riderId) {
      Alert.alert('No Rider', 'A rider has not been assigned yet.');
      return;
    }
    setMsgLoading(true);
    try {
      const { conversation_id } = await conversationApi.start(orderId, riderId);
      router.push({
        pathname: '/(user)/messages/[conversationId]' as any,
        params: { conversationId: conversation_id },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setMsgLoading(false);
    }
  }

  // ── Status label & color ──────────────────────────────────
  const STATUS_COLORS: Partial<Record<OrderStatus, { bg: string; text: string }>> = {
    [OrderStatus.PENDING]:          { bg: 'bg-orange-100', text: 'text-orange-600' },
    [OrderStatus.CONFIRMED]:        { bg: 'bg-blue-100',   text: 'text-blue-600' },
    [OrderStatus.PICKED_UP]:        { bg: 'bg-purple-100', text: 'text-purple-600' },
    [OrderStatus.IN_PROGRESS]:      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    [OrderStatus.READY]:            { bg: 'bg-green-100',  text: 'text-green-600' },
    [OrderStatus.OUT_FOR_DELIVERY]: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    [OrderStatus.DELIVERED]:        { bg: 'bg-slate-100',  text: 'text-slate-600' },
    [OrderStatus.CANCELLED]:        { bg: 'bg-red-100',    text: 'text-red-600' },
  };
  const statusColors = STATUS_COLORS[currentStatus] ?? { bg: 'bg-slate-100', text: 'text-slate-600' };
  const statusLabel = OrderStatus[currentStatus] ?? 'UNKNOWN';

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-extrabold text-blue-600">
                {params.orderNumber ?? `#${orderId.slice(0, 8).toUpperCase()}`}
              </Text>
              <View className={`px-2 py-0.5 rounded-full self-start mt-0.5 ${statusColors.bg}`}>
                <Text className={`text-xs font-bold ${statusColors.text}`}>{statusLabel}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Live Map */}
        <View style={{ marginHorizontal: 20, marginBottom: 16, height: 220, borderRadius: 16, overflow: 'hidden' }}>
          {pickupLat && pickupLng ? (
            <Map
              phase="to_customer"
              pickupLat={pickupLat}
              pickupLng={pickupLng}
              pickupLabel={params.pickupAddress ?? 'Your location'}
              dropoffLat={deliveryLat}
              dropoffLng={deliveryLng}
              dropoffLabel={params.deliveryAddress ?? 'Delivery address'}
            />
          ) : (
            <View className="flex-1 bg-blue-50 items-center justify-center">
              <MaterialCommunityIcons name="map-marker-path" size={40} color="#93c5fd" />
              {currentStatus === OrderStatus.OUT_FOR_DELIVERY && (
                <View className="absolute top-3 left-3 bg-white rounded-xl px-3 py-2 flex-row items-center gap-2">
                  <Ionicons name="navigate" size={14} color="#2563EB" />
                  <Text className="text-sm font-semibold text-slate-700">Rider on the way</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Addresses */}
        {(params.pickupAddress || params.deliveryAddress) && (
          <View className="mx-5 mb-4 bg-white rounded-2xl p-4 border border-slate-100">
            {params.pickupAddress && (
              <View className="flex-row items-start gap-3 mb-3">
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mt-0.5">
                  <Ionicons name="location-outline" size={14} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-400 font-semibold mb-0.5">PICKUP</Text>
                  <Text className="text-sm text-slate-700">{params.pickupAddress}</Text>
                </View>
              </View>
            )}
            {params.deliveryAddress && (
              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mt-0.5">
                  <Ionicons name="home-outline" size={14} color="#16a34a" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-400 font-semibold mb-0.5">DELIVERY</Text>
                  <Text className="text-sm text-slate-700">{params.deliveryAddress}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Progress tracker */}
        <View className="mx-5 mb-4 bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-lg font-bold text-slate-900 mb-4">Order Progress</Text>
          {STATUS_STEPS.map((step, i) => {
            const state = getStepState(step.statuses, currentStatus, i, currentStepIndex);
            const isLast = i === STATUS_STEPS.length - 1;
            return (
              <View key={i} className="flex-row gap-4">
                <View className="items-center">
                  <View className={`w-8 h-8 rounded-full items-center justify-center
                    ${state === 'done' ? 'bg-blue-600' :
                      state === 'active' ? 'bg-blue-200' : 'bg-slate-100'}`}>
                    {state === 'done'
                      ? <Ionicons name="checkmark" size={16} color="#fff" />
                      : state === 'active'
                      ? <View className="w-3 h-3 rounded-full bg-blue-600" />
                      : isLast
                      ? <MaterialCommunityIcons name="truck-delivery-outline" size={14} color="#94a3b8" />
                      : <View className="w-3 h-3 rounded-full bg-slate-300" />}
                  </View>
                  {!isLast && <View className="w-0.5 h-8 bg-slate-200 my-1" />}
                </View>
                <View className="flex-1 pb-4">
                  <Text className={`font-semibold
                    ${state === 'done' ? 'text-blue-600' :
                      state === 'active' ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </Text>
                  {state === 'active' && (
                    <Text className="text-xs text-blue-500 mt-0.5">In progress...</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Rider card — only show if assigned */}
        {(rider || params.riderName) ? (
          <View className="mx-5 mb-4 bg-white rounded-2xl p-4 flex-row items-center gap-4 border border-slate-100">
            <View className="relative">
              <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name="person" size={24} color="#2563EB" />
              </View>
              <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 items-center justify-center">
                <MaterialCommunityIcons name="moped" size={12} color="#fff" />
              </View>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-900">
                {rider
                  ? `${rider.firstName} ${rider.lastName}`
                  : params.riderName ?? 'Your Rider'}
              </Text>
              <Text className="text-sm text-slate-500">
                {rider?.vehicleType ?? params.riderVehicle ?? 'Scooter'}
                {params.riderRating ? ` • ⭐ ${params.riderRating}` : ''}
              </Text>
            </View>
            <TouchableOpacity className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-2">
              <Ionicons name="call-outline" size={18} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMessage}
              disabled={msgLoading}
              className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center"
            >
              {msgLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="chatbubble-outline" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mx-5 mb-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex-row items-center gap-3">
            <MaterialCommunityIcons name="moped-outline" size={24} color="#94a3b8" />
            <Text className="text-slate-400 text-sm">Waiting for a rider to be assigned...</Text>
          </View>
        )}

        {/* Notes */}
        {params.notes && (
          <View className="mx-5 mb-4 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-xs text-slate-400 font-semibold mb-1">ORDER NOTES</Text>
            <Text className="text-sm text-slate-600">📝 {params.notes}</Text>
          </View>
        )}

        {/* Payment section */}
        <View className="mx-5 mb-4 bg-orange-50 rounded-2xl p-5 border border-orange-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-bold text-slate-900">Payments</Text>
            {params.totalAmount && (
              <Text className="text-orange-600 font-extrabold text-lg">
                GHS {parseFloat(params.totalAmount).toFixed(2)}
              </Text>
            )}
          </View>
          {[
            { type: 'pickup',  label: 'Pay for Pickup',   active: paymentRequired === 'pickup' },
            { type: 'service', label: 'Pay for Service',  active: paymentRequired === 'service' },
            { type: 'dropoff', label: 'Pay for Delivery', active: paymentRequired === 'dropoff' },
          ].map(({ type, label, active }) => (
            <TouchableOpacity
              key={type}
              onPress={() => handlePay(type as any)}
              disabled={payLoading === type || !active}
              className={`rounded-xl py-3.5 items-center mb-2
                ${payLoading === type ? 'bg-blue-300' :
                  active ? 'bg-blue-700' : 'bg-slate-200'}`}
            >
              {payLoading === type
                ? <ActivityIndicator color="#fff" />
                : <View className="flex-row items-center gap-2">
                    {active && <Ionicons name="card-outline" size={16} color="#fff" />}
                    <Text className={`font-bold ${active ? 'text-white' : 'text-slate-400'}`}>
                      {label}
                      {!active && ' (not due yet)'}
                    </Text>
                  </View>}
            </TouchableOpacity>
          ))}
          <Text className="text-xs text-slate-400 text-center mt-1">
            Payments are unlocked as your order progresses
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}