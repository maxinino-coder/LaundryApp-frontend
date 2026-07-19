import React, { useState } from 'react';
import { View, Text, Switch } from 'react-native';

interface NotificationItem {
  label: string;
  sub: string;
  defaultEnabled?: boolean;
}

interface NotificationToggleProps {
  items: NotificationItem[];
}

export default function NotificationToggle({ items }: NotificationToggleProps) {
  const [states, setStates] = useState<Record<number, boolean>>(
    items.reduce((acc, _, index) => ({ ...acc, [index]: items[index].defaultEnabled ?? true }), {})
  );

  const handleToggle = (index: number) => {
    setStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <>
      {items.map((n, i) => (
        <View key={i} className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between border border-slate-100">
          <View>
            <Text className="font-bold text-slate-900">{n.label}</Text>
            <Text className="text-xs text-slate-400">{n.sub}</Text>
          </View>
          <Switch
            value={states[i] ?? false}
            onValueChange={() => handleToggle(i)}
            trackColor={{ true: '#2563EB' }}
          />
        </View>
      ))}
    </>
  );
}