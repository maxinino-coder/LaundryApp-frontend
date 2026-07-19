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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import FormInput from "../../components/FormInput";

import { saveAuthResponse, getHomeRouteForRole } from "../../utils/tokenStoreage";
import { BusinessFormState, RegisterBusinessRequest } from "@/types/type";
import { ApiError, registerBusiness } from "@/lib/auth";



const initialForm: BusinessFormState = {
  businessName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  password: "",
  confirmPassword: "",
};

export default function SignUpBusiness() {
  const [form, setForm] = useState<BusinessFormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessFormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update<K extends keyof BusinessFormState>(key: K, value: BusinessFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof BusinessFormState, string>> = {};

    if (!form.businessName.trim()) next.businessName = "Business name is required";

    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address";

    if (!form.phone.trim()) next.phone = "Phone number is required";
    if (!form.address.trim()) next.address = "Address is required";
    if (!form.city.trim()) next.city = "City is required";

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
      const payload: RegisterBusinessRequest = {
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        businessName: form.businessName.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
      };

      const authResponse = await registerBusiness(payload);
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
              <MaterialCommunityIcons name="domain" size={26} color="#2563EB" />
            </View>
            <Text className="text-[28px] font-extrabold text-slate-900 tracking-tight mb-1.5">
              Register your business
            </Text>
            <Text className="text-[15px] text-slate-500 leading-5">
              List your laundry shop and start receiving orders.
            </Text>
          </View>

          <FormInput
            label="Business Name"
            placeholder="QuickWash Laundry"
            value={form.businessName}
            onChangeText={(v) => update("businessName", v)}
            error={errors.businessName}
            autoCapitalize="words"
          />

          <FormInput
            label="Email"
            placeholder="contact@quickwash.com"
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
            label="Business Address"
            placeholder="12 Spintex Road"
            value={form.address}
            onChangeText={(v) => update("address", v)}
            error={errors.address}
            autoCapitalize="words"
          />

          <FormInput
            label="City"
            placeholder="Accra"
            value={form.city}
            onChangeText={(v) => update("city", v)}
            error={errors.city}
            autoCapitalize="words"
          />

          <FormInput
            label="Password"
            placeholder="At least 8 characters"
            value={form.password}
            onChangeText={(v) => update("password", v)}
            error={errors.password}
            secureTextEntry={!showPassword}
          />

          <FormInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChangeText={(v) => update("confirmPassword", v)}
            error={errors.confirmPassword}
            secureTextEntry={!showPassword}
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

          {/* Info banner */}
          <View className="flex-row items-start bg-amber-50 rounded-xl p-3.5 mb-6 border border-amber-200">
            <Ionicons name="information-circle-outline" size={18} color="#D97706" />
            <Text className="text-xs text-amber-700 ml-2 flex-1 leading-4">
              You'll set up your service catalogue and payout details after
              creating your account.
            </Text>
          </View>

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
                Register Business
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-slate-500">
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/sign-in")}>
              <Text className="text-sm font-bold text-blue-600">Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}