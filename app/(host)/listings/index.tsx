import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { Plus, Ship, Clock, Users, MapPin } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { formatPrice } from "@/lib/utils";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type ListingStatus = "published" | "draft" | "paused" | "archived" | "rejected";

function ListingsContent() {
  const { theme } = useUnistyles();
  const listings = useQuery(api.listings.getByHost);

  const statusColors: Record<ListingStatus, { bg: string; text: string }> = {
    published: { bg: theme.colors.success[100], text: theme.colors.success[700] },
    draft: { bg: theme.colors.neutral[200], text: theme.colors.neutral[600] },
    paused: { bg: theme.colors.warning[100], text: theme.colors.warning[700] },
    archived: { bg: theme.colors.neutral[100], text: theme.colors.neutral[500] },
    rejected: { bg: theme.colors.error[100], text: theme.colors.error[700] },
  };

  if (listings === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ship size={64} color={theme.colors.neutral[300]} />
      <Text style={styles.emptyTitle}>No listings yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first fishing charter listing
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push("/(host)/listings/new")}
      >
        <Plus size={18} color="#fff" />
        <Text style={styles.createButtonText}>Create Listing</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListingCard = ({ item }: { item: any }) => {
    const status = (item.status as ListingStatus) || "draft";
    const statusStyle = statusColors[status];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          // Navigate to listing edit
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cardMeta}>
          {item.tripType && (
            <View style={styles.metaItem}>
              <Ship size={14} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{item.tripType}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Clock size={14} color={theme.colors.neutral[500]} />
            <Text style={styles.metaText}>{item.durationHours}h</Text>
          </View>
          {item.maxGuests && (
            <View style={styles.metaItem}>
              <Users size={14} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>Up to {item.maxGuests}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.price}>
            {formatPrice(item.priceCents)}{" "}
            <Text style={styles.priceType}>
              / {item.priceType === "per_person" ? "person" : "trip"}
            </Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={listings}
      keyExtractor={(item) => item._id}
      renderItem={renderListingCard}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default function HostListingsScreen() {
  return (
    <RoleGuard roles={["host", "admin"]}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Listings</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/(host)/listings/new")}
          >
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <ListingsContent />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.neutral[900],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
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
  cardMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
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
  priceType: {
    fontSize: 14,
    fontWeight: "400",
    color: theme.colors.neutral[500],
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
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
}));
