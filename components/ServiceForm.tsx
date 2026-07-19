import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreateServiceItemPayload } from '@/lib/api';
import { PricingModel, ServiceCategory } from '@/types/type';
import { businessApi } from '@/lib/api';

const EMPTY_SERVICE: CreateServiceItemPayload = {
  name: '',
  description: '',
  unitPrice: 0,
  pricingModel: PricingModel.PER_KG,
  unit: 0,
  category: ServiceCategory.WASH_AND_FOLD,
};

interface ServiceFormProps {
  accountId: string;
  onSuccess: () => void;
}

export default function ServiceForm({ accountId, onSuccess }: ServiceFormProps) {
  const [form, setForm] = useState<CreateServiceItemPayload>(EMPTY_SERVICE);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!form.name || form.unitPrice <= 0) {
      Alert.alert('Validation', 'Name and price are required');
      return;
    }
    setCreating(true);
    try {
      await businessApi.createServiceItem(form);
      Alert.alert('Success', 'Service item created!');
      setForm(EMPTY_SERVICE);
      onSuccess();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
      <Text className="font-bold text-slate-900 mb-4">Add New Service</Text>

      {[
        { key: 'name', label: 'Service Name *', placeholder: 'Wash & Fold' },
        { key: 'description', label: 'Description', placeholder: 'General cleaning' },
      ].map(({ key, label, placeholder }) => (
        <View key={key} className="mb-3">
          <Text className="text-xs text-slate-500 font-semibold mb-1.5">{label}</Text>
          <TextInput
            value={(form as any)[key] ?? ''}
            onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            className="bg-slate-100 rounded-xl px-4 py-3 text-slate-800 text-sm"
          />
        </View>
      ))}

      <View className="mb-3">
        <Text className="text-xs text-slate-500 font-semibold mb-1.5">Price per unit (GHS) *</Text>
        <TextInput
          value={form.unitPrice > 0 ? String(form.unitPrice) : ''}
          onChangeText={v => setForm(f => ({ ...f, unitPrice: parseFloat(v) || 0 }))}
          placeholder="0.00"
          placeholderTextColor="#94a3b8"
          keyboardType="decimal-pad"
          className="bg-slate-100 rounded-xl px-4 py-3 text-slate-800 text-sm"
        />
      </View>

      <View className="mb-4">
        <Text className="text-xs text-slate-500 font-semibold mb-2">Pricing Model</Text>
        <View className="flex-row gap-3">
          {[PricingModel.PER_KG, PricingModel.PER_ITEM].map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setForm(f => ({ ...f, pricingModel: m }))}
              className={`flex-1 py-2.5 rounded-xl items-center border ${form.pricingModel === m ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-sm font-semibold ${form.pricingModel === m ? 'text-white' : 'text-slate-600'}`}>
                {m === PricingModel.PER_KG ? 'Per KG' : 'Per Item'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-xs text-slate-500 font-semibold mb-2">Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {(Object.values(ServiceCategory) as ServiceCategory[]).map((cat) => (
            <TouchableOpacity
            key={cat}
            onPress={() => setForm(f => ({ ...f, category: cat }))}
            className={`px-3 py-2 rounded-xl border ${form.category === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
            >
            <Text className={`text-xs font-semibold ${form.category === cat ? 'text-white' : 'text-slate-600'}`}>
                {String(cat).replace(/_/g, ' ')}
            </Text>
            </TouchableOpacity>
        ))}
        </View>
        </ScrollView>
      </View>

      <TouchableOpacity
        onPress={handleCreate}
        disabled={creating}
        className={`rounded-xl py-4 items-center ${creating ? 'bg-blue-300' : 'bg-blue-600'}`}
      >
        {creating
          ? <ActivityIndicator color="#fff" />
          : <Text className="text-white font-bold">Create Service Item</Text>}
      </TouchableOpacity>
    </View>
  );
}