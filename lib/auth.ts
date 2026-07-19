import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type {
  RegisterUserRequest,
  RegisterBusinessRequest,
  RegisterRiderRequest,
  AuthResponse,
} from "@/types/type";

const API_BASE_URL = Platform.select({
  ios: process.env.EXPO_PUBLIC_IOS,
  android: process.env.EXPO_PUBLIC_ANDROID,
  default: process.env.EXPO_PUBLIC_SPRING_BOOT_BACKEND_URL,
});

// ─── Constants ──────────────────────────────────────────────────
const AUTH_KEYS = {
  ACCESS_TOKEN: "access_token",
} as const;

// ─── Error class ────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ─── Core POST helper ───────────────────────────────────────────
async function post<TRequest, TResponse>(
  path: string,
  body: TRequest,
  requiresAuth: boolean = true
): Promise<TResponse> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // ── Attach Authorization header if token exists ──
  if (requiresAuth) {
    const token = await SecureStore.getItemAsync(AUTH_KEYS.ACCESS_TOKEN);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Log warning – the request will likely fail with 401
      console.warn("[API] No access token found for authenticated request");
    }
  }

  // Debug — remove in production
  console.log(`[API] POST ${url}`);
  console.log(`[API] Body:`, JSON.stringify(body));

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  console.log(`[API] Status: ${response.status}`);

  // ── CRITICAL FIX ──────────────────────────────────────────────
  // Check Content-Type BEFORE trying to parse as JSON.
  // If Spring Security redirects to Google OAuth, the response is
  // HTML with status 200, which breaks JSON.parse() and was causing
  // the "Server returned 200: <!doctype html>" error in your app.
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.error(`[API] Non-JSON response:`, text.slice(0, 200));
    throw new ApiError(
      response.status,
      "Server returned an unexpected response. Check that your backend URL is correct and the endpoint is not being intercepted by Spring Security's OAuth2 filter."
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      message = errorBody.message || errorBody.error || message;
      console.error(`[API] Error body:`, errorBody);
    } catch {
      // keep default message
    }
    throw new ApiError(response.status, message);
  }

  const data = await response.json();
  console.log(`[API] Success:`, JSON.stringify(data));
  return data as TResponse;
}

// ─── Auth endpoints ─────────────────────────────────────────────
// All auth endpoints are public – they do not require a token

export interface LoginRequest {
  email: string;
  password: string;
}

/** Universal login — works for USER, BUSINESS, and RIDER accounts */
export function login(req: LoginRequest): Promise<AuthResponse> {
  return post<LoginRequest, AuthResponse>("/auth/login", req, false);
}

export function registerUser(req: RegisterUserRequest): Promise<AuthResponse> {
  return post<RegisterUserRequest, AuthResponse>("/auth/register/user", req, false);
}

export function registerBusiness(req: RegisterBusinessRequest): Promise<AuthResponse> {
  return post<RegisterBusinessRequest, AuthResponse>("/auth/register/business", req, false);
}

export function registerRider(req: RegisterRiderRequest): Promise<AuthResponse> {
  return post<RegisterRiderRequest, AuthResponse>("/auth/register/rider", req, false);
}

// ─── Example for protected endpoints ───────────────────────────
// export function getUserProfile(): Promise<UserProfile> {
//   return post<UserProfile, UserProfile>("/users/me", {}, true); // defaults to true
// }

export type { RegisterRiderRequest, RegisterUserRequest, RegisterBusinessRequest };