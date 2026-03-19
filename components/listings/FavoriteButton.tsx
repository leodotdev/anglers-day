import React from "react";
import { TouchableOpacity, Platform } from "react-native";
import { Star } from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StyleSheet } from "react-native-unistyles";
import { colors } from "@/lib/colors";

export interface FavoriteButtonProps {
  listingId: Id<"listings">;
}

export function FavoriteButton({ listingId }: FavoriteButtonProps) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const isFavorited = useQuery(
    api.favorites.isFavorited,
    isAuthenticated ? { listingId } : "skip"
  );
  const toggleFavorite = useMutation(api.favorites.toggle);

  const handlePress = async () => {
    if (!isAuthenticated) {
      router.push({ pathname: "/(auth)/sign-in", params: { context: "Save your faves by logging in" } });
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await toggleFavorite({ listingId });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.button}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Star
        size={20}
        color={isFavorited ? colors.warning[500] : "#FFFFFF"}
        fill={isFavorited ? colors.warning[500] : "transparent"}
        strokeWidth={2}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((_theme) => ({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
}));
