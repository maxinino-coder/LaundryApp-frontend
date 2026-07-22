import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { paymentApi, conversationApi, userApi } from '@/lib/api';
import { Order, OrderStatus, RideAssignment } from '@/types/type';
import Map from '@/components/Map';
import { useUserLocation } from '@/hooks/useUserLocation';

// ─── Order status → progress step mapping ────────────────────
const STATUS_STEPS: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Placed',             statuses: [OrderStatus.PENDING] },
  { label: 'Confirmed',          statuses: [OrderStatus.CONFIRMED, OrderStatus.ACCEPTED] },
  { label: 'Picked Up',          statuses: [OrderStatus.PICKED_UP] },
  { label: 'In Progress',        statuses: [OrderStatus.IN_PROGRESS] },
  { label: 'Ready for Delivery', statuses: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY] },
  { label: 'Delivered',          statuses: [OrderStatus.DELIVERED] },
];

function getCurrentStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex(s => s.statuses.includes(status));
}

// Which payment is due at the current stage.
// SERVICE confirms the order (webhook: PENDING → CONFIRMED);
// pickup/dropoff legs must be paid before the rider gets paid out.
function getPaymentRequired(status: OrderStatus): 'pickup' | 'service' | 'dropoff' | null {
  if (status === OrderStatus.PENDING) return 'service';
  if (status === OrderStatus.CONFIRMED || status === OrderStatus.ACCEPTED) return 'pickup';
  if (status === OrderStatus.READY || status === OrderStatus.OUT_FOR_DELIVERY) return 'dropoff';
  return null;
}

const STATUS_COLORS: Partial<Record<OrderStatus, { bg: string; text: string }>> = {
  [OrderStatus.PENDING]:          { bg: 'bg-orange-100', text: 'text-orange-600' },
  [OrderStatus.CONFIRMED]:        { bg: 'bg-blue-100',   text: 'text-blue-600' },
  [OrderStatus.ACCEPTED]:         { bg: 'bg-blue-100',   text: 'text-blue-600' },
  [OrderStatus.PICKED_UP]:        { bg: 'bg-purple-100', text: 'text-purple-600' },
  [OrderStatus.IN_PROGRESS]:      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  [OrderStatus.READY]:            { bg: 'bg-green-100',  text: 'text-green-600' },
  [OrderStatus.OUT_FOR_DELIVERY]: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  [OrderStatus.DELIVERED]:        { bg: 'bg-slate-100',  text: 'text-slate-600' },
  [OrderStatus.CANCELLED]:        { bg: 'bg-red-100',    text: 'text-red-600' },
};

