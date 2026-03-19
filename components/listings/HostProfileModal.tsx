import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { AnimatedDialog } from "@/components/shared/AnimatedDialog";
import {
  X,
  MessageCircle,
  Star,
  Calendar,
  MapPin,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface HostProfileModalProps {
  visible: boolean;
  onClose: () => void;
  hostId: Id<"users">;
  hostFirstName?: string;
  hostLastName?: string;
  listingId: Id<"listings">;
}

export function HostProfileModal({
  visible,
  onClose,
  hostId,
  hostFirstName,
  hostLastName,
  listingId,
}: HostProfileModalProps) {
  const { theme } = useUnistyles();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const reviews = useQuery(api.reviews.getByListing, { listingId });
  const completedBookings = useQuery(
    api.bookings.getByGuest,
    isAuthenticated ? { status: "completed" } : "skip"
  );

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  const hasCompletedBooking = (completedBookings ?? []).some(
    (b) => b.listingId === listingId
  );

  const displayName = [hostFirstName, hostLastName].filter(Boolean).join(" ") || "Host";
  const initial = hostFirstName?.[0] ?? "H";

  const handleMessage = () => {
    onClose();
    if (!isAuthenticated) {
      router.push({
        pathname: "/(auth)/sign-in",
        params: { context: "Message this host by logging in" },
      });
      return;
    }
    // TODO: Navigate to conversation with host
  };

  const handleRate = () => {
    onClose();
    // TODO: Navigate to review form
  };

  return (
    <AnimatedDialog visible={visible} onClose={onClose}>
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <X size={18} color={theme.colors.neutral[500]} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
            {/* Avatar + name */}
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <Text style={styles.name}>{displayName}</Text>
              {avgRating != null && (
                <View style={styles.ratingRow}>
                  <Star
                    size={15}
                    color={theme.colors.warning[500]}
                    fill={theme.colors.warning[500]}
                  />
                  <Text style={styles.ratingText}>
                    {avgRating.toFixed(1)}
                  </Text>
                  <Text style={styles.ratingCount}>
                    ({reviews!.length} review
                    {reviews!.length !== 1 ? "s" : ""})
                  </Text>
                </View>
              )}
            </View>

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.sectionLabel}>Recent Reviews</Text>
                {reviews.slice(0, 3).map((review) => (
                  <View key={review._id} style={styles.reviewCard}>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={11}
                          color={theme.colors.warning[500]}
                          fill={
                            s <= review.rating
                              ? theme.colors.warning[500]
                              : "transparent"
                          }
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewBody} numberOfLines={3}>
                      {review.body}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable style={styles.messageBtn} onPress={handleMessage}>
                <MessageCircle size={16} color={theme.colors.primary[500]} />
                <Text style={styles.messageBtnText}>Message Host</Text>
              </Pressable>

              {hasCompletedBooking && (
                <Pressable style={styles.rateBtn} onPress={handleRate}>
                  <Star size={16} color={theme.colors.warning[500]} />
                  <Text style={styles.rateBtnText}>Leave a Review</Text>
                </Pressable>
              )}
            </View>
      </ScrollView>
    </AnimatedDialog>
  );
}

const styles = StyleSheet.create((theme) => ({
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.theme.colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },

  profileSection: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.theme.colors.neutral[900],
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.theme.colors.neutral[700],
  },
  ratingCount: {
    fontSize: 13,
    color: theme.theme.colors.neutral[400],
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.theme.colors.neutral[500],
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  reviewsSection: {
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: theme.theme.colors.neutral[50],
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 4,
  },
  reviewBody: {
    fontSize: 13,
    color: theme.theme.colors.neutral[600],
    lineHeight: 19,
  },

  actions: {
    gap: 8,
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: theme.theme.colors.primary[500],
    borderRadius: 12,
    paddingVertical: 12,
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.theme.colors.primary[500],
  },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.theme.colors.warning[50],
    borderRadius: 12,
    paddingVertical: 12,
  },
  rateBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.theme.colors.warning[700],
  },
}));
