import React from "react";
import { View, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "error";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = "default", children }: BadgeProps) {
  const variantStyle = styles[`variant_${variant}`];
  const textVariantStyle = styles[`text_${variant}`];

  return (
    <View style={[styles.base, variantStyle]}>
      {typeof children === "string" ? (
        <Text style={[styles.text, textVariantStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  base: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: "500",
  },
  // Variant styles
  variant_default: {
    backgroundColor: theme.colors.primary[50],
  },
  variant_secondary: {
    backgroundColor: theme.colors.neutral[100],
  },
  variant_outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  variant_success: {
    backgroundColor: theme.colors.success[50],
  },
  variant_warning: {
    backgroundColor: theme.colors.warning[50],
  },
  variant_error: {
    backgroundColor: theme.colors.error[50],
  },
  // Text variant styles
  text_default: {
    color: theme.colors.primary[700],
  },
  text_secondary: {
    color: theme.colors.neutral[700],
  },
  text_outline: {
    color: theme.colors.neutral[700],
  },
  text_success: {
    color: theme.colors.success[700],
  },
  text_warning: {
    color: theme.colors.warning[700],
  },
  text_error: {
    color: theme.colors.error[700],
  },
}));
