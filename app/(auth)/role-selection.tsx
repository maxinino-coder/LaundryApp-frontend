import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,

  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { RoleCard } from "@/components/RoleCard";
import { RoleOption } from "@/types/type";
type Role = "customer" | "business" | "rider" | null;
 
const roles: RoleOption[] = [
  {
    id: "customer",
    title: "Customer",
    subtitle: "Order laundry services",
    icon: <Ionicons name="person-outline" size={28} color="#2563EB" />,
  },
  {
    id: "business",
    title: "Business",
    subtitle: "Manage your laundry shop",
    icon: <MaterialCommunityIcons name="domain" size={28} color="#2563EB" />,
  },
  {
    id: "rider",
    title: "Rider",
    subtitle: "Deliver orders and earn",
    icon: (
      <MaterialCommunityIcons name="moped-outline" size={28} color="#2563EB" />
    ),
  },
];

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
 
  function handleContinue() {
    if (!selectedRole) return;
    switch (selectedRole) {
      case "customer":
        router.push("/(auth)/signup-user");
        break;
      case "business":
        router.push("/(auth)/signup-business");
        break;
      case "rider":
        router.push("/(auth)/signup-rider");
        break;
    }
  }
 
  const canContinue = selectedRole !== null;
 
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
 
      {/* Gradient background */}
      <LinearGradient
        colors={["#ffffff", "#dbeafe", "#c7d7f5"]}
        locations={[0, 0.4, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
 
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons
            name="tshirt-crew-outline"
            size={22}
            color="#2563EB"
          />
          <Text className="text-xl font-bold text-blue-600 tracking-tight">
            LaundryApp
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="help-circle-outline" size={28} color="#374151" />
        </TouchableOpacity>
      </View>
 
      {/* Content */}
      <View className="flex-1 px-5 justify-center">
 
        {/* Heading */}
        <View className="items-center mb-8">
          <Text className="text-[32px] font-extrabold text-slate-900 text-center tracking-tight mb-2">
            I am a...
          </Text>
          <Text className="text-[15px] text-slate-500 text-center leading-6">
            Choose your profile to get started with{"\n"}LaundryApp services.
          </Text>
        </View>
 
        {/* Role cards */}
        <View className="gap-3.5 mb-8">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              option={role}
              selected={selectedRole === role.id}
              onPress={() => setSelectedRole(role.id)}
            />
          ))}
        </View>
 
        {/* Continue button */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
          className={`h-14 rounded-2xl items-center justify-center mb-4 ${
            canContinue ? "bg-blue-600" : "bg-slate-300"
          }`}
          style={
            canContinue
              ? {
                  shadowColor: "#2563EB",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }
              : undefined
          }
        >
          <Text
            className={`text-[17px] font-bold tracking-wide ${
              canContinue ? "text-white" : "text-slate-400"
            }`}
          >
            Continue
          </Text>
        </TouchableOpacity>
 
        {/* Login link */}
        <View className="flex-row justify-center items-center pb-2">
          <Text className="text-sm text-slate-500">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/sign-in")}>
            <Text className="text-sm font-bold text-blue-600">Log In</Text>
          </TouchableOpacity>
        </View>
 
      </View>
    </SafeAreaView>
  );
}
 