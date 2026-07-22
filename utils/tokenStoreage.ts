import { AuthResponse } from "@/types/type";
import { Href } from "expo-router";
import * as SecureStore from "expo-secure-store";
 
const KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  ROLE: "role",
  ACCOUNT_ID: "account_id",
} as const;
 
export async function saveAuthResponse(auth: AuthResponse): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, auth.access_token),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, auth.refresh_token),
    SecureStore.setItemAsync(KEYS.ROLE, auth.role),
    SecureStore.setItemAsync(KEYS.ACCOUNT_ID, auth.account_id),
  ]);
}
 
export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}
 
export async function getRole(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ROLE);
}
 
export async function clearAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEYS.ROLE),
    SecureStore.deleteItemAsync(KEYS.ACCOUNT_ID),
  ]);
}
 

export function getHomeRouteForRole(role: string): Href {
  switch (role) {
    case "USER":
      return "../(root)/(user)/(tabs)/home" as Href;
    case "BUSINESS":
      return "../(root)/(business)/(tabs)/dashboard" as Href;
    case "RIDER":
      return "../(root)/(rider)/(tabs)/jobs" as Href;
    default:
      return "../(role)/(auth)/role-selection";
  }
}
 