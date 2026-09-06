import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { sendOtp } from "../../api/auth";
import { PrimaryButton } from "../../components/PrimaryButton";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "PhoneEntry">;

export default function PhoneEntryScreen({ navigation }: Props) {
  const [phone, setPhone] = useState("+1");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!/^\+\d{8,15}$/.test(phone)) {
      Alert.alert("Invalid number", "Enter a phone number with a country code, e.g. +14155551234");
      return;
    }
    setLoading(true);
    try {
      const result = await sendOtp(phone);
      navigation.navigate("OtpVerify", { phone, demoOtp: result.otp });
    } catch (err) {
      Alert.alert("Couldn't send code", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find blood donors nearby</Text>
      <Text style={styles.subtitle}>Enter your phone number to sign in or create an account.</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="+14155551234"
        keyboardType="phone-pad"
        autoFocus
      />
      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : <PrimaryButton title="Send code" onPress={handleSend} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#555", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
});
