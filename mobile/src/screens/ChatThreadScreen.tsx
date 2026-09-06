import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getMessages, sendMessage } from "../api/chats";
import { connectSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import type { Message } from "../types";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "ChatThread">;

export default function ChatThreadScreen({ route, navigation }: Props) {
  const { chatId, otherUserName } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const currentUserId = useAuthStore((s) => s.user?.id);
  const token = useAuthStore((s) => s.token);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title: otherUserName });
  }, [navigation, otherUserName]);

  useEffect(() => {
    getMessages(chatId).then((res) => setMessages(res.messages));

    if (!token) return;
    const socket = connectSocket(token);
    socket.emit("chat:join", chatId);

    const handler = (message: Message) => {
      if (message.chatId !== chatId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    };
    socket.on("message:new", handler);
    return () => {
      socket.off("message:new", handler);
    };
  }, [chatId, token]);

  async function handleSend() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await sendMessage(chatId, body);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const mine = item.senderId === currentUserId;
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={mine ? styles.bubbleTextMine : styles.bubbleText}>{item.body}</Text>
            </View>
          );
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={draft} onChangeText={setDraft} placeholder="Message" multiline />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 8 },
  bubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  bubbleMine: { backgroundColor: "#D32F2F", alignSelf: "flex-end" },
  bubbleTheirs: { backgroundColor: "#EEE", alignSelf: "flex-start" },
  bubbleText: { color: "#222", fontSize: 15 },
  bubbleTextMine: { color: "#fff", fontSize: 15 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#eee" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendButton: { backgroundColor: "#D32F2F", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  sendText: { color: "#fff", fontWeight: "600" },
});
