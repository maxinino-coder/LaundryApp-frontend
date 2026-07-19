import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { login, ApiError } from "@/lib/auth";
import FormInput from "../../components/FormInput";
import OAuth from "../../components/OAuth"; // The Google Sign In component built previously
import { saveAuthResponse } from "../../utils/tokenStoreage"; 


export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Helper to resolve the correct Expo Router directory layout per actor role
  function getHomeRouteForRole(role: string): Href {
    const formattedRole = role.toUpperCase();
    if (formattedRole === "USER") return "../(root)/(user)/(tabs)/home";
    if (formattedRole === "BUSINESS") return "../(root)/(business)/(tabs)/dashboard";
    if (formattedRole === "RIDER") return "../(root)/(rider)/(tabs)/jobs";
    return "../(root)/(user)/home"; // Default safety fallback
  }

  function validate(): boolean {
    const nextErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

 async function handleLogin() {
  if (!validate()) return;
  setLoading(true);
  try {
    const authResponse = await login({
      email: email.trim().toLowerCase(),
      password,
    });
    await saveAuthResponse(authResponse);
    router.replace(getHomeRouteForRole(authResponse.role));
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
    Alert.alert("Login Failed", message);
  } finally {
    setLoading(false);
  }
}

  return (
    <SafeAreaView className="flex-1 bg-slate-50/30">
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header Section */}
          <View className="items-center mb-8">
            {/* Replace this View with your local Image asset if you have a .png icon file */}
            <View className="w-20 h-20 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
              <Ionicons name="water-outline" size={42} color="#ffffff" />
            </View>
            
            <Text className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Welcome back
            </Text>
            <Text className="text-base text-slate-500">
              Log in to your FreshPress account
            </Text>
          </View>

          {/* Input Fields */}
          <View className="space-y-4 mb-4">
            <FormInput
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View className="relative">
              <FormInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                error={errors.password}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[42px]"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity 
            onPress={() => router.push("/(auth)/forgot-password")} 
            className="self-end mb-6"
          >
            <Text className="text-sm font-semibold text-blue-600">
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            className={`h-14 rounded-2xl items-center justify-center mb-6 ${
              loading ? "bg-blue-500/80" : "bg-blue-600"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                Login
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider line */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-slate-200" />
            <Text className="text-sm text-slate-400 mx-4 font-medium">or continue with</Text>
            <View className="flex-1 h-[1px] bg-slate-200" />
          </View>

          {/* Google Authentication Button Component */}
          <OAuth />

          {/* Footer Navigation */}
          <View className="flex-row justify-center items-center mt-auto pt-6">
            <Text className="text-slate-500 text-sm">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/role-selection")}>
              <Text className="text-sm font-bold text-blue-600">
                Register
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}