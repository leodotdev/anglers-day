import React from "react";
import { View, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button, ButtonVariant } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "default",
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button variant={actionVariant} onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrapper: {
    marginBottom: theme.spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.neutral[900],
    textAlign: "center",
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginTop: theme.spacing.sm,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: theme.spacing["3xl"],
  },
}));
