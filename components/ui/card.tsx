import React, { forwardRef } from "react";
import { View, ViewProps, Text, TextProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export const Card = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.card, style]} {...props} />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.cardHeader, style]} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.cardTitle, style]} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<Text, TextProps>(
  ({ style, ...props }, ref) => (
    <Text ref={ref} style={[styles.cardDescription, style]} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.cardContent, style]} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<View, ViewProps>(
  ({ style, ...props }, ref) => (
    <View ref={ref} style={[styles.cardFooter, style]} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.radius["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  cardHeader: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  cardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    marginTop: 4,
  },
  cardContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
}));
