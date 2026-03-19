import React from "react";
import { View, ViewProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { colors } from "@/lib/colors";

export interface SeparatorProps extends ViewProps {
  orientation?: "horizontal" | "vertical";
}

export function Separator({
  orientation = "horizontal",
  style,
  ...props
}: SeparatorProps) {
  return (
    <View
      style={[
        styles.base,
        orientation === "horizontal" ? styles.horizontal : styles.vertical,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create((_theme) => ({
  base: {
    backgroundColor: colors.neutral[200],
  },
  horizontal: {
    height: 1,
    width: "100%",
  },
  vertical: {
    width: 1,
    height: "100%",
  },
}));
