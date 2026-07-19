import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function BusinessLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e2e8f0', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="orders" 
        options={{ 
          title: 'Orders', 
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-list-outline" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="catalog" 
        options={{ 
          title: 'Catalog', 
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="store-outline" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="clients" 
        options={{ 
          title: 'Clients', 
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> 
        }} 
      />
     <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="admin" 
        options={{ 
          title: 'Admin', 
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />
        }} 

      />
    </Tabs>
  );
}