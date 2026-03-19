import React, { useState } from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { StyleSheet } from "react-native-unistyles";
import { colors } from "@/lib/colors";

export type AvatarSize = "sm" | "default" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  fallback?: string;
  size?: AvatarSize;
}

const AVATAR_SIZES: Record<AvatarSize, number> = {
  sm: 32,
  default: 40,
  lg: 56,
  xl: 80,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  sm: 12,
  default: 14,
  lg: 20,
  xl: 28,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ src, fallback, size = "default" }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const dimension = AVATAR_SIZES[size];
  const fontSize = FONT_SIZES[size];

  const showImage = src && !imageError;

  return (
    <View
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: src }}
          style={{ width: dimension, height: dimension }}
          onError={() => setImageError(true)}
          contentFit="cover"
        />
      ) : (
        <Text style={[styles.fallbackText, { fontSize }]}>
          {fallback ? getInitials(fallback) : "?"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create((_theme) => ({
  base: {
    overflow: "hidden",
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontWeight: "600",
    color: colors.primary[700],
  },
}));
