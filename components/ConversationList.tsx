import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { conversationApi } from '@/lib/api';
import { ConversationSummary } from '@/types/type';

interface Props {
  /** Role route group the chat screen lives under, e.g. "(user)" */
  roleGroup: '(user)' | '(business)' | '(rider)';
}

/**
 * Shared conversation list for all three roles. Fetches real
 * conversations from the backend and opens the role-correct chat route.
 */
export default function ConversationList({ roleGroup }: Props) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await conversationApi.list();
      setConversations(data);
    } catch (e: any) {
      console.warn('Conversations load failed:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const filtered = search.trim()
    ? conversations.filter(c =>
        c.otherName?.toLowerCase().includes(search.trim().toLowerCase()) ||
        c.orderNumber?.toLowerCase().includes(search.trim().toLowerCase()))
    : conversations;

  const openChat = (c: ConversationSummary) => {
    router.push({
      pathname: `/(root)/${roleGroup}/messages/[conversationId]` as any,
      params: {
        conversationId: c.conversationId,
        supabaseChannel: c.supabaseChannel,
        otherName: c.otherName,
        otherAccountId: c.otherAccountId,
      },
    });
  };

  const fmtTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date();
    return d.toDateString() === today.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-extrabold text-slate-900">Messages</Text>
      </View>

      {/* Search */}
      <View className="mx-5 mb-3 flex-row items-center bg-slate-100 rounded-2xl px-4 py-3 gap-3">
        <Ionicons name="search-outline" size={18} color="#94a3b8" />
        <TextInput
          placeholder="Search conversations..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
          className="flex-1 text-slate-700 text-sm"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.conversationId}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3 text-sm text-center">
                No conversations yet.{'\n'}Chats start from an order.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openChat(item)}
              className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 flex-row items-center gap-3"
            >
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name="person" size={20} color="#2563EB" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-0.5">
                  <Text className="font-bold text-slate-900 text-sm" numberOfLines={1}>
                    {item.otherName || 'Contact'}
                  </Text>
                  <Text className="text-xs text-slate-400">{fmtTime(item.lastMessageAt ?? item.createdAt)}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-slate-500 flex-1 mr-2" numberOfLines={1}>
                    {item.lastMessage ?? `Order ${item.orderNumber}`}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View className="bg-blue-600 rounded-full min-w-5 h-5 px-1.5 items-center justify-center">
                      <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
