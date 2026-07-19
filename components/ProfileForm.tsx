import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch, ScrollView
} from 'react-native';
import { BusinessInfo } from '@/types/type';
import { businessApi } from '@/lib/api';

interface ProfileFormProps {
  accountId: string;
  profile: BusinessInfo | null;
  onUpdate: () => void;
}

export default function ProfileForm({ accountId, profile, onUpdate }: ProfileFormProps) {
  const [form, setForm] = useState<Partial<BusinessInfo>>({
    businessName: profile?.businessName ?? '',
    address: profile?.address ?? '',
    city: profile?.city ?? '',
    description: profile?.description ?? '',
    openingTime: profile?.openingTime ?? '',
    closingTime: profile?.closingTime ?? '',
    isOpen: profile?.isOpen ?? false,
  });
  const [saving, setSaving] = useState(false);

  const fields = [
    { key: 'businessName', label: 'Business Name', placeholder: 'Your laundry name' },
    { key: 'address', label: 'Address', placeholder: '123 Main St' },
    { key: 'city', label: 'City', placeholder: 'Accra' },
    { key: 'description', label: 'Description', placeholder: 'About your business...' },
    { key: 'openingTime', label: 'Opening Time', placeholder: '08:00' },
    { key: 'closingTime', label: 'Closing Time', placeholder: '18:00' },
  ];

  const handleSave = async () => {
    if (!accountId) return;
    setSaving(true);
    try {
      await businessApi.updateBusinessInfo(accountId, form);
      Alert.alert('Success', 'Profile updated!');
      onUpdate();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 px-5 pt-5">
      {fields.map(({ key, label, placeholder }) => (
        <View key={key} className="mb-4">
          <Text className="text-xs text-slate-500 font-semibold mb-1.5">{label}</Text>
          <TextInput
            value={(form as any)[key] ?? ''}
            onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            multiline={key === 'description'}
            numberOfLines={key === 'description' ? 3 : 1}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm"
          />
        </View>
      ))}

      <View className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 mb-6">
        <Text className="text-slate-700 font-semibold">Business is Open</Text>
        <Switch
          value={form.isOpen ?? false}
          onValueChange={v => setForm(f => ({ ...f, isOpen: v }))}
          trackColor={{ true: '#2563EB' }}
        />
      </View>

      <TouchableOpacity
        disabled={saving}
        onPress={handleSave}
        className={`rounded-2xl py-4 items-center mb-8 ${saving ? 'bg-blue-300' : 'bg-blue-600'}`}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text className="text-white font-bold">Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}