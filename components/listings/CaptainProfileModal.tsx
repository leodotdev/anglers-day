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
  Anchor,
  MessageCircle,
  Star,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface CaptainProfileModalProps {
  visible: boolean;
  onClose: () => void;
  captainName: string;
  captainBio?: string;
  listingId: Id<"listings">;
  hostId: Id<"users">;
}

export function CaptainProfileModal({
  visible,
  onClose,
  captainName,
  captainBio,
  listingId,
  hostId,
}: CaptainProfileModalProps) {
  const { theme } = useUnistyles();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const reviews = useQuery(api.reviews.getByListing, { listingId });
  const completedBookings = useQuery(
    api.bookings.getByGuest,
    isAuthenticated ? { status: "completed" } : "skip"
  );

  const captainReviews = (reviews ?? []).filter(
    (r) => r.ratingCaptain != null
  );
  const avgCaptainRating =
    captainReviews.length > 0
      ? captainReviews.reduce((sum, r) => sum + (r.ratingCaptain ?? 0), 0) /
        captainReviews.length
      : null;

  const hasCompletedBookingForListing = (completedBookings ?? []).some(
    (b) => b.listingId === listingId
  );

  const handleMessage = () => {
    onClose();
    if (!isAuthenticated) {
      router.push({
        pathname: "/(auth)/sign-in",
        params: { context: "Message this captain by logging in" },
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
                <Anchor size={28} color={theme.colors.primary[500]} />
              </View>
              <Text style={styles.name}>{captainName}</Text>
              {avgCaptainRating != null && (
                <View style={styles.ratingRow}>
                  <Star
                    size={15}
                    color={theme.colors.warning[500]}
                    fill={theme.colors.warning[500]}
                  />
                  <Text style={styles.ratingText}>
                    {avgCaptainRating.toFixed(1)}
                  </Text>
                  <Text style={styles.ratingCount}>
                    ({captainReviews.length} review
                    {captainReviews.length !== 1 ? "s" : ""})
                  </Text>
                </View>
              )}
            </View>

            {/* Bio */}
            {captainBio ? (
              <View style={styles.bioSection}>
                <Text style={styles.sectionLabel}>About</Text>
                <Text style={styles.bioText}>{captainBio}</Text>
              </View>
            ) : null}

            {/* Reviews snapshot */}
            {captainReviews.length > 0 && (
              <View style={styles.reviewsSection}>
                <Text style={styles.sectionLabel}>Recent Reviews</Text>
                {captainReviews.slice(0, 3).map((review) => (
                  <View key={review._id} style={styles.reviewCard}>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={11}
                          color={theme.colors.warning[500]}
                          fill={
                            s <= (review.ratingCaptain ?? 0)
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
                <Text style={styles.messageBtnText}>Message Captain</Text>
              </Pressable>

              {hasCompletedBookingForListing && (
                <Pressable style={styles.rateBtn} onPress={handleRate}>
                  <Star size={16} color={theme.colors.warning[500]} />
                  <Text style={styles.rateBtnText}>Rate Captain</Text>
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

  // Profile
  profileSection: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.theme.colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
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

  // Bio
  bioSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.theme.colors.neutral[500],
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 14,
    color: theme.theme.colors.neutral[600],
    lineHeight: 21,
  },

  // Reviews
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

  // Actions
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
