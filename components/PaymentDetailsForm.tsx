import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { BusinessInfo } from '@/types/type';
import { businessApi } from '@/lib/api';

interface PaymentDetailsFormProps {
  accountId: string;
  profile: Partial<BusinessInfo>;
}

export default function PaymentDetailsForm({ accountId, profile }: PaymentDetailsFormProps) {
  const [form, setForm] = useState<Partial<BusinessInfo>>({
    momoNumber: profile?.momoNumber ?? '',
    bankName: profile?.bankName ?? '',
    bankAccountNo: profile?.bankAccountNo ?? '',
    bankAccountName: profile?.bankAccountName ?? '',
  });

  const fields = [
    { key: 'momoNumber', label: 'MoMo Number', placeholder: '024 123 4567', keyboardType: 'phone-pad' as const },
    { key: 'bankName', label: 'Bank Name', placeholder: 'GCB Bank', keyboardType: 'default' as const },
    { key: 'bankAccountNo', label: 'Account Number', placeholder: '1234567890', keyboardType: 'phone-pad' as const },
    { key: 'bankAccountName', label: 'Account Name', placeholder: 'John Laundry Ltd', keyboardType: 'default' as const },
  ];

  const handleSave = async () => {
    if (!accountId) return;
    try {
      await businessApi.updateBusinessInfo(accountId, form);
      Alert.alert('Success', 'Payment details saved!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <>
      {fields.map(({ key, label, placeholder, keyboardType }) => (
        <View key={key} className="mb-4">
          <Text className="text-xs text-slate-500 font-semibold mb-1.5">{label}</Text>
          <TextInput
            value={(form as any)[key] ?? ''}
            onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            keyboardType={keyboardType}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm"
          />
        </View>
      ))}

      <TouchableOpacity
        onPress={handleSave}
        className="bg-blue-600 rounded-2xl py-4 items-center mb-8"
      >
        <Text className="text-white font-bold">Save Payment Details</Text>
      </TouchableOpacity>
    </>
  );
}