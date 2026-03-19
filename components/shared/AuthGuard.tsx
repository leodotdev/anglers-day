import React from "react";
import { View, Text } from "react-native";
import { LogIn } from "lucide-react-native";
import { useConvexAuth } from "convex/react";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useAuthDialog } from "@/components/auth/AuthDialog";

export interface AuthGuardProps {
  children: React.ReactNode;
  message?: string;
}

export function AuthGuard({ children, message }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { showAuth } = useAuthDialog();
  const { theme } = useUnistyles();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <LogIn size={32} color={theme.colors.primary[500]} />
        </View>
        <Text style={styles.title}>{message ?? "Sign in required"}</Text>
        <Text style={styles.description}>
          Log in or create an account to continue.
        </Text>
        <View style={styles.actionContainer}>
          <Button onPress={() => showAuth("login")}>Log In</Button>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[500],
  },
  iconWrapper: {
    marginBottom: theme.spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.white,
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
  },
  actionContainer: {
    marginTop: theme.spacing.xl,
  },
}));
