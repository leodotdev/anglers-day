import { useConvexAuth } from "convex/react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ShieldAlert, LogIn } from "lucide-react-native";
import { useRole, type UserRole } from "@/hooks/useRole";

export function RoleGuard({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { role } = useRole();
  const router = useRouter();
  const { theme } = useUnistyles();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.centeredPadded}>
        <LogIn size={48} color={theme.colors.primary[500]} />
        <Text style={styles.heading}>Sign in required</Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/sign-in")}
          style={styles.signInButton}
          activeOpacity={0.8}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!roles.includes(role)) {
    return (
      <View style={styles.centeredPadded}>
        <ShieldAlert size={48} color={theme.colors.error[500]} />
        <Text style={styles.heading}>Access Denied</Text>
        <Text style={styles.subtext}>
          You don't have permission to access this section
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(guest)/explore")}
          style={styles.outlineButton}
        >
          <Text style={styles.outlineButtonText}>Go to Explore</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}
const styles = StyleSheet.create((theme) => ({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
  },
  centeredPadded: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing["4xl"],
  },
  loadingText: {
    color: theme.colors.neutral[400],
  },
  heading: {
    fontSize: theme.fontSize.xl,
    fontWeight: "600",
    color: theme.colors.neutral[900],
    marginTop: theme.spacing.lg,
    textAlign: "center",
  },
  subtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  signInButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing["4xl"],
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing["3xl"],
  },
  signInText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing["4xl"],
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing["3xl"],
  },
  outlineButtonText: {
    color: theme.colors.primary[500],
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
}));
