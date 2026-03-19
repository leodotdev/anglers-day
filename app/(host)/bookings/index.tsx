import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { StyleSheet } from "react-native-unistyles";
export default function HostBookingsScreen() {
  return (
    <RoleGuard roles={["host", "admin"]}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bookings</Text>
          <Text style={styles.subtitle}>
            Manage incoming booking requests
          </Text>
        </View>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Bookings will appear here
          </Text>
        </View>
      </SafeAreaView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.neutral[900],
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.neutral[500],
    marginTop: 4,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.neutral[400],
    fontStyle: "italic",
  },
}));
