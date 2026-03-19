import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useRole } from "@/hooks/useRole";

export default function RootRedirector() {
  const { role, isLoading } = useRole();
  const { theme } = useUnistyles();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  if (role === "host" || role === "admin") {
    return <Redirect href="/(host)/dashboard" />;
  }

  return <Redirect href="/(guest)/explore" />;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.neutral[50],
  },
}));
