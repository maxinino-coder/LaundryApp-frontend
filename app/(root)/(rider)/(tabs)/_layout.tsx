import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function RiderLayout() {
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
        name="jobs" 
        options={{ 
          title: 'Jobs', 
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cash-multiple" size={size} color={color} />        }} 
      />
      <Tabs.Screen 
        name="earnings" 
        options={{ 
          title: 'Earnings', 
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-list-outline" size={size} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="route" 
        options={{ 
          title: 'Route', 
        tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} />            
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
        name="profile" 
        options={{ 
          title: 'Profile', 
      tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />         
      }} 
      />
    </Tabs>
  );
}