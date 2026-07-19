import { AvailableOrder, BusinessInfo, BusinessPayoutDTO, CreateOrderPayload, CreateServiceItemPayload, Message, Order, OrderStatus, RideAssignment, RiderInfo, RiderPayoutDTO, ServiceItem, UserInfo } from '@/types/type';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const BASE_URL = Platform.select({
  ios: process.env.EXPO_PUBLIC_IOS,
  android: process.env.EXPO_PUBLIC_ANDROID,
  default: process.env.EXPO_PUBLIC_SPRING_BOOT_BACKEND_URL,
});

// ─── Token helpers ────────────────────────────────────────────
async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('access_token');
}

// ─── Generic request helper ──────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {}
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register: (role: 'user' | 'business' | 'rider', payload: object) =>
    request(`/auth/register/${role}`, { method: 'POST', body: JSON.stringify(payload) }),

  googleSigninUrl: () =>
    request<{ signin_url: string; note: string }>('/api/v1/auth/google/signin-url'),
};

// ─── User ─────────────────────────────────────────────────────
export const userApi = {
  getBusinesses: (name?: string, location?: string) => {
    const params = new URLSearchParams();
    if (name) params.set('Name', name);
    if (location) params.set('Location', location);
    return request<BusinessInfo[]>(`/api/v1/users/getbusinessInfo?${params}`);
  },

  getUserById: (accountId: string) =>
    request<UserInfo>(`/api/v1/users/getuserinfoById?accountId=${(accountId)}`),

  getRiders: () =>
    request<RiderInfo[]>('/api/v1/users/getriderinfo'),

  makeOrder: (payload: CreateOrderPayload) =>
    request<Order>('/api/v1/users/make_order', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOrderApplicants: (userId: string, orderId: string) =>
    request<RideAssignment[]>(`/api/v1/users/users/${userId}/orders/${orderId}/applicants`),

  getOrdersByUserId:(accountId: string) =>
    request<Order[]>(`/api/v1/users/cutomer_orders?accountId=${accountId}`),
};

// ─── Business ─────────────────────────────────────────────────
export const businessApi = {
  getUsersByPurchased: (accountId: string) =>
    request<UserInfo[]>(`/api/v1/business/user_info?accountId=${accountId}`),

  getOrders: (accountId: string) =>
    request<Order[]>(`/api/v1/business/business_orders?accountId=${accountId}`),


  createServiceItem: (payload: CreateServiceItemPayload) =>
    request<ServiceItem>('/api/v1/business/create_service_items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

      updateOrderStatus: (orderId: string, status: OrderStatus) => 
    request<Order>(`/api/v1/business/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

    updateBusinessInfo: (accountId: string, payload: Partial<BusinessInfo>) =>
    request<BusinessInfo>(`/api/v1/business/${accountId}/update_profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

    getBusinessPayout: (accountId: string) =>
    request<BusinessPayoutDTO>(`/api/v1/business/${accountId}/business_payout`),
};


// ─── Rider ────────────────────────────────────────────────────
 export const riderApi = {
  getAvailableOrders: () =>
    request<AvailableOrder[]>('/api/v1/riders/get_rides'),

  getProfile: (accountId: string) =>
    request<RiderInfo>(`/api/v1/riders/${accountId}/profile`),

  applyForOrder: (riderId: string, orderId: string) =>
    request<RideAssignment>(`/api/v1/riders/riders/${riderId}/apply/${orderId}`, {
      method: 'POST',
    }),

  // ✅ Rider confirms pickup from customer — backend updates status to PICKED_UP
  confirmPickup: (orderId: string) =>
    request<void>(`/api/v1/riders/orders/${orderId}/confirm-pickup`, {
      method: 'POST',
    }),

  // ✅ Rider confirms delivery to business — backend updates status to IN_PROGRESS
  confirmDelivery: (orderId: string) =>
    request<void>(`/api/v1/riders/orders/${orderId}/confirm-delivery`, {
      method: 'POST',
    }),

    getRiderPayout: (accountId: string) =>
    request<RiderPayoutDTO>(`/api/v1/riders/${accountId}/rider_payout`),

    updateRiderInfo: (accountId: string, payload: Partial<RiderInfo>) =>
    request<RiderInfo>(`/api/v1/riders/${accountId}/update_profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

};

// ─── Payment ──────────────────────────────────────────────────
export const paymentApi = {
  payPickup: (orderId: string) =>
    request<{ authorization_url: string }>(`/api/v1/orders/${orderId}/pay/pickup`, {
      method: 'POST',
    }),

  payService: (orderId: string) =>
    request<{ authorization_url: string }>(`/api/v1/orders/${orderId}/pay/service`, {
      method: 'POST',
    }),

  payDropoff: (orderId: string) =>
    request<{ authorization_url: string }>(`/api/v1/orders/${orderId}/pay/dropoff`, {
      method: 'POST',
    }),
};

// ─── Conversations & Messages ──────────────────────────────────
export const conversationApi = {
  start: (orderId: string, otherAccountId: string) =>
    request<{ conversation_id: string; supabase_channel: string }>(
      '/api/v1/conversations/start',
      { method: 'POST', body: JSON.stringify({ orderId, otherAccountId }) }
    ),

  sendMessage: (conversationId: string, body: string) =>
    request<Message>(
      `/api/v1/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify({ body }) }
    ),
};

// ─── Calls ────────────────────────────────────────────────────
export const callApi = {
  start: (conversationId: string, calleeId: string) =>
    request<{ token: string; channel: string }>(
      `/api/v1/conversations/${conversationId}/call/start`,
      { method: 'POST', body: JSON.stringify({ calleeId }) }
    ),

  end: (conversationId: string, callLogId: string, durationSeconds: number) =>
    request<void>(
      `/api/v1/conversations/${conversationId}/call/${callLogId}/end`,
      { method: 'POST', body: JSON.stringify({ durationSeconds }) }
    ),
};
 //--------Map---------------------------------------


export { Message, CreateServiceItemPayload, UserInfo, AvailableOrder, BusinessInfo, Order };
// export { Order, BusinessInfo, Message, UserInfo, CreateServiceItemPayload, AvailableOrder };
// ─── Shared types ─────────────────────────────────────────────
