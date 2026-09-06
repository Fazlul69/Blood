import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { searchDonors } from "../api/donors";
import { FilterBar } from "../components/FilterBar";
import { DonorStatusDot } from "../components/DonorStatusDot";
import type { BloodGroup } from "../types";
import type { RootStackParamList } from "../navigation/types";

export default function MapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [region, setRegion] = useState<Region | null>(null);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      });
    })();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["donors", region?.latitude, region?.longitude, radiusKm, bloodGroup],
    queryFn: () =>
      searchDonors({
        lat: region!.latitude,
        lng: region!.longitude,
        radiusKm,
        bloodGroup: bloodGroup ?? undefined,
      }),
    enabled: !!region,
  });

  if (permissionDenied) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Location permission is needed to show donors near you on the map.</Text>
        <Text style={styles.hint}>You can still find donors by username in the Search tab.</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} showsUserLocation>
        {data?.donors.map(
          (donor) =>
            donor.lat != null &&
            donor.lng != null && (
              <Marker
                key={donor.id}
                coordinate={{ latitude: donor.lat, longitude: donor.lng }}
                title={`${donor.name} (@${donor.username})`}
                description={donor.isActive ? "Active donor" : "Not yet eligible"}
                onPress={() => navigation.navigate("DonorDetail", { donorId: donor.id })}
              >
                <View style={[styles.marker, { backgroundColor: donor.isActive ? "#2E7D32" : "#9E9E9E" }]}>
                  <Text style={styles.markerText}>{donor.bloodGroup.replace("_POS", "+").replace("_NEG", "-")}</Text>
                </View>
              </Marker>
            )
        )}
      </MapView>
      <View style={styles.filterOverlay}>
        <FilterBar bloodGroup={bloodGroup} onChangeBloodGroup={setBloodGroup} radiusKm={radiusKm} onChangeRadius={setRadiusKm} />
      </View>
      {isLoading && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator />
        </View>
      )}
      <View style={styles.legend}>
        <DonorStatusDot isActive size={12} />
        <Text style={styles.legendText}>Active</Text>
        <DonorStatusDot isActive={false} size={12} />
        <Text style={styles.legendText}>Not yet eligible</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  message: { fontSize: 16, textAlign: "center", marginBottom: 8 },
  hint: { fontSize: 13, color: "#777", textAlign: "center" },
  filterOverlay: { position: "absolute", top: 8, left: 0, right: 0 },
  loadingBadge: {
    position: "absolute",
    top: 90,
    alignSelf: "center",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
  },
  marker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  legend: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  legendText: { fontSize: 12, color: "#333", marginRight: 8 },
});
