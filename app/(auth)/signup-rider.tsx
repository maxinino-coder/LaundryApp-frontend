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
import {
  registerRider,
  ApiError,
  RegisterRiderRequest,
} from "@/lib/auth";
import { saveAuthResponse, getHomeRouteForRole } from "../../utils/tokenStoreage";
import { RiderFormState ,  VehicleType,RiderType
} from "@/types/type";



const initialForm: RiderFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  vehicleType: null,
  riderType: "CONTRACT",
  businessId: "",
};

const vehicleOptions: { value: VehicleType; label: string; icon: string }[] = [
  { value: "BICYCLE", label: "Bicycle", icon: "bike" },
  { value: "MOTORCYCLE", label: "Motorcycle", icon: "moped" },
  { value: "CAR", label: "Car", icon: "car-outline" },
  { value: "VAN", label: "Van", icon: "van-utility" },
];

export default function SignupRider() {
  const [form, setForm] = useState<RiderFormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof RiderFormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update<K extends keyof RiderFormState>(key: K, value: RiderFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function selectRiderType(type: RiderType) {
    // Switching to CONTRACT clears any chosen businessId —
    // matches the backend rule: CONTRACT riders must not be
    // linked to a business at all.
    setForm((prev) => ({
      ...prev,
      riderType: type,
      businessId: type === "CONTRACT" ? "" : prev.businessId,
    }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof RiderFormState, string>> = {};

    if (!form.firstName.trim()) next.firstName = "First name is required";
    if (!form.lastName.trim()) next.lastName = "Last name is required";

    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address";

    if (!form.phone.trim()) next.phone = "Phone number is required";
    if (!form.vehicleType) next.vehicleType = "Select a vehicle type";

    // EMPLOYED riders MUST have a businessId — mirrors the
    // backend's CHECK constraint (chk_rider_type_business)
    if (form.riderType === "EMPLOYED" && !form.businessId.trim()) {
      next.businessId = "Enter the business ID you're employed by";
    }

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
      const payload: RegisterRiderRequest = {
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        vehicleType: form.vehicleType as VehicleType,
        riderType: form.riderType,
        // null for CONTRACT riders — matches backend expectation exactly
        businessId: form.riderType === "CONTRACT" ? null : form.businessId.trim(),
      };

      const authResponse = await registerRider(payload);
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
              <MaterialCommunityIcons name="moped-outline" size={26} color="#2563EB" />
            </View>
            <Text className="text-[28px] font-extrabold text-slate-900 tracking-tight mb-1.5">
              Become a rider
            </Text>
            <Text className="text-[15px] text-slate-500 leading-5">
              Deliver laundry orders and earn on your own schedule.
            </Text>
          </View>

          {/* Name row */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormInput
                label="First Name"
                placeholder="James"
                value={form.firstName}
                onChangeText={(v) => update("firstName", v)}
                error={errors.firstName}
                autoCapitalize="words"
              />
            </View>
            <View className="flex-1">
              <FormInput
                label="Last Name"
                placeholder="Mensah"
                value={form.lastName}
                onChangeText={(v) => update("lastName", v)}
                error={errors.lastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <FormInput
            label="Email"
            placeholder="james@example.com"
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

          {/* ── Vehicle type selector ── */}
          <Text className="text-sm font-semibold text-slate-700 mb-2">
            Vehicle Type
          </Text>
          <View className="flex-row flex-wrap gap-2.5 mb-1">
            {vehicleOptions.map((opt) => {
              const selected = form.vehicleType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => update("vehicleType", opt.value)}
                  activeOpacity={0.85}
                  className={`flex-row items-center gap-1.5 rounded-xl px-4 py-3 border-[1.5px] ${
                    selected
                      ? "bg-blue-50 border-blue-600"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={18}
                    color={selected ? "#2563EB" : "#64748b"}
                  />
                  <Text
                    className={`text-sm font-semibold ${
                      selected ? "text-blue-600" : "text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.vehicleType && (
            <Text className="text-xs text-red-500 mb-3">{errors.vehicleType}</Text>
          )}
          <View className="mb-5" />

          {/* ── Rider type selector ── */}
          <Text className="text-sm font-semibold text-slate-700 mb-2">
            How will you work?
          </Text>
          <View className="gap-2.5 mb-4">
            <TouchableOpacity
              onPress={() => selectRiderType("CONTRACT")}
              activeOpacity={0.85}
              className={`flex-row items-center rounded-xl px-4 py-3.5 border-[1.5px] ${
                form.riderType === "CONTRACT"
                  ? "bg-blue-50 border-blue-600"
                  : "bg-white border-slate-200"
              }`}
            >
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-slate-900">
                  Contract Rider
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Work independently, accept jobs from any business
                </Text>
              </View>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  form.riderType === "CONTRACT" ? "border-blue-600" : "border-slate-300"
                }`}
              >
                {form.riderType === "CONTRACT" && (
                  <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => selectRiderType("EMPLOYED")}
              activeOpacity={0.85}
              className={`flex-row items-center rounded-xl px-4 py-3.5 border-[1.5px] ${
                form.riderType === "EMPLOYED"
                  ? "bg-blue-50 border-blue-600"
                  : "bg-white border-slate-200"
              }`}
            >
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-slate-900">
                  Employed Rider
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Work exclusively for one laundry business
                </Text>
              </View>
              <View
                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                  form.riderType === "EMPLOYED" ? "border-blue-600" : "border-slate-300"
                }`}
              >
                {form.riderType === "EMPLOYED" && (
                  <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Conditional businessId field — only for EMPLOYED riders.
              Mirrors the backend rule: EMPLOYED requires a business,
              CONTRACT must have none. */}
          {form.riderType === "EMPLOYED" && (
            <FormInput
              label="Business ID"
              placeholder="Paste the business ID you're employed by"
              value={form.businessId}
              onChangeText={(v) => update("businessId", v)}
              error={errors.businessId}
            />
          )}

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
                Create Rider Account
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