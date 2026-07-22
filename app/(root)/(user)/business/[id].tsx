import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { userApi } from '@/lib/api';
import { ServiceCategory, UserInfo } from '@/types/type';
import { SERVICE_OPTIONS, PICKUP_FEE, DROPOFF_FEE } from '@/constants/services';
import { useLocationStore } from '@/store';

/**
 * Business detail + order builder.
 * Users pick service categories & quantities, confirm addresses,
 * and place the order — this is the screen the home business cards open.
 */
export default function BusinessDetail() {
  const params = useLocalSearchParams<{
    id: string; name?: string; address?: string; city?: string;
  }>();
  const businessId = params.id;

  const { userLatitude, userLongitude, userAddress } = useLocationStore();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [sameAddress, setSameAddress] = useState(true);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [profile, setProfile] = useState<UserInfo | null>(null);

  // Prefill pickup address from profile (fall back to device location address)
  useEffect(() => {
    SecureStore.getItemAsync('account_id').then(async (id) => {
      if (!id) return;
      try {
        const user = await userApi.getUserById(id);
        setProfile(user);
        const addr = user.address
          ? [user.address, user.city].filter(Boolean).join(', ')
          : userAddress ?? '';
        setPickupAddress((prev) => prev || addr);
      } catch {
        if (userAddress) setPickupAddress((prev) => prev || userAddress);
      }
    });
  }, [userAddress]);

  const setQty = (category: ServiceCategory, delta: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[category] ?? 0) + delta);
      return { ...prev, [category]: next };
    });
  };

  const items = useMemo(
    () =>
      SERVICE_OPTIONS
        .filter((s) => (quantities[s.category] ?? 0) > 0)
        .map((s) => ({
          serviceCategory: s.category,
          quantity: quantities[s.category],
        })),
    [quantities]
  );

  const subtotal = useMemo(
    () =>
      SERVICE_OPTIONS.reduce(
        (sum, s) => sum + s.unitPrice * (quantities[s.category] ?? 0),
        0
      ),
    [quantities]
  );

  const total = subtotal + PICKUP_FEE + DROPOFF_FEE;

  async function handlePlaceOrder() {
    if (items.length === 0) {
      Alert.alert('Add items', 'Select at least one service to order.');
      return;
    }
    if (!pickupAddress.trim()) {
      Alert.alert('Pickup address', 'Enter the address we should pick up from.');
      return;
    }

    setPlacing(true);
    try {
      const accountId = await SecureStore.getItemAsync('account_id');
      if (!accountId) throw new Error('Not logged in');

      const order = await userApi.makeOrder({
        accountId,
        businessId,
        pickupAddress: pickupAddress.trim(),
        pickupLat: userLatitude ?? undefined,
        pickupLng: userLongitude ?? undefined,
        deliveryAddress: sameAddress ? undefined : deliveryAddress.trim() || undefined,
        deliveryLat: sameAddress ? userLatitude ?? undefined : undefined,
        deliveryLng: sameAddress ? userLongitude ?? undefined : undefined,
        notes: notes.trim() || undefined,
        items,
      });

      Alert.alert('Order placed!', `Order ${order.orderNumber} created. Pay for the service to confirm it.`, [
        {
          text: 'View order',
          onPress: () =>
            router.replace({
              pathname: '/(root)/(user)/order/[orderId]' as any,
              params: { orderId: order.orderId },
            }),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-3 gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white items-center justify-center border border-slate-100"
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
            {params.name || 'Laundry Business'}
          </Text>
          {(params.address || params.city) && (
            <Text className="text-xs text-slate-500" numberOfLines={1}>
              {[params.address, params.city].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Services */}
        <Text className="text-base font-bold text-slate-900 px-5 mb-3">Choose services</Text>
        {SERVICE_OPTIONS.map((s) => {
          const qty = quantities[s.category] ?? 0;
          return (
            <View
              key={s.category}
              className="mx-5 mb-3 bg-white rounded-2xl p-4 border border-slate-100 flex-row items-center gap-3"
            >
              <View className="w-11 h-11 rounded-xl bg-blue-50 items-center justify-center">
                <MaterialCommunityIcons name={s.icon as any} size={22} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900 text-sm">{s.label}</Text>
                <Text className="text-xs text-slate-500">{s.description}</Text>
                <Text className="text-xs font-semibold text-blue-600 mt-0.5">
                  GHS {s.unitPrice.toFixed(2)} / item
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => setQty(s.category, -1)}
                  className={`w-8 h-8 rounded-full items-center justify-center ${qty > 0 ? 'bg-blue-100' : 'bg-slate-100'}`}
                  disabled={qty === 0}
                >
                  <Ionicons name="remove" size={16} color={qty > 0 ? '#2563EB' : '#cbd5e1'} />
                </TouchableOpacity>
                <Text className="font-bold text-slate-900 w-5 text-center">{qty}</Text>
                <TouchableOpacity
                  onPress={() => setQty(s.category, 1)}
                  className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center"
                >
                  <Ionicons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Addresses */}
        <Text className="text-base font-bold text-slate-900 px-5 mt-3 mb-3">Pickup address</Text>
        <View className="mx-5 bg-white rounded-2xl border border-slate-100 px-4 py-1 mb-3">
          <TextInput
            placeholder="Where should the rider pick up?"
            placeholderTextColor="#94a3b8"
            value={pickupAddress}
            onChangeText={setPickupAddress}
            className="text-slate-700 text-sm py-3"
          />
        </View>

        <TouchableOpacity
          className="mx-5 flex-row items-center gap-2 mb-3"
          onPress={() => setSameAddress((v) => !v)}
        >
          <Ionicons
            name={sameAddress ? 'checkbox' : 'square-outline'}
            size={20}
            color="#2563EB"
          />
          <Text className="text-sm text-slate-600">Deliver back to the same address</Text>
        </TouchableOpacity>

        {!sameAddress && (
          <View className="mx-5 bg-white rounded-2xl border border-slate-100 px-4 py-1 mb-3">
            <TextInput
              placeholder="Delivery address"
              placeholderTextColor="#94a3b8"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              className="text-slate-700 text-sm py-3"
            />
          </View>
        )}

        {/* Notes */}
        <View className="mx-5 bg-white rounded-2xl border border-slate-100 px-4 py-1 mb-5">
          <TextInput
            placeholder="Notes for the laundry (optional)"
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
            multiline
            className="text-slate-700 text-sm py-3"
          />
        </View>

        {/* Summary */}
        <View className="mx-5 bg-white rounded-2xl p-4 border border-slate-100 mb-5">
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-slate-500">Subtotal</Text>
            <Text className="text-sm text-slate-900 font-semibold">GHS {subtotal.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-slate-500">Pickup fee</Text>
            <Text className="text-sm text-slate-900 font-semibold">GHS {PICKUP_FEE.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-slate-500">Delivery fee</Text>
            <Text className="text-sm text-slate-900 font-semibold">GHS {DROPOFF_FEE.toFixed(2)}</Text>
          </View>
          <View className="h-px bg-slate-100 mb-2" />
          <View className="flex-row justify-between">
            <Text className="text-base font-bold text-slate-900">Total</Text>
            <Text className="text-base font-bold text-blue-600">GHS {total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Place order */}
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={placing || items.length === 0}
          className={`mx-5 rounded-2xl py-4 items-center ${placing || items.length === 0 ? 'bg-slate-300' : 'bg-blue-600'}`}
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              Place Order • GHS {total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
