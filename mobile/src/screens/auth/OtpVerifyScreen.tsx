import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { verifyOtp } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { PrimaryButton } from "../../components/PrimaryButton";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "OtpVerify">;

export default function OtpVerifyScreen({ route, navigation }: Props) {
  const { phone, demoOtp } = route.params;
  const [code, setCode] = useState(demoOtp);
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  async function verify() {
    setLoading(true);
    try {
      const result = await verifyOtp(phone, code);
      if (result.isNewUser) {
        navigation.replace("ProfileSetup", { registrationToken: result.registrationToken });
      } else {
        await signIn(result.token, result.user);
      }
    } catch (err) {
      Alert.alert("Verification failed", err instanceof Error ? err.message : "Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter the code</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {phone}</Text>
      <View style={styles.demoBanner}>
        <Text style={styles.demoText}>Demo mode — no SMS is actually sent. Your code is {demoOtp}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />
      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : <PrimaryButton title="Verify" onPress={verify} disabled={code.length < 6} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#555", marginBottom: 16 },
  demoBanner: { backgroundColor: "#FFF3CD", borderRadius: 10, padding: 12, marginBottom: 16 },
  demoText: { color: "#664D03", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    letterSpacing: 6,
    marginBottom: 16,
    textAlign: "center",
  },
});
