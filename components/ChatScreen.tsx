import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
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

/** Supabase rows arrive snake_case — normalize to the camelCase Message type. */
function normalizeRealtimeMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id ?? row.conversationId,
    senderId: row.sender_id ?? row.senderId,
    body: row.body,
    isRead: row.is_read ?? row.isRead,
    createdAt: row.created_at ?? row.createdAt,
  };
}

/**
 * Shared chat screen used by the user, business, and rider route trees.
 * Loads history from the backend, then listens on Supabase realtime for
 * new inserts. Voice: full call flow (start/end + CallLog) — audio itself
 * requires the Agora native SDK, which needs a dev build (not Expo Go).
 */
export default function ChatScreen() {
  const {
    conversationId,
    supabaseChannel,
    otherName,
    otherAccountId,
    calleeId,
  } = useLocalSearchParams<{
    conversationId: string;
    supabaseChannel?: string;
    otherName?: string;
    otherAccountId?: string;
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
  const [callSeconds, setCallSeconds] = useState(0);

  const flatRef = useRef<FlatList>(null);

  // ── Load current user id ────────────────────────────────
  useEffect(() => {
    SecureStore.getItemAsync('account_id').then(setMyId);
  }, []);

  // ── Load message history from the backend ───────────────
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    conversationApi
      .getMessages(conversationId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((e) => console.warn('History load failed:', e?.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // ── Subscribe to Supabase realtime for new messages ─────
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
          const newMsg = normalizeRealtimeMessage(payload.new);
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabaseChannel]);

  // ── Scroll to bottom once history is in ─────────────────
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 150);
    }
  }, [loading]);

  // ── In-call timer ───────────────────────────────────────
  useEffect(() => {
    if (!isOnCall || !callStartTime) return;
    const t = setInterval(() => {
      setCallSeconds(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [isOnCall, callStartTime]);

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
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
    } catch (e: any) {
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
      const res = await callApi.start(conversationId, targetId);
      setCallLogId(res.callLogId);
      setIsOnCall(true);
      setCallStartTime(Date.now());
      setCallSeconds(0);
    } catch (e: any) {
      Alert.alert('Call Error', e.message);
    } finally {
      setCallLoading(false);
    }
  }

  // ── End call ────────────────────────────────────────────
  async function handleEndCall() {
    const durationSeconds = callStartTime
      ? Math.floor((Date.now() - callStartTime) / 1000)
      : 0;
    try {
      if (conversationId && callLogId) {
        await callApi.end(conversationId, callLogId, durationSeconds);
      }
    } catch (e) {
      console.log('End call error:', e);
    } finally {
      setIsOnCall(false);
      setCallLogId(null);
      setCallStartTime(null);
      setCallSeconds(0);
    }
  }

  const fmtDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Message bubble ──────────────────────────────────────
  const renderItem = ({ item }: { item: Message }) => {
    const isMine = item.senderId === myId;
    const isTemp = item.id.startsWith('temp-');
    const time = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

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

        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
          <Ionicons name="person" size={18} color="#2563EB" />
        </View>

        <View className="flex-1">
          <Text className="font-bold text-slate-900">{otherName ?? 'Chat'}</Text>
          {isOnCall ? (
            <View className="flex-row items-center gap-1">
              <View className="w-2 h-2 rounded-full bg-red-500" />
              <Text className="text-xs text-red-500">On call • {fmtDuration(callSeconds)}</Text>
            </View>
          ) : (
            <Text className="text-xs text-slate-400">Tap 📞 to call</Text>
          )}
        </View>

        {/* Call button */}
        <TouchableOpacity
          onPress={isOnCall ? handleEndCall : handleStartCall}
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

      {/* In-call banner */}
      {isOnCall && (
        <View className="bg-blue-600 px-5 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="call" size={16} color="#fff" />
            <Text className="text-white font-semibold text-sm">
              Calling {otherName ?? 'contact'}... {fmtDuration(callSeconds)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleEndCall}
            className="bg-red-500 rounded-full px-4 py-1.5"
          >
            <Text className="text-white font-bold text-xs">End</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages list */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-slate-400 text-sm mt-3">Loading messages...</Text>
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
