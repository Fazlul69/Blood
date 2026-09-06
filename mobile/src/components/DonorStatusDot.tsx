import React from "react";
import { View, StyleSheet } from "react-native";

export function DonorStatusDot({ isActive, size = 10 }: { isActive: boolean; size?: number }) {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: isActive ? "#2E7D32" : "#9E9E9E" },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { borderWidth: 1, borderColor: "#fff" },
});
