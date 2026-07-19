import React from 'react';
import { Stack,} from 'expo-router';
export default function BusinessLayout() {
  return (
     <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="orders" options={{ headerShown: false }} />
        <Stack.Screen name="catalog" options={{ headerShown: false }} />
        <Stack.Screen name="clients" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="messages" options={{ headerShown: false }} />
        <Stack.Screen name="messages/[conversationId]" options={{ headerShown: false }} />
      
      </Stack>
  );
}