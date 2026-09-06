import React, { useState } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, Linking, Alert } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getDonor } from "../api/donors";
import { startChat } from "../api/chats";
import { PrimaryButton } from "../components/PrimaryButton";
import { DonorStatusDot } from "../components/DonorStatusDot";
import { BLOOD_GROUP_LABELS } from "../types";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "DonorDetail">;

export default function DonorDetailScreen({ route, navigation }: Props) {
  const { donorId } = route.params;
  const [startingChat, setStartingChat] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["donor", donorId],
    queryFn: () => getDonor(donorId),
  });

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const donor = data.donor;

  async function handleChat() {
    setStartingChat(true);
    try {
      const { chat } = await startChat(donor.id);
      navigation.navigate("ChatThread", { chatId: chat.id, otherUserName: donor.name });
    } catch (err) {
      Alert.alert("Couldn't start chat", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setStartingChat(false);
    }
  }

  function handleCall() {
    if (donor.phone) Linking.openURL(`tel:${donor.phone}`);
  }

  return (
    <View style={styles.container}>
      {donor.photoUrl ? (
        <Image source={{ uri: donor.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{donor.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.name}>{donor.name}</Text>
      <Text style={styles.username}>@{donor.username}</Text>
      <Text style={styles.bloodGroup}>{BLOOD_GROUP_LABELS[donor.bloodGroup]}</Text>

      <View style={styles.statusRow}>
        <DonorStatusDot isActive={donor.isActive} size={12} />
        <Text style={styles.statusText}>{donor.isActive ? "Active — eligible to donate now" : "Not yet eligible"}</Text>
      </View>

      <View style={styles.infoCard}>
        {donor.addressText && <InfoRow label="Location" value={donor.addressText} />}
        {donor.distanceKm != null && <InfoRow label="Distance" value={`${donor.distanceKm.toFixed(1)} km away`} />}
        <InfoRow label="Last donation" value={donor.lastDonationDate ? new Date(donor.lastDonationDate).toDateString() : "No record yet"} />
        {!donor.isActive && donor.nextEligibleDate && (
          <InfoRow label="Eligible again on" value={new Date(donor.nextEligibleDate).toDateString()} />
        )}
        {donor.donationCount != null && <InfoRow label="Times donated" value={String(donor.donationCount)} />}
      </View>

      <View style={styles.actions}>
        {donor.phone && <PrimaryButton title="Call" onPress={handleCall} style={{ flex: 1 }} />}
        {donor.allowChat && (
          <PrimaryButton title="Chat" variant="secondary" onPress={handleChat} disabled={startingChat} style={{ flex: 1 }} />
        )}
      </View>
      {!donor.phone && !donor.allowChat && (
        <Text style={styles.hint}>This donor has kept their phone number and chat private.</Text>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatar: { width: 96, height: 96, borderRadius: 48, marginTop: 8 },
  avatarPlaceholder: { backgroundColor: "#D32F2F", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontSize: 36, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  username: { fontSize: 14, color: "#777" },
  bloodGroup: { fontSize: 28, fontWeight: "800", color: "#D32F2F", marginTop: 8 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  statusText: { fontSize: 13, color: "#333" },
  infoCard: { width: "100%", backgroundColor: "#F7F7F7", borderRadius: 12, padding: 16, marginTop: 24 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  infoLabel: { color: "#777", fontSize: 13 },
  infoValue: { color: "#222", fontSize: 13, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 12, width: "100%", marginTop: 24 },
  hint: { fontSize: 13, color: "#999", marginTop: 16, textAlign: "center" },
});
