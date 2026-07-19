import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { conversationApi } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';

interface ConversationPreview {
  conversationId: string;
  supabaseChannel: string;
  otherName: string;
  otherAccountId: string;
  lastMessage?: string;
  lastTime?: string;
  unread?: number;
  orderId?: string;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // In production, fetch conversation list from backend
  // For now we keep a local cache from started conversations
  useFocusEffect(
    useCallback(() => {
      setLoading(false);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // Re-fetch conversations
    setRefreshing(false);
  };

  function openConversation(conv: ConversationPreview) {
    router.push({
      pathname: '/(user)/messages/[conversationId]' as any,
      params: {
        conversationId: conv.conversationId,
        supabaseChannel: conv.supabaseChannel,
        otherName: conv.otherName,
        otherAccountId: conv.otherAccountId,
        orderId: conv.orderId ?? '',
        calleeId: conv.otherAccountId,
      },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text className="text-2xl font-extrabold text-slate-900">Messages</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="mx-5 mb-4 flex-row items-center bg-white rounded-2xl px-4 py-3 gap-3 border border-slate-100">
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          placeholder="Search conversations..."
          placeholderTextColor="#94a3b8"
          className="flex-1 text-sm text-slate-700"
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 mb-3 flex-row items-center gap-4 border border-slate-100"
              onPress={() => openConversation(item)}
            >
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name="person" size={22} color="#2563EB" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-0.5">
                  <Text className="font-bold text-slate-900">{item.otherName}</Text>
                  {item.lastTime && (
                    <Text className="text-xs text-slate-400">{item.lastTime}</Text>
                  )}
                </View>
                <Text className="text-sm text-slate-500" numberOfLines={1}>
                  {item.lastMessage ?? 'Tap to open conversation'}
                </Text>
              </View>
              {item.unread ? (
                <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{item.unread}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="chatbubbles-outline" size={56} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3 text-center">
                No conversations yet.{'\n'}Conversations start when you contact a rider or business.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}