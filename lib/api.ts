import { AvailableOrder, AuthResponse, BusinessInfo, BusinessPayoutDTO, ConversationSummary, CreateOrderPayload, CreateServiceItemPayload, Message, Order, OrderStatus, RideAssignment, RiderInfo, RiderPayoutDTO, ServiceItem, UserInfo } from '@/types/type';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { saveAuthResponse, clearAuth, getRefreshToken } from '@/utils/tokenStoreage';

const BASE_URL = Platform.select({
  ios: process.env.EXPO_PUBLIC_IOS,
  android: process.env.EXPO_PUBLIC_ANDROID,
  default: process.env.EXPO_PUBLIC_SPRING_BOOT_BACKEND_URL,
});

// ─── Token helpers ────────────────────────────────────────────
async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('access_token');
}

// Single-flight refresh — if multiple requests 401 at the same time,
// only one refresh call goes out; all others wait for it to resolve.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new ApiError(401, 'Session expired. Please log in again.');

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Refresh-Token': refreshToken,
      },
    });

    if (!res.ok) {
      await clearAuth();
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    const auth: AuthResponse = await res.json();
    await saveAuthResponse(auth);
    return auth.access_token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
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

  // On 401, attempt a silent token refresh and retry once.
  // The backend now returns 401 (not 403) for expired/missing tokens.
  if (res.status === 401) {
    const newToken = await refreshAccessToken(); // throws + clears auth on failure
    const retryRes = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    });
    if (!retryRes.ok) {
      let message = `Request failed: ${retryRes.status}`;
      try {
        const body = await retryRes.json();
        message = body.message || body.error || message;
      } catch {}
      throw new ApiError(retryRes.status, message);
    }
    if (retryRes.status === 204) return undefined as T;
    return retryRes.json();
  }

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
    request<{ signin_url: string; note: string }>('/auth/google/signin-url'),
};

// ─── User ─────────────────────────────────────────────────────
export const userApi = {
  getBusinesses: (name?: string, location?: string) => {
    const params = new URLSearchParams();
    if (name) params.set('Name', name);
    if (location) params.set('Location', location);
    return request<BusinessInfo[]>(`/users/getbusinessInfo?${params}`);
  },

  getUserById: (accountId: string) =>
    request<UserInfo>(`/users/getuserinfoById?accountId=${(accountId)}`),

  getRiders: () =>
    request<RiderInfo[]>('/users/getriderinfo'),

  makeOrder: (payload: CreateOrderPayload) =>
    request<Order>('/users/make_order', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOrderApplicants: (accountId: string, orderId: string) =>
    request<RideAssignment[]>(`/users/${accountId}/orders/${orderId}/applicants`),

  acceptApplicant: (accountId: string, orderId: string, applicationId: string) =>
    request<Order>(
      `/users/${accountId}/orders/${orderId}/applicants/${applicationId}/accept`,
      { method: 'POST' }
    ),

  getOrdersByUserId:(accountId: string) =>
    request<Order[]>(`/users/customer_orders?accountId=${accountId}`),

  updateUserInfo: (accountId: string, payload: Partial<UserInfo>) =>
    request<UserInfo>(`/users/${accountId}/update_profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

// ─── Business ─────────────────────────────────────────────────
export const businessApi = {
  getUsersByPurchased: (accountId: string) =>
    request<UserInfo[]>(`/business/user_info?accountId=${accountId}`),

  getOrders: (accountId: string) =>
    request<Order[]>(`/business/business_orders?accountId=${accountId}`),


  // createServiceItem: (payload: CreateServiceItemPayload) =>
  //   request<ServiceItem>('/business/create_service_items', {
  //     method: 'POST',
  //     body: JSON.stringify(payload),
  //   }),

      updateOrderStatus: (orderId: string, status: OrderStatus) => 
    request<Order>(`/business/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

    updateBusinessInfo: (accountId: string, payload: Partial<BusinessInfo>) =>
    request<BusinessInfo>(`/business/${accountId}/update_profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

    getBusinessPayout: (accountId: string) =>
    request<BusinessPayoutDTO>(`/business/${accountId}/business_payout`),

    getBusinessInfo: (accountId: string) =>
    request<BusinessInfo>(`/business/${accountId}/business_info`),
};


// ─── Rider ────────────────────────────────────────────────────
 export const riderApi = {
  getAvailableOrders: () =>
    request<AvailableOrder[]>('/riders/get_rides'),

  getProfile: (accountId: string) =>
    request<RiderInfo>(`/riders/${accountId}/profile`),

  applyForOrder: (riderId: string, orderId: string) =>
    request<RideAssignment>(`/riders/${riderId}/apply/${orderId}`, {
      method: 'POST',
    }),

  // ✅ Rider confirms pickup from customer — backend updates status to PICKED_UP
  confirmPickup: (orderId: string) =>
    request<void>(`/riders/orders/${orderId}/confirm-pickup`, {
      method: 'POST',
    }),

  // ✅ Rider confirms delivery to business — backend updates status to IN_PROGRESS
  confirmDelivery: (orderId: string) =>
    request<void>(`/riders/orders/${orderId}/confirm-delivery`, {
      method: 'POST',
    }),

    getRiderPayout: (accountId: string) =>
    request<RiderPayoutDTO>(`/riders/${accountId}/rider_payout`),

    updateRiderInfo: (accountId: string, payload: Partial<RiderInfo>) =>
    request<RiderInfo>(`/riders/${accountId}/update_profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

};

// ─── Payment ──────────────────────────────────────────────────
export const paymentApi = {
  payPickup: (orderId: string) =>
    request<{ authorization_url: string }>(`/orders/${orderId}/pay/pickup`, {
      method: 'POST',
    }),

  payService: (orderId: string) =>
    request<{ authorization_url: string }>(`/orders/${orderId}/pay/service`, {
      method: 'POST',
    }),

  payDropoff: (orderId: string) =>
    request<{ authorization_url: string }>(`/orders/${orderId}/pay/dropoff`, {
      method: 'POST',
    }),
};

// ─── Conversations & Messages ──────────────────────────────────
export const conversationApi = {
  start: (orderId: string, otherAccountId: string) =>
    request<{ conversation_id: string; supabase_channel: string }>(
      '/conversations/start',
      { method: 'POST', body: JSON.stringify({ orderId, otherAccountId }) }
    ),

  list: () =>
    request<ConversationSummary[]>('/conversations'),

  getMessages: (conversationId: string) =>
    request<Message[]>(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, body: string) =>
    request<Message>(
      `/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify({ body }) }
    ),
};

// ─── Calls ────────────────────────────────────────────────────
export const callApi = {
  start: (conversationId: string, calleeId: string) =>
    request<{ token: string; channelName: string; agoraUid: number; callLogId: string }>(
      `/conversations/${conversationId}/call/start`,
      { method: 'POST', body: JSON.stringify({ calleeId }) }
    ),

  end: (conversationId: string, callLogId: string, durationSeconds: number) =>
    request<void>(
      `/conversations/${conversationId}/call/${callLogId}/end`,
      { method: 'POST', body: JSON.stringify({ durationSeconds }) }
    ),
};

export { Message, CreateServiceItemPayload, UserInfo, AvailableOrder, BusinessInfo, Order };
