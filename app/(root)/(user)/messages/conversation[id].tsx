import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { conversationApi, callApi } from '@/lib/api';
import { Message } from '@/types/type';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client (realtime only — no auth needed here) ──
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ChatScreen() {
  const {
    conversationId,
    supabaseChannel,
    otherName,
    otherAccountId,
    orderId,
    calleeId,
  } = useLocalSearchParams<{
    conversationId: string;
    supabaseChannel?: string;
    otherName?: string;
    otherAccountId?: string;
    orderId?: string;
    calleeId?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [callLoading, setCallLoading] = useState(false);
  const [isOnCall, setIsOnCall] = useState(false);
  const [callLogId, setCallLogId] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  const flatRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  // ── Load current user id ────────────────────────────────
  useEffect(() => {
    SecureStore.getItemAsync('account_id').then(setMyId);
  }, []);

  // ── Subscribe to Supabase realtime ──────────────────────
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(supabaseChannel ?? `messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicate if we already appended optimistically
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe((status) => {
        console.log('Supabase channel status:', status);
        setLoading(false);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabaseChannel]);

  // ── Scroll to bottom when messages load ────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length === 1]);

  // ── Send message ────────────────────────────────────────
  async function send() {
    if (!input.trim() || !conversationId || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      body: text,
      senderId: myId ?? '',
      conversationId,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const saved = await conversationApi.sendMessage(conversationId, text);
      // Replace optimistic with real message
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
    } catch (e: any) {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
      Alert.alert('Error', e.message ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  // ── Start call ──────────────────────────────────────────
  async function handleStartCall() {
    const targetId = calleeId ?? otherAccountId;
    if (!conversationId || !targetId) {
      Alert.alert('Cannot start call', 'Missing conversation or contact info.');
      return;
    }
    setCallLoading(true);
    try {
      const { token, channel } = await callApi.start(conversationId, targetId);
      setIsOnCall(true);
      setCallStartTime(Date.now());
      Alert.alert(
        '📞 Call Started',
        `Channel: ${channel}\nToken acquired. Integrate Agora SDK to connect audio.`,
        [{ text: 'End Call', onPress: () => handleEndCall(channel) }]
      );
    } catch (e: any) {
      Alert.alert('Call Error', e.message);
    } finally {
      setCallLoading(false);
    }
  }

  // ── End call ────────────────────────────────────────────
  async function handleEndCall(channelName?: string) {
    if (!conversationId || !callLogId) {
      setIsOnCall(false);
      return;
    }
    const durationSeconds = callStartTime
      ? Math.floor((Date.now() - callStartTime) / 1000)
      : 0;
    try {
      await callApi.end(conversationId, callLogId, durationSeconds);
    } catch (e) {
      console.log('End call error:', e);
    } finally {
      setIsOnCall(false);
      setCallLogId(null);
      setCallStartTime(null);
    }
  }

  // ── Message bubble ──────────────────────────────────────
  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.senderId === myId;
    const isTemp = item.id.startsWith('temp-');
    const time = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });

    return (
      <View className={`mb-3 max-w-[78%] ${isMine ? 'self-end' : 'self-start'}`}>
        <View className={`rounded-2xl px-4 py-3
          ${isMine
            ? 'bg-blue-600 rounded-tr-sm'
            : 'bg-white rounded-tl-sm border border-slate-100'}`}
        >
          <Text className={`text-sm leading-5 ${isMine ? 'text-white' : 'text-slate-800'}`}>
            {item.body}
          </Text>
        </View>
        <View className={`flex-row items-center mt-1 gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <Text className="text-xs text-slate-400">{time}</Text>
          {isMine && (
            isTemp
              ? <Ionicons name="time-outline" size={11} color="#94a3b8" />
              : <Ionicons name="checkmark-done" size={11} color="#2563EB" />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center gap-4 px-5 pt-4 pb-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>

        {/* Avatar */}
        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
          <Ionicons name="person" size={18} color="#2563EB" />
        </View>

        <View className="flex-1">
          <Text className="font-bold text-slate-900">{otherName ?? 'Chat'}</Text>
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-xs text-green-500">Online</Text>
          </View>
        </View>

        {/* Call button */}
        <TouchableOpacity
          onPress={isOnCall ? () => handleEndCall() : handleStartCall}
          disabled={callLoading}
          className={`w-10 h-10 rounded-full items-center justify-center
            ${isOnCall ? 'bg-red-100' : 'bg-blue-50'}`}
        >
          {callLoading
            ? <ActivityIndicator size="small" color="#2563EB" />
            : <Ionicons
                name={isOnCall ? 'call' : 'call-outline'}
                size={20}
                color={isOnCall ? '#ef4444' : '#2563EB'}
              />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages list */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-slate-400 text-sm mt-3">Connecting...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-20">
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#cbd5e1" />
                <Text className="text-slate-400 mt-3 text-sm text-center">
                  No messages yet.{'\n'}Say hello! 👋
                </Text>
              </View>
            }
            renderItem={renderItem}
          />
        )}

        {/* Input bar */}
        <View className="flex-row items-end gap-3 px-4 py-3 bg-white border-t border-slate-100">
          <View className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 max-h-28">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              className="text-slate-800 text-sm"
              multiline
              onSubmitEditing={send}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            onPress={send}
            disabled={sending || !input.trim()}
            className={`w-11 h-11 rounded-full items-center justify-center
              ${input.trim() ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color={input.trim() ? '#fff' : '#94a3b8'} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}