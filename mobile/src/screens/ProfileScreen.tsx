import React, { useState } from "react";
import { View, Text, Switch, ScrollView, StyleSheet, ActivityIndicator, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, updateMe, uploadPhoto } from "../api/users";
import { getDonationHistory, recordDonation } from "../api/donations";
import { useAuthStore } from "../store/authStore";
import { disconnectSocket } from "../lib/socket";
import { PrimaryButton } from "../components/PrimaryButton";
import { DonorStatusDot } from "../components/DonorStatusDot";
import { BLOOD_GROUP_LABELS } from "../types";

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const signOut = useAuthStore((s) => s.signOut);
  const setUser = useAuthStore((s) => s.setUser);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { data: me, isLoading } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data: history } = useQuery({ queryKey: ["donationHistory"], queryFn: getDonationHistory });

  const updateMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (res) => {
      setUser(res.user);
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const donationMutation = useMutation({
    mutationFn: recordDonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["donationHistory"] });
    },
  });

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const { user } = await uploadPhoto(asset.uri, asset.mimeType ?? "image/jpeg");
    setUser(user);
    queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  if (isLoading || !me) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const { user, isActive, nextEligibleDate, donationCount } = me;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={handlePickPhoto} style={styles.avatarWrap}>
        {user.photoUrl ? (
          <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.changePhoto}>Change photo</Text>
      </Pressable>

      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.username}>@{user.username}</Text>
      <Text style={styles.bloodGroup}>{BLOOD_GROUP_LABELS[user.bloodGroup]}</Text>

      <View style={styles.statusRow}>
        <DonorStatusDot isActive={isActive} size={12} />
        <Text style={styles.statusText}>{isActive ? "You're active — eligible to donate" : "Not yet eligible to donate"}</Text>
      </View>
      {!isActive && nextEligibleDate && (
        <Text style={styles.hint}>Eligible again on {new Date(nextEligibleDate).toDateString()}</Text>
      )}

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Times donated</Text>
          <Text style={styles.cardValue}>{donationCount}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Last donation</Text>
          <Text style={styles.cardValue}>{user.lastDonationDate ? new Date(user.lastDonationDate).toDateString() : "None recorded"}</Text>
        </View>
      </View>

      <PrimaryButton
        title="Record a new donation"
        onPress={() => setShowDatePicker(true)}
        style={{ marginTop: 12 }}
        disabled={donationMutation.isPending}
      />
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={(_event, date) => {
            setShowDatePicker(false);
            if (date) {
              Alert.alert("Confirm donation", `Record a donation on ${date.toDateString()}?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: () => donationMutation.mutate(date.toISOString()) },
              ]);
            }
          }}
        />
      )}

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={styles.cardLabel}>Show my phone number</Text>
          <Switch value={user.showPhone} onValueChange={(v) => updateMutation.mutate({ showPhone: v })} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.cardLabel}>Allow chat</Text>
          <Switch value={user.allowChat} onValueChange={(v) => updateMutation.mutate({ allowChat: v })} />
        </View>
      </View>

      {history && history.count > 0 && (
        <View style={styles.card}>
          <Text style={[styles.cardLabel, { marginBottom: 8 }]}>Donation history</Text>
          {history.history.map((h) => (
            <Text key={h.id} style={styles.historyItem}>
              {new Date(h.donationDate).toDateString()}
            </Text>
          ))}
        </View>
      )}

      <PrimaryButton
        title="Log out"
        variant="danger"
        onPress={async () => {
          disconnectSocket();
          await signOut();
        }}
        style={{ marginTop: 24, marginBottom: 40 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarWrap: { alignItems: "center", marginBottom: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: { backgroundColor: "#D32F2F", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontSize: 36, fontWeight: "700" },
  changePhoto: { color: "#D32F2F", fontSize: 12, marginTop: 6, fontWeight: "600" },
  name: { fontSize: 22, fontWeight: "700", marginTop: 8 },
  username: { fontSize: 14, color: "#777" },
  bloodGroup: { fontSize: 28, fontWeight: "800", color: "#D32F2F", marginTop: 8 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  statusText: { fontSize: 13, color: "#333" },
  hint: { fontSize: 12, color: "#999", marginTop: 4 },
  card: { width: "100%", backgroundColor: "#F7F7F7", borderRadius: 12, padding: 16, marginTop: 20 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  cardLabel: { color: "#555", fontSize: 14 },
  cardValue: { color: "#222", fontSize: 14, fontWeight: "600" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  historyItem: { fontSize: 13, color: "#444", paddingVertical: 4 },
});
