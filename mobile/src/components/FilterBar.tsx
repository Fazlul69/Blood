import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import type { BloodGroup } from "../types";
import { BLOOD_GROUP_LABELS } from "../types";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];
const GROUPS = Object.keys(BLOOD_GROUP_LABELS) as BloodGroup[];

interface Props {
  bloodGroup: BloodGroup | null;
  onChangeBloodGroup: (g: BloodGroup | null) => void;
  radiusKm: number;
  onChangeRadius: (r: number) => void;
}

export function FilterBar({ bloodGroup, onChangeBloodGroup, radiusKm, onChangeRadius }: Props) {
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Pressable onPress={() => onChangeBloodGroup(null)} style={[styles.chip, bloodGroup === null && styles.chipSelected]}>
          <Text style={[styles.chipText, bloodGroup === null && styles.chipTextSelected]}>All</Text>
        </Pressable>
        {GROUPS.map((g) => (
          <Pressable
            key={g}
            onPress={() => onChangeBloodGroup(bloodGroup === g ? null : g)}
            style={[styles.chip, bloodGroup === g && styles.chipSelected]}
          >
            <Text style={[styles.chipText, bloodGroup === g && styles.chipTextSelected]}>{BLOOD_GROUP_LABELS[g]}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {RADIUS_OPTIONS.map((r) => (
          <Pressable key={r} onPress={() => onChangeRadius(r)} style={[styles.chip, radiusKm === r && styles.chipSelected]}>
            <Text style={[styles.chipText, radiusKm === r && styles.chipTextSelected]}>{r} km</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chipSelected: { backgroundColor: "#D32F2F", borderColor: "#D32F2F" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#333" },
  chipTextSelected: { color: "#fff" },
});
