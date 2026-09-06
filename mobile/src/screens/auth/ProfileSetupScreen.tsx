import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { registerUser } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { PrimaryButton } from "../../components/PrimaryButton";
import { BloodGroupPicker } from "../../components/BloodGroupPicker";
import type { BloodGroup } from "../../types";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "ProfileSetup">;

export default function ProfileSetupScreen({ route }: Props) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [addressText, setAddressText] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const signIn = useAuthStore((s) => s.signIn);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const position = await Location.getCurrentPositionAsync({});
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        const [place] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (place) {
          setAddressText([place.city, place.region, place.country].filter(Boolean).join(", "));
        }
      } catch {
        // Location is optional at signup — donors can still be found by username search.
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  async function submit() {
    if (username.length < 3 || !name || !bloodGroup) {
      Alert.alert("Missing info", "Please fill in a username (3+ characters), your name, and blood group.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerUser({
        registrationToken: route.params.registrationToken,
        username,
        name,
        bloodGroup,
        addressText: addressText || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
      });
      await signIn(result.token, result.user);
    } catch (err) {
      Alert.alert("Couldn't create account", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.label}>Username</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="jane_doe" />
      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Jane Doe" />
      <Text style={styles.label}>Blood group</Text>
      <BloodGroupPicker value={bloodGroup} onChange={setBloodGroup} />
      <Text style={styles.label}>Location</Text>
      {locating ? (
        <ActivityIndicator style={{ alignSelf: "flex-start", marginBottom: 8 }} />
      ) : (
        <TextInput
          style={styles.input}
          value={addressText}
          onChangeText={setAddressText}
          placeholder="City, region (optional)"
        />
      )}
      <Text style={styles.hint}>
        Every user is automatically a donor. Set your last donation date later from your profile — we'll show you as
        active once your 120-day cycle is complete.
      </Text>
      {submitting ? <ActivityIndicator style={{ marginTop: 16 }} /> : <PrimaryButton title="Create account" onPress={submit} style={{ marginTop: 8 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: { fontSize: 13, color: "#777", marginTop: 20, lineHeight: 18 },
});
