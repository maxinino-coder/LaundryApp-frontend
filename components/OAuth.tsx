import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  View,
  Image
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { icons } from "@/constants";

// Ensures any browser modal gracefully completes in Expo environments
WebBrowser.maybeCompleteAuthSession();

// Hardcoded fallback if your environment variables aren't loaded yet
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

export default function OAuth() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // 1. Fetch the dynamic sign-in URL from your Spring Boot controller
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/google/signin-url`);
      
      if (!response.ok) {
        throw new Error("Failed to get authentication URL from server.");
      }

      const data = await response.json();
      const targetUrl = data.signin_url;

      if (!targetUrl) {
        throw new Error("Invalid response format from authentication server.");
      }

      // 2. Open the URL in the system browser or an in-app modal
      // This hands off the entire flow over to Spring Boot + Google
      const result = await WebBrowser.openAuthSessionAsync(targetUrl);

      // 3. (Optional) Check the result of the browser interaction
      if (result.type === "success") {
        // You can intercept success callbacks or let your deeper linking infrastructure handle token capture
        console.log("Browser closed successfully", result.url);
      }
      
    } catch (error: any) {
      console.error("OAuth Error: ", error);
      Alert.alert(
        "Sign In Failed",
        error?.message || "Could not connect to the authentication server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleGoogleSignIn}
      disabled={loading}
      activeOpacity={0.85}
      className={`w-full h-14 rounded-2xl border border-slate-200 flex-row items-center justify-center space-x-3 mb-4 ${
        loading ? "bg-slate-50" : "bg-white"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#64748b" />
      ) : (
        <View className="flex-row items-center justify-center">
          
         
          <View className="mr-3">
            <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
          />
            
          </View>

          <Text className="text-slate-700 text-[16px] font-semibold tracking-wide">
            Continue with Google
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}