export default function OrderDetail() {
  const params = useLocalSearchParams<{ orderId: string }>();
  const orderId = params.orderId;

  useUserLocation();

  const [order, setOrder] = useState<Order | null>(null);
  const [applicants, setApplicants] = useState<RideAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      const id = accountId ?? (await SecureStore.getItemAsync('account_id'));
      if (!id) return;
      if (!accountId) setAccountId(id);

      const orders = await userApi.getOrdersByUserId(id);
      const found = orders.find(o => o.orderId === orderId) ?? null;
      setOrder(found);

      // Load rider applicants when the order is waiting for a rider to be chosen
      if (found && [
        OrderStatus.CONFIRMED, OrderStatus.ACCEPTED,
        OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY,
      ].includes(found.status)) {
        try {
          const apps = await userApi.getOrderApplicants(id, orderId);
          setApplicants(apps);
        } catch {
          setApplicants([]);
        }
      } else {
        setApplicants([]);
      }
    } catch (e: any) {
      console.error('Order load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, accountId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
  };

  // ── Payment handler — opens Paystack checkout in an in-app browser,
  //    then refetches the order so the webhook-driven status shows up.
  async function handlePay(type: 'pickup' | 'service' | 'dropoff') {
    setPayLoading(type);
    try {
      const fn =
        type === 'pickup'  ? () => paymentApi.payPickup(orderId) :
        type === 'service' ? () => paymentApi.payService(orderId) :
                             () => paymentApi.payDropoff(orderId);
      const { authorization_url } = await fn();
      await WebBrowser.openBrowserAsync(authorization_url);
      // Browser dismissed — payment may have completed; refresh status
      await loadOrder();
    } catch (e: any) {
      Alert.alert('Payment Error', e.message);
    } finally {
      setPayLoading(null);
    }
  }

  // ── Accept a rider applicant ───────────────────────────────
  async function handleAccept(applicationId: string) {
    if (!accountId) return;
    setAcceptLoading(applicationId);
    try {
      await userApi.acceptApplicant(accountId, orderId, applicationId);
      Alert.alert('Rider accepted', 'The rider has been assigned to your order.');
      await loadOrder();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAcceptLoading(null);
    }
  }

  // ── Message the assigned rider (falls back to the business) ─
  async function handleMessage(otherAccountId?: string) {
    const target = otherAccountId;
    if (!target) {
      Alert.alert('Not available', 'No participant to message yet.');
      return;
    }
    setMsgLoading(true);
    try {
      const { conversation_id } = await conversationApi.start(orderId, target);
      router.push({
        pathname: '/(root)/(user)/messages/[conversationId]' as any,
        params: { conversationId: conversation_id },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setMsgLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-8">
        <MaterialCommunityIcons name="package-variant-closed" size={48} color="#cbd5e1" />
        <Text className="text-slate-500 mt-3 text-center">Order not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-blue-600 rounded-xl px-6 py-3">
          <Text className="text-white font-bold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentStatus = order.status;
  const currentStepIndex = getCurrentStepIndex(currentStatus);
  const paymentRequired = getPaymentRequired(currentStatus);
  const statusColors = STATUS_COLORS[currentStatus] ?? { bg: 'bg-slate-100', text: 'text-slate-600' };
  const pendingApplicants = applicants.filter(a => a.status === 'PENDING');

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
                {order.orderNumber ?? `#${orderId.slice(0, 8).toUpperCase()}`}
              </Text>
              <View className={`px-2 py-0.5 rounded-full self-start mt-0.5 ${statusColors.bg}`}>
                <Text className={`text-xs font-bold ${statusColors.text}`}>{currentStatus}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live Map */}
        <View style={{ marginHorizontal: 20, marginBottom: 16, height: 220, borderRadius: 16, overflow: 'hidden' }}>
          {order.pickupLat && order.pickupLng ? (
            <Map
              phase="to_customer"
              pickupLat={order.pickupLat}
              pickupLng={order.pickupLng}
              pickupLabel={order.pickupAddress ?? 'Pickup'}
              dropoffLat={order.deliveryLat}
              dropoffLng={order.deliveryLng}
              dropoffLabel={order.deliveryAddress ?? 'Delivery'}
            />
          ) : (
            <View className="flex-1 bg-blue-50 items-center justify-center">
              <MaterialCommunityIcons name="map-marker-path" size={40} color="#93c5fd" />
              <Text className="text-blue-300 text-xs mt-2">No location on this order</Text>
            </View>
          )}
        </View>

        {/* Addresses */}
        <View className="mx-5 mb-4 bg-white rounded-2xl p-4 border border-slate-100">
          <View className="flex-row items-start gap-3 mb-3">
            <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mt-0.5">
              <Ionicons name="location-outline" size={14} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-400 font-semibold mb-0.5">PICKUP</Text>
              <Text className="text-sm text-slate-700">{order.pickupAddress}</Text>
            </View>
          </View>
          <View className="flex-row items-start gap-3">
            <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mt-0.5">
              <Ionicons name="home-outline" size={14} color="#16a34a" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-400 font-semibold mb-0.5">DELIVERY</Text>
              <Text className="text-sm text-slate-700">{order.deliveryAddress}</Text>
            </View>
          </View>
        </View>

        {/* Items */}
        {order.orderItems?.length > 0 && (
          <View className="mx-5 mb-4 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-xs text-slate-400 font-semibold mb-2">ITEMS</Text>
            {order.orderItems.map((item, i) => (
              <View key={i} className="flex-row justify-between mb-1.5">
                <Text className="text-sm text-slate-700">
                  {item.quantity}× {String(item.serviceCategory).replace(/_/g, ' ')}
                </Text>
                <Text className="text-sm font-semibold text-slate-900">
                  GHS {Number(item.lineTotal ?? item.unitPrice * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            <View className="h-px bg-slate-100 my-2" />
            <View className="flex-row justify-between">
              <Text className="text-sm font-bold text-slate-900">Total (incl. fees)</Text>
              <Text className="text-sm font-bold text-blue-600">GHS {order.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Progress tracker */}
        <View className="mx-5 mb-4 bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="text-lg font-bold text-slate-900 mb-4">Order Progress</Text>
          {STATUS_STEPS.map((step, i) => {
            const state = i < currentStepIndex ? 'done' : i === currentStepIndex ? 'active' : 'pending';
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

        {/* Rider applicants — choose your rider */}
        {pendingApplicants.length > 0 && (
          <View className="mx-5 mb-4 bg-white rounded-2xl p-4 border border-blue-200">
            <Text className="font-bold text-slate-900 mb-3">
              🏍️ Riders who applied ({pendingApplicants.length})
            </Text>
            {pendingApplicants.map((app) => (
              <View
                key={app.applicationId}
                className="flex-row items-center gap-3 mb-3 pb-3 border-b border-slate-100"
              >
                <View className="w-11 h-11 rounded-full bg-blue-100 items-center justify-center">
                  <Ionicons name="person" size={20} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-900 text-sm">
                    {app.riderFirstName} {app.riderLastName}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {app.vehicleType ?? 'Vehicle'}{app.vehiclePlate ? ` • ${app.vehiclePlate}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleAccept(app.applicationId)}
                  disabled={acceptLoading !== null}
                  className={`rounded-xl px-4 py-2 ${acceptLoading === app.applicationId ? 'bg-blue-300' : 'bg-blue-600'}`}
                >
                  {acceptLoading === app.applicationId
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text className="text-white font-bold text-xs">Accept</Text>}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Assigned rider card */}
        {order.pickUpRiderId || order.delivaryRiderId ? (
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
              <Text className="font-bold text-slate-900">Rider assigned</Text>
              <Text className="text-sm text-slate-500">Message them to coordinate</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const acceptedApp = applicants.find(a => a.status === 'ACCEPTED');
                handleMessage(acceptedApp?.riderId);
              }}
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
        {order.notes && (
          <View className="mx-5 mb-4 bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-xs text-slate-400 font-semibold mb-1">ORDER NOTES</Text>
            <Text className="text-sm text-slate-600">📝 {order.notes}</Text>
          </View>
        )}

        {/* Payment section */}
        {currentStatus !== OrderStatus.CANCELLED && (
          <View className="mx-5 mb-4 bg-orange-50 rounded-2xl p-5 border border-orange-100">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-bold text-slate-900">Payments</Text>
              <Text className="text-orange-600 font-extrabold text-lg">
                GHS {order.totalAmount.toFixed(2)}
              </Text>
            </View>
            {[
              { type: 'service', label: `Pay for Service (GHS ${order.subtotal.toFixed(2)})`,  active: paymentRequired === 'service' },
              { type: 'pickup',  label: `Pay Pickup Fee (GHS ${order.pickUpFee.toFixed(2)})`,   active: paymentRequired === 'pickup' },
              { type: 'dropoff', label: `Pay Delivery Fee (GHS ${order.dropoffFee.toFixed(2)})`, active: paymentRequired === 'dropoff' },
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
                        {!active && ' (not due)'}
                      </Text>
                    </View>}
              </TouchableOpacity>
            ))}
            <Text className="text-xs text-slate-400 text-center mt-1">
              Payments are unlocked as your order progresses
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
