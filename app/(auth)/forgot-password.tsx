import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import React from "react";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Validation", "Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      // TODO: Call your API
      // await axios.post(`${BASE_URL}/auth/forgot-password`, {
      //   email,
      // });

      Alert.alert(
        "Success",
        "A password reset link has been sent to your email."
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to send password reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">

        {/* Logo */}
        <View className="items-center mb-10">
          <View className="h-24 w-24 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white text-4xl font-bold">L</Text>
          </View>
        </View>

        {/* Heading */}
        <Text className="text-3xl font-bold text-center text-gray-900">
          Forgot Password
        </Text>

        <Text className="text-center text-gray-500 mt-3 mb-10">
          Enter the email associated with your account and we'll send you a
          password reset link.
        </Text>

        {/* Email */}
        <View className="mb-6">
          <Text className="text-gray-700 mb-2 font-medium">
            Email Address
          </Text>

          <TextInput
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            className="border border-gray-300 rounded-xl px-4 py-4 text-base"
          />
        </View>

        {/* Button */}
        <TouchableOpacity
          onPress={handleForgotPassword}
          disabled={loading}
          className="bg-blue-600 rounded-xl py-4 items-center"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">
              Send Reset Link
            </Text>
          )}
        </TouchableOpacity>

        {/* Back */}
        <TouchableOpacity
          className="mt-8"
          onPress={() => router.back()}
        >
          <Text className="text-center text-blue-600 font-semibold">
            Back to Login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}