import React, { useEffect, useState } from "react";
import { View, TextInput, FlatList, StyleSheet, ActivityIndicator, Text } from "react-native";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { searchDonors } from "../api/donors";
import { FilterBar } from "../components/FilterBar";
import { DonorListItem } from "../components/DonorListItem";
import type { BloodGroup } from "../types";
import type { RootStackParamList } from "../navigation/types";

export default function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [username, setUsername] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
    });
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["donors-search", username, bloodGroup, radiusKm, coords?.lat, coords?.lng],
    queryFn: () =>
      searchDonors({
        username: username || undefined,
        bloodGroup: bloodGroup ?? undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm: coords ? radiusKm : undefined,
      }),
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <FilterBar bloodGroup={bloodGroup} onChangeBloodGroup={setBloodGroup} radiusKm={radiusKm} onChangeRadius={setRadiusKm} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={data?.donors ?? []}
          keyExtractor={(d) => String(d.id)}
          renderItem={({ item }) => (
            <DonorListItem donor={item} onPress={() => navigation.navigate("DonorDetail", { donorId: item.id })} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No donors found. Try widening your filters.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  search: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
});
