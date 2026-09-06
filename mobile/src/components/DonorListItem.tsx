import React from "react";
import { Pressable, View, Text, Image, StyleSheet } from "react-native";
import { DonorStatusDot } from "./DonorStatusDot";
import { BLOOD_GROUP_LABELS } from "../types";
import type { Donor } from "../types";

export function DonorListItem({ donor, onPress }: { donor: Donor; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {donor.photoUrl ? (
        <Image source={{ uri: donor.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{donor.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{donor.name}</Text>
        <Text style={styles.username}>@{donor.username}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.bloodGroup}>{BLOOD_GROUP_LABELS[donor.bloodGroup]}</Text>
        <View style={styles.statusRow}>
          <DonorStatusDot isActive={donor.isActive} />
          <Text style={styles.statusText}>{donor.isActive ? "Active" : "Not yet eligible"}</Text>
        </View>
        {donor.distanceKm != null && <Text style={styles.distance}>{donor.distanceKm.toFixed(1)} km away</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { backgroundColor: "#D32F2F", alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600" },
  username: { fontSize: 13, color: "#777" },
  right: { alignItems: "flex-end" },
  bloodGroup: { fontSize: 16, fontWeight: "700", color: "#D32F2F" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  statusText: { fontSize: 11, color: "#555" },
  distance: { fontSize: 11, color: "#999", marginTop: 2 },
});
