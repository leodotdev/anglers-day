import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { Calendar, MapPin, Users as UsersIcon } from "lucide-react-native";
import { router } from "expo-router";
import { api } from "@/convex/_generated/api";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { formatPrice } from "@/lib/utils";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled_by_guest" | "cancelled_by_host" | "no_show" | "disputed";

function TripsContent() {
  const bookings = useQuery(api.bookings.getByGuest);
  const { theme } = useUnistyles();

  const statusColors: Record<BookingStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: theme.colors.warning[100], text: theme.colors.warning[700], label: "Pending" },
    confirmed: { bg: theme.colors.success[100], text: theme.colors.success[700], label: "Confirmed" },
    completed: { bg: theme.colors.secondary[100], text: theme.colors.secondary[700], label: "Completed" },
    cancelled_by_guest: { bg: theme.colors.error[100], text: theme.colors.error[700], label: "Cancelled" },
    cancelled_by_host: { bg: theme.colors.error[100], text: theme.colors.error[700], label: "Cancelled by Host" },
    no_show: { bg: theme.colors.neutral[200], text: theme.colors.neutral[600], label: "No Show" },
    disputed: { bg: theme.colors.warning[100], text: theme.colors.warning[700], label: "Disputed" },
  };

  if (bookings === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Calendar size={64} color={theme.colors.neutral[300]} />
      <Text style={styles.emptyTitle}>No trips yet</Text>
      <Text style={styles.emptySubtitle}>
        Book a fishing charter to see your trips here
      </Text>
    </View>
  );

  const renderBookingCard = ({ item }: { item: any }) => {
    const status = (item.status as BookingStatus) || "pending";
    const statusStyle = statusColors[status] ?? statusColors.pending;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(guest)/explore/${item.listingId}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.listing?.title ?? "Fishing Charter"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Calendar size={14} color={theme.colors.neutral[500]} />
            <Text style={styles.detailText}>
              {item.date} at {item.startTime}
            </Text>
          </View>

          {item.listing?.departurePort && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={theme.colors.neutral[500]} />
              <Text style={styles.detailText}>{item.listing.departurePort}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <UsersIcon size={14} color={theme.colors.neutral[500]} />
            <Text style={styles.detailText}>
              {item.partySize} {item.partySize === 1 ? "guest" : "guests"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.price}>{formatPrice(item.totalPriceCents)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={bookings}
      keyExtractor={(item) => item._id}
      renderItem={renderBookingCard}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default function TripsScreen() {
  return (
    <AuthGuard message="View your trips by logging in">
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Trips</Text>
          </View>
          <TripsContent />
        </SafeAreaView>
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.neutral[600],
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
    paddingTop: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.neutral[900],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.neutral[700],
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
}));
