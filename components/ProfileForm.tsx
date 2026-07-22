import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import FormInput from '@/components/FormInput';
import { businessApi, BusinessInfo } from '@/lib/api';

interface Props {
  accountId: string;
  profile: BusinessInfo | null;
  onUpdate: () => void; // re-fetch parent data after a successful save
}

// Fields intentionally left out of this form:
//   - id            → immutable, system-assigned
//   - latitude/longitude → system-set from geocoding, not user-editable
export default function BusinessProfileForm({ accountId, profile, onUpdate }: Props) {
  const [form, setForm] = useState<Partial<BusinessInfo>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName,
        description: profile.description,
        logoUrl: profile.logoUrl,
        bannerUrl: profile.bannerUrl,
        address: profile.address,
        city: profile.city,
        isOpen: profile.isOpen,
        openingTime: profile.openingTime,
        closingTime: profile.closingTime,
        bankName: profile.bankName,
        bankAccountNo: profile.bankAccountNo,
        bankAccountName: profile.bankAccountName,
        momoNumber: profile.momoNumber,
      });
    }
  }, [profile]);

  function update<K extends keyof BusinessInfo>(key: K, value: BusinessInfo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await businessApi.updateBusinessInfo(accountId, form);
      Alert.alert('Saved', 'Your business profile has been updated.');
      onUpdate();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView className="flex-1 px-5 pt-5">
      {/* Business ID — read-only, shown ONLY on this admin page */}
      <View className="bg-slate-100 rounded-xl p-3 mb-5">
        <Text className="text-xs text-slate-400 mb-0.5">Business ID</Text>
        <Text className="text-sm font-mono text-slate-600">{accountId}</Text>
      </View>

      <FormInput
        label="Business Name"
        value={form.businessName ?? ''}
        onChangeText={(v) => update('businessName', v)}
        autoCapitalize="words"
      />
      <FormInput
        label="Description"
        value={form.description ?? ''}
        onChangeText={(v) => update('description', v)}
      />
      <FormInput
        label="Address"
        value={form.address ?? ''}
        onChangeText={(v) => update('address', v)}
        autoCapitalize="words"
      />
      <FormInput
        label="City"
        value={form.city ?? ''}
        onChangeText={(v) => update('city', v)}
        autoCapitalize="words"
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormInput
            label="Opening Time"
            placeholder="e.g. 08:00"
            value={form.openingTime ?? ''}
            onChangeText={(v) => update('openingTime', v)}
          />
        </View>
        <View className="flex-1">
          <FormInput
            label="Closing Time"
            placeholder="e.g. 20:00"
            value={form.closingTime ?? ''}
            onChangeText={(v) => update('closingTime', v)}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-4 border border-slate-100">
        <View>
          <Text className="font-bold text-slate-900">Shop Status</Text>
          <Text className="text-xs text-slate-400">{form.isOpen ? 'Currently open' : 'Currently closed'}</Text>
        </View>
        <Switch
          value={!!form.isOpen}
          onValueChange={(v) => update('isOpen', v)}
          trackColor={{ true: '#2563EB' }}
        />
      </View>

      <Text className="text-base font-bold text-slate-900 mb-2 mt-2">Payout Details</Text>
      <FormInput
        label="Bank Name"
        value={form.bankName ?? ''}
        onChangeText={(v) => update('bankName', v)}
      />
      <FormInput
        label="Bank Account Number"
        value={form.bankAccountNo ?? ''}
        onChangeText={(v) => update('bankAccountNo', v)}
        keyboardType="numeric"
      />
      <FormInput
        label="Bank Account Name"
        value={form.bankAccountName ?? ''}
        onChangeText={(v) => update('bankAccountName', v)}
      />
      <FormInput
        label="Mobile Money Number"
        value={form.momoNumber ?? ''}
        onChangeText={(v) => update('momoNumber', v)}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className={`h-14 rounded-2xl items-center justify-center my-6 ${saving ? 'bg-blue-400' : 'bg-blue-600'}`}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}