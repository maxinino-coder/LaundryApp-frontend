import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Map, { RiderPhase } from '@/components/Map';
import { riderApi } from '@/lib/api';
import { useUserLocation } from '@/hooks/useUserLocation';

export default function RiderRoute() {
  const params = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
    businessName?: string;
    businessAddress?: string;
    businessLat?: string;
    businessLng?: string;
    customerAddress?: string;
    customerLat?: string;
    customerLng?: string;
    estimatedPay?: string;
  }>();

  const [phase, setPhase] = useState<RiderPhase>('to_customer');
  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);

  useUserLocation(); // live rider position for the map

  // Parse coords from params
  const customerLat = params.customerLat ? parseFloat(params.customerLat) : undefined;
  const customerLng = params.customerLng ? parseFloat(params.customerLng) : undefined;
  const businessLat = params.businessLat ? parseFloat(params.businessLat) : undefined;
  const businessLng = params.businessLng ? parseFloat(params.businessLng) : undefined;

  const isToCustomer = phase === 'to_customer';

  // No active job — guide the rider to the jobs board instead of a blank screen
  if (!params.orderId) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-8">
        <MaterialCommunityIcons name="map-marker-path" size={56} color="#cbd5e1" />
        <Text className="text-lg font-bold text-slate-700 mt-4 text-center">No active job</Text>
        <Text className="text-sm text-slate-400 mt-1 text-center">
          Apply for a job and get accepted — your route will show up here.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(root)/(rider)/(tabs)/jobs' as any)}
          className="mt-5 bg-blue-600 rounded-xl px-6 py-3"
        >
          <Text className="text-white font-bold">Browse jobs</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Open navigation in maps app
  function openNavigation(lat?: number, lng?: number, label?: string) {
    if (!lat || !lng) return;
    const url = `https://maps.google.com/?daddr=${lat},${lng}&directionsmode=driving`;
    Linking.openURL(url);
  }

  // Rider confirms they've arrived at customer
  async function handleConfirmPickup() {
    Alert.alert(
      'Confirm Pickup',
      'Have you picked up the laundry from the customer?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, Picked Up',
          onPress: async () => {
            setConfirming(true);
            try {
              if (params.orderId) {
                await riderApi.confirmPickup(params.orderId);
              }
              // Switch map to show route to business
              setPhase('to_business');
              Alert.alert('Great!', 'Now head to the laundry for drop-off.');
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Something went wrong');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  }

  // Rider confirms delivery to business
  async function handleConfirmDelivery() {
    Alert.alert(
      'Confirm Delivery',
      'Have you delivered the laundry to the business?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, Delivered',
          onPress: async () => {
            setCompleting(true);
            try {
              if (params.orderId) {
                await riderApi.confirmDelivery(params.orderId);
              }
              Alert.alert('Job Complete! 🎉', 'Payment will be processed shortly.', [
                { text: 'OK', onPress: () => router.replace('/(root)/(rider)/(tabs)/jobs' as any) },
              ]);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Something went wrong');
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2563EB" />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-blue-600">
            {params.orderNumber ?? 'Job'}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.push('/(root)/(rider)/(tabs)/messages' as any)}>
            <Ionicons name="chatbubble-outline" size={22} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(root)/(rider)/(tabs)/profile' as any)}>
            <View className="w-9 h-9 rounded-full bg-blue-600 items-center justify-center">
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Phase indicator */}
      <View className="mx-5 mb-3 flex-row gap-2">
        <View className={`flex-1 h-1.5 rounded-full ${isToCustomer ? 'bg-blue-600' : 'bg-green-500'}`} />
        <View className={`flex-1 h-1.5 rounded-full ${!isToCustomer ? 'bg-green-500' : 'bg-slate-200'}`} />
      </View>
      <View className="mx-5 mb-4 flex-row items-center gap-2">
        <View className={`w-6 h-6 rounded-full items-center justify-center ${isToCustomer ? 'bg-blue-600' : 'bg-green-500'}`}>
          <Ionicons name={isToCustomer ? 'person' : 'business'} size={12} color="#fff" />
        </View>
        <Text className={`text-sm font-bold ${isToCustomer ? 'text-blue-600' : 'text-green-600'}`}>
          {isToCustomer ? 'Step 1: Go to Customer Pickup' : 'Step 2: Deliver to Laundry'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={{ marginHorizontal: 20, marginBottom: 16, height: 260, borderRadius: 16, overflow: 'hidden' }}>
          <Map
            phase={phase}
            pickupLat={customerLat}
            pickupLng={customerLng}
            pickupLabel={`Customer: ${params.customerAddress ?? 'Pickup'}`}
            dropoffLat={businessLat}
            dropoffLng={businessLng}
            dropoffLabel={`${params.businessName ?? 'Laundry'}`}
          />
        </View>

        {/* Current destination card */}
        {isToCustomer ? (
          <View className="mx-5 mb-4 bg-white rounded-2xl p-5 border border-blue-100">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-blue-600 text-xs font-bold">1</Text>
              </View>
              <Text className="text-xs text-blue-600 font-bold uppercase tracking-wide">Customer Pickup</Text>
            </View>
            <View className="flex-row items-start gap-2 mb-4">
              <Ionicons name="location-outline" size={16} color="#94a3b8" />
              <Text className="text-sm text-slate-600 flex-1">
                {params.customerAddress ?? 'Customer location'}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => openNavigation(customerLat, customerLng, 'Customer')}
                className="flex-1 border border-blue-600 rounded-xl py-3 flex-row items-center justify-center gap-2"
              >
                <Ionicons name="navigate-outline" size={16} color="#2563EB" />
                <Text className="text-blue-600 font-bold text-sm">Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/(root)/(rider)/(tabs)/messages' as any)}
                className="w-12 h-12 rounded-xl bg-slate-100 items-center justify-center"
              >
                <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="mx-5 mb-4 bg-white rounded-2xl p-5 border border-green-100">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center">
                <Text className="text-green-600 text-xs font-bold">2</Text>
              </View>
              <Text className="text-xs text-green-600 font-bold uppercase tracking-wide">Deliver to Laundry</Text>
            </View>
            <Text className="font-extrabold text-slate-900 text-lg mb-1">
              {params.businessName ?? 'Laundry Business'}
            </Text>
            <View className="flex-row items-start gap-2 mb-4">
              <Ionicons name="business-outline" size={16} color="#94a3b8" />
              <Text className="text-sm text-slate-600 flex-1">
                {params.businessAddress ?? 'Business address'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => openNavigation(businessLat, businessLng, params.businessName)}
              className="border border-green-600 rounded-xl py-3 flex-row items-center justify-center gap-2"
            >
              <Ionicons name="navigate-outline" size={16} color="#16a34a" />
              <Text className="text-green-600 font-bold text-sm">Navigate to Laundry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Next destination preview */}
        {isToCustomer && businessLat && (
          <View className="mx-5 mb-4 bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200">
            <Text className="text-xs text-slate-400 font-semibold mb-1">NEXT STOP</Text>
            <View className="flex-row items-center gap-2">
              <MaterialCommunityIcons name="washing-machine" size={16} color="#94a3b8" />
              <Text className="text-sm text-slate-500">
                {params.businessName ?? 'Laundry'} — {params.businessAddress}
              </Text>
            </View>
          </View>
        )}

        {/* Order summary */}
        <View className="mx-5 mb-4 bg-white rounded-2xl p-5 border border-slate-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-bold text-slate-900">Order Summary</Text>
            <Text className="text-blue-600 font-extrabold text-lg">
              GHS {params.estimatedPay ?? '0.00'}
            </Text>
          </View>
          {params.orderNumber && (
            <Text className="text-xs text-slate-400">Order {params.orderNumber}</Text>
          )}
        </View>

        {/* CTA button */}
        <View className="mx-5 mb-8">
          {isToCustomer ? (
            <TouchableOpacity
              onPress={handleConfirmPickup}
              disabled={confirming}
              className={`rounded-2xl py-4 items-center flex-row justify-center gap-2 ${confirming ? 'bg-blue-300' : 'bg-blue-600'}`}
            >
              {confirming
                ? <ActivityIndicator color="#fff" />
                : <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                  <Text className="text-white font-extrabold text-lg">Confirm Pickup from Customer</Text>
                </>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleConfirmDelivery}
              disabled={completing}
              className={`rounded-2xl py-4 items-center flex-row justify-center gap-2 ${completing ? 'bg-green-300' : 'bg-green-600'}`}
            >
              {completing
                ? <ActivityIndicator color="#fff" />
                : <>
                  <Ionicons name="checkmark-done-circle-outline" size={22} color="#fff" />
                  <Text className="text-white font-extrabold text-lg">Confirm Delivery to Laundry</Text>
                </>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}