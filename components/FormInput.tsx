// ============================================================
//  components/FormInput.tsx
//  Shared text input used across all three registration screens
//  — keeps the visual style consistent without repeating the
//  same className block in every file.
// ============================================================

import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, ...inputProps }: FormInputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-slate-700 mb-1.5">
        {label}
      </Text>
      <TextInput
        className={`h-14 rounded-xl border-[1.5px] px-4 text-base text-slate-900 bg-white ${
          error ? "border-red-400" : "border-slate-200"
        }`}
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        {...inputProps}
      />
      {error && (
        <Text className="text-xs text-red-500 mt-1">{error}</Text>
      )}
    </View>
  );
}