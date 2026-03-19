import React from "react";
import { View, Text, Platform } from "react-native";
import { MapPin, Anchor, Waves } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { colors } from "@/lib/colors";

let MapView: any;
let Marker: any;
let Circle: any;
let mapsAvailable = false;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    Circle = Maps.Circle;
    mapsAvailable = true;
  } catch {
    // react-native-maps not available (Expo Go or missing native module)
  }
}

interface FishingRegion {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  label: string;
}

// Estimate fishing region based on trip type and duration
function getFishingRegion(
  tripType: string,
  durationHours: number,
  lat: number,
  lng: number
): FishingRegion {
  // Miles from port based on trip type
  let radiusMiles: number;
  let offsetLat = 0;
  let offsetLng = 0;
  let label: string;

  switch (tripType) {
    case "offshore":
      radiusMiles = 20 + durationHours * 3;
      offsetLat = 0.15;
      offsetLng = -0.15;
      label = "Offshore Grounds";
      break;
    case "deep_sea":
      radiusMiles = 25 + durationHours * 4;
      offsetLat = 0.2;
      offsetLng = -0.2;
      label = "Deep Sea Grounds";
      break;
    case "inshore":
      radiusMiles = 3 + durationHours;
      label = "Inshore Waters";
      break;
    case "fly_fishing":
      radiusMiles = 2 + durationHours * 0.5;
      label = "Flats & Backcountry";
      break;
    case "trolling":
      radiusMiles = 8 + durationHours * 2;
      offsetLng = -0.08;
      label = "Trolling Grounds";
      break;
    case "bottom_fishing":
      radiusMiles = 5 + durationHours * 1.5;
      offsetLng = -0.06;
      label = "Reef & Wreck Sites";
      break;
    case "spearfishing":
      radiusMiles = 4 + durationHours;
      offsetLng = -0.05;
      label = "Dive Sites";
      break;
    case "sunset_cruise":
      radiusMiles = 3 + durationHours;
      label = "Cruise Area";
      break;
    default:
      radiusMiles = 5;
      label = "Fishing Area";
  }

  return {
    latitude: lat + offsetLat,
    longitude: lng + offsetLng,
    radiusMiles,
    label,
  };
}

interface ListingMapProps {
  latitude: number;
  longitude: number;
  departurePort: string;
  tripType: string;
  durationHours: number;
  departureCity: string;
}

export function ListingMap({
  latitude,
  longitude,
  departurePort,
  tripType,
  durationHours,
  departureCity,
}: ListingMapProps) {
  const { theme } = useUnistyles();
  const fishingRegion = getFishingRegion(tripType, durationHours, latitude, longitude);
  const radiusMeters = fishingRegion.radiusMiles * 1609.34;

  // Calculate map region to fit both marina and fishing area
  const midLat = (latitude + fishingRegion.latitude) / 2;
  const midLng = (longitude + fishingRegion.longitude) / 2;
  const latDelta = Math.max(
    Math.abs(latitude - fishingRegion.latitude) * 2.5,
    fishingRegion.radiusMiles * 0.03,
    0.05
  );
  const lngDelta = Math.max(
    Math.abs(longitude - fishingRegion.longitude) * 2.5,
    fishingRegion.radiusMiles * 0.03,
    0.05
  );

  if (Platform.OS === "web" || !mapsAvailable) {
    // Fallback — static display (web or missing native module)
    return (
      <View style={styles.container}>
        <View style={styles.webMapFallback}>
          <Waves size={32} color={theme.colors.primary[300]} />
          <Text style={styles.webMapTitle}>{departurePort}</Text>
          <Text style={styles.webMapSubtitle}>
            {fishingRegion.label} — up to {fishingRegion.radiusMiles}mi from port
          </Text>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary[500] }]} />
            <Text style={styles.legendText}>Marina</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary[500] + "40" }]} />
            <Text style={styles.legendText}>{fishingRegion.label}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }}
        scrollEnabled={false}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        mapType="standard"
        showsPointsOfInterest={false}
      >
        {/* Marina marker */}
        <Marker
          coordinate={{ latitude, longitude }}
          title={departurePort}
          description={`Departure from ${departureCity}`}
        >
          <View style={styles.markerContainer}>
            <View style={styles.marinaMarker}>
              <Anchor size={16} color="#fff" />
            </View>
          </View>
        </Marker>

        {/* Fishing region circle */}
        <Circle
          center={{
            latitude: fishingRegion.latitude,
            longitude: fishingRegion.longitude,
          }}
          radius={radiusMeters}
          fillColor="rgba(13, 191, 171, 0.12)"
          strokeColor="rgba(13, 191, 171, 0.4)"
          strokeWidth={1.5}
        />

        {/* Fishing region center marker */}
        <Marker
          coordinate={{
            latitude: fishingRegion.latitude,
            longitude: fishingRegion.longitude,
          }}
          title={fishingRegion.label}
          description={`~${fishingRegion.radiusMiles}mi from port`}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.fishingMarker}>
            <Waves size={14} color={theme.colors.secondary[600]} />
          </View>
        </Marker>
      </MapView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary[500] }]} />
          <Text style={styles.legendText}>{departurePort}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary[400] }]} />
          <Text style={styles.legendText}>{fishingRegion.label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: theme.colors.neutral[50],
  },
  map: {
    height: 220,
    width: "100%",
  },
  webMapFallback: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary[50],
  },
  webMapTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.neutral[800],
    textAlign: "center",
    paddingHorizontal: 16,
  },
  webMapSubtitle: {
    fontSize: 12,
    color: theme.colors.neutral[500],
  },
  markerContainer: {
    alignItems: "center",
  },
  marinaMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fishingMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(13, 191, 171, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.secondary[400],
  },
  legend: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.neutral[600],
    fontWeight: "500",
    flexShrink: 1,
  },
}));
