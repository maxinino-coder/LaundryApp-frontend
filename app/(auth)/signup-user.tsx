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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { UserFormState, RegisterUserRequest } from "@/types/type";
import { ApiError, registerUser } from "@/lib/auth";
import { saveAuthResponse,getHomeRouteForRole  } from "../../utils/tokenStoreage";
import FormInput from "@/components/FormInput";



 

const initialForm: UserFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function SignUpUser() {
  const [form, setForm] = useState<UserFormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
 
  function update<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }
 
  function validate(): boolean {
    const next: Partial<Record<keyof UserFormState, string>> = {};
 
    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
 
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address";
 
    if (!form.phone.trim()) next.phone = "Phone number is required";
 
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8)
      next.password = "Password must be at least 8 characters";
 
    if (form.confirmPassword !== form.password)
      next.confirmPassword = "Passwords do not match";
 
    setErrors(next);
    return Object.keys(next).length === 0;
  }
 
  async function handleRegister() {
    if (!validate()) return;
 
    setLoading(true);
    try {
      const payload: RegisterUserRequest = {
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      };
 
      const authResponse = await registerUser(payload);
      await saveAuthResponse(authResponse);
      
 
      router.replace(getHomeRouteForRole(authResponse.role));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      Alert.alert("Registration failed", message);
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#ffffff", "#dbeafe", "#ffffff"]}
        locations={[0, 0.3, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
 
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Top bar */}
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <Ionicons name="arrow-back" size={26} color="#0f172a" />
          </TouchableOpacity>
        </View>
 
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Heading */}
          <View className="mb-7 mt-2">
            <View className="w-14 h-14 rounded-2xl bg-blue-50 items-center justify-center mb-4">
              <Ionicons name="person-outline" size={26} color="#2563EB" />
            </View>
            <Text className="text-[28px] font-extrabold text-slate-900 tracking-tight mb-1.5">
              Create your account
            </Text>
            <Text className="text-[15px] text-slate-500 leading-5">
              Order laundry services and get them delivered to your door.
            </Text>
          </View>
 
          {/* Name row */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormInput
                label="First Name"
                placeholder="John"
                value={form.firstName}
                onChangeText={(v) => update("firstName", v)}
                error={errors.firstName}
                autoCapitalize="words"
              />
            </View>
            <View className="flex-1">
              <FormInput
                label="Last Name"
                placeholder="Doe"
                value={form.lastName}
                onChangeText={(v) => update("lastName", v)}
                error={errors.lastName}
                autoCapitalize="words"
              />
            </View>
          </View>
 
          <FormInput
            label="Email"
            placeholder="john@example.com"
            value={form.email}
            onChangeText={(v) => update("email", v)}
            error={errors.email}
            keyboardType="email-address"
          />
 
          <FormInput
            label="Phone Number"
            placeholder="024 123 4567"
            value={form.phone}
            onChangeText={(v) => update("phone", v)}
            error={errors.phone}
            keyboardType="phone-pad"
          />
 
          <FormInput
            label="Password"
            placeholder="At least 8 characters"
            value={form.password}
            onChangeText={(v) => update("password", v)}
            error={errors.password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
 
          <FormInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChangeText={(v) => update("confirmPassword", v)}
            error={errors.confirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
 
          <TouchableOpacity
            onPress={() => setShowPassword((s) => !s)}
            className="flex-row items-center self-start mb-6 -mt-1"
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={16}
              color="#64748b"
            />
            <Text className="text-xs text-slate-500 ml-1.5">
              {showPassword ? "Hide" : "Show"} password
            </Text>
          </TouchableOpacity>
 
          {/* Register button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            className={`h-14 rounded-2xl items-center justify-center mb-5 ${
              loading ? "bg-blue-400" : "bg-blue-600"
            }`}
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-[17px] font-bold tracking-wide">
                Create Account
              </Text>
            )}
          </TouchableOpacity>
 
          {/* Login link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-slate-500">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
              <Text className="text-sm font-bold text-blue-600">Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
 