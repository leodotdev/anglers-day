import { useState, useEffect } from "react";
import { Platform } from "react-native";

interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string | null;
  state?: string | null;
}

let Location: any = null;
try {
  Location = require("expo-location");
} catch {
  // expo-location not available (Expo Go or missing native module)
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!Location) {
      setLoading(false);
      setDenied(true);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setDenied(true);
          setLoading(false);
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;

        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        try {
          const [geo] = await Location.reverseGeocodeAsync(coords);
          if (geo && !cancelled) {
            setLocation({
              ...coords,
              city: geo.city,
              state: geo.region,
            });
          } else if (!cancelled) {
            setLocation(coords);
          }
        } catch {
          if (!cancelled) setLocation(coords);
        }
      } catch {
        if (!cancelled) setDenied(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { location, loading, denied };
}
