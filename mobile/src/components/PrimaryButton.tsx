import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  style?: ViewStyle;
}

export function PrimaryButton({ title, onPress, disabled, variant = "primary", style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "secondary" && styles.secondary,
        variant === "danger" && styles.danger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondary: { backgroundColor: "#F1F1F1" },
  danger: { backgroundColor: "#B00020" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryText: { color: "#222" },
});
