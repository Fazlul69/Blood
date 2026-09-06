import React from "react";
import { View, Text, Pressable, Image, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { listChats } from "../api/chats";
import type { RootStackParamList } from "../navigation/types";

export default function ChatListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading } = useQuery({ queryKey: ["chats"], queryFn: listChats, refetchInterval: 15_000 });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={data?.chats ?? []}
      keyExtractor={(c) => String(c.id)}
      ListEmptyComponent={<Text style={styles.empty}>No conversations yet. Start one from a donor's profile.</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate("ChatThread", { chatId: item.id, otherUserName: item.otherUser.name })}
        >
          {item.otherUser.photoUrl ? (
            <Image source={{ uri: item.otherUser.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{item.otherUser.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>{item.otherUser.name}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage?.body ?? "Say hello"}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { backgroundColor: "#D32F2F", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  preview: { fontSize: 13, color: "#777", marginTop: 2 },
});
