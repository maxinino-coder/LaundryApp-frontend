import React from 'react';
import { TouchableOpacity, View, Text } from "react-native";
import { RoleCardProps } from "@/types/type";

 
export function RoleCard({ option, selected, onPress }: RoleCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className={`flex-row items-center rounded-2xl px-4 py-[18px] border-[1.5px] ${
        selected ? "bg-blue-50 border-blue-600" : "bg-white border-slate-200"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Icon box */}
      <View className="w-[52px] h-[52px] rounded-[14px] bg-blue-50 items-center justify-center mr-4">
        {option.icon}
      </View>
 
      {/* Labels */}
      <View className="flex-1">
        <Text className="text-[17px] font-bold text-slate-900 mb-0.5">
          {option.title}
        </Text>
        <Text className="text-[13px] text-slate-500">{option.subtitle}</Text>
      </View>
 
      {/* Radio button */}
      <View
        className={`w-[22px] h-[22px] rounded-full border-2 items-center justify-center ${
          selected ? "border-blue-600" : "border-slate-300"
        }`}
      >
        {selected && (
          <View className="w-[10px] h-[10px] rounded-full bg-blue-600" />
        )}
      </View>
    </TouchableOpacity>
  );
}