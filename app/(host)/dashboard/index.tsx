import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import {
  Ship,
  CalendarCheck,
  DollarSign,
  Clock,
  AlertCircle,
  Plus,
  MessageCircle,
} from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { formatPrice } from "@/lib/utils";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

function DashboardContent() {
  const stats = useQuery(api.bookings.getHostStats);
  const { theme } = useUnistyles();

  if (stats === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: theme.colors.primary[500] }]}>
          <Ship size={22} color={theme.colors.primary[500]} />
          <Text style={styles.statValue}>{stats?.activeListings ?? 0}</Text>
          <Text style={styles.statLabel}>Active Listings</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: theme.colors.secondary[500] }]}>
          <CalendarCheck size={22} color={theme.colors.secondary[500]} />
          <Text style={styles.statValue}>{stats?.upcomingBookings ?? 0}</Text>
          <Text style={styles.statLabel}>Upcoming Trips</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: theme.colors.accent[500] }]}>
          <DollarSign size={22} color={theme.colors.accent[500]} />
          <Text style={styles.statValue}>
            {formatPrice(stats?.thisMonthEarnings ?? 0)}
          </Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: theme.colors.warning[500] }]}>
          <Clock size={22} color={theme.colors.warning[500]} />
          <Text style={styles.statValue}>{stats?.pendingRequests ?? 0}</Text>
          <Text style={styles.statLabel}>Pending Requests</Text>
        </View>
      </View>

      {(stats?.pendingRequests ?? 0) > 0 && (
        <View style={styles.alertBanner}>
          <AlertCircle size={20} color={theme.colors.warning[700]} />
          <Text style={styles.alertText}>
            You have {stats?.pendingRequests} pending booking{" "}
            {stats?.pendingRequests === 1 ? "request" : "requests"}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        {stats?.recentBookings && stats.recentBookings.length > 0 ? (
          stats.recentBookings.map((booking: any) => (
            <View key={booking._id} style={styles.bookingItem}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>
                  {booking.listing?.title ?? "Charter"}
                </Text>
                <Text style={styles.bookingMeta}>
                  {booking.guest?.firstName ?? "Guest"} - {booking.date}
                </Text>
              </View>
              <Text style={styles.bookingStatus}>{booking.status}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent bookings</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push("/(host)/listings/new")}
          >
            <Plus size={20} color={theme.colors.primary[500]} />
            <Text style={styles.quickActionText}>Create New Listing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push("/(host)/inbox")}
          >
            <MessageCircle size={20} color={theme.colors.primary[500]} />
            <Text style={styles.quickActionText}>View Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

export default function DashboardScreen() {
  return (
    <RoleGuard roles={["host", "admin"]}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        <DashboardContent />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.neutral[900],
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    fontWeight: "500",
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.warning[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.warning[200],
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning[700],
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    marginBottom: 12,
  },
  bookingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.neutral[800],
  },
  bookingMeta: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    marginTop: 2,
  },
  bookingStatus: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.primary[500],
    textTransform: "capitalize",
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.neutral[400],
    fontStyle: "italic",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary[50],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary[700],
  },
}));
