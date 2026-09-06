import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import type { BloodGroup } from "../types";
import { BLOOD_GROUP_LABELS } from "../types";

const GROUPS = Object.keys(BLOOD_GROUP_LABELS) as BloodGroup[];

export function BloodGroupPicker({ value, onChange }: { value: BloodGroup | null; onChange: (g: BloodGroup) => void }) {
  return (
    <View style={styles.grid}>
      {GROUPS.map((g) => {
        const selected = value === g;
        return (
          <Pressable key={g} onPress={() => onChange(g)} style={[styles.chip, selected && styles.chipSelected]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{BLOOD_GROUP_LABELS[g]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    width: "22%",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  chipSelected: { backgroundColor: "#D32F2F", borderColor: "#D32F2F" },
  chipText: { fontSize: 15, fontWeight: "600", color: "#333" },
  chipTextSelected: { color: "#fff" },
});
