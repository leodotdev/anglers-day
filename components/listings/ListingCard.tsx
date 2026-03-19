import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { MapPin, Clock, Users, Star, Zap, ChevronLeft, ChevronRight, Anchor } from "lucide-react-native";
import { router } from "expo-router";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { formatPrice, formatLabel } from "@/lib/utils";
import { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "./FavoriteButton";

const isWeb = Platform.OS === "web";

export interface ListingCardProps {
  listing: Doc<"listings"> & { boat?: any; host?: any };
  onPress?: () => void;
  photoUrls?: string[];
  photoUrl?: string | null;
  showFavorite?: boolean;
  searchDate?: string;
  searchGuests?: number;
}

export function ListingCard({
  listing,
  onPress,
  photoUrls,
  photoUrl,
  showFavorite = true,
  searchDate,
  searchGuests,
}: ListingCardProps) {
  const { theme } = useUnistyles();
  const handlePress = onPress ?? (() => {
    const params: Record<string, string> = {};
    if (searchDate) params.date = searchDate;
    if (searchGuests && searchGuests > 1) params.guests = String(searchGuests);
    const qs = Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";
    router.push(`/(guest)/explore/${listing._id}${qs}` as any);
  });

  const photos = photoUrls ?? (photoUrl ? [photoUrl] : []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const prev = () => setActiveIndex((i) => (i <= 0 ? photos.length - 1 : i - 1));
  const next = () => setActiveIndex((i) => (i >= photos.length - 1 ? 0 : i + 1));

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Image area */}
      <View style={styles.imageContainer}>
        {photos.length > 0 ? (
          isWeb ? (
            // @ts-ignore
            <img
              src={photos[activeIndex]}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "opacity 0.15s ease",
              }}
              draggable={false}
            />
          ) : (
            <ExpoImage
              source={{ uri: photos[activeIndex] }}
              style={styles.image}
              contentFit="cover"
              transition={150}
            />
          )
        ) : (
          <View style={styles.placeholder}>
            <Anchor size={32} color={theme.colors.neutral[400]} />
          </View>
        )}

        {/* Prev/Next buttons — show on hover (web) or always (if touched) */}
        {photos.length > 1 && hovered && (
          <>
            <Pressable
              style={[styles.navBtn, styles.navBtnLeft]}
              onPress={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft size={16} color="#fff" />
            </Pressable>
            <Pressable
              style={[styles.navBtn, styles.navBtnRight]}
              onPress={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight size={16} color="#fff" />
            </Pressable>
          </>
        )}

        {/* Dots */}
        {photos.length > 1 && (
          <View style={styles.dotsRow} pointerEvents="none">
            {photos.map((_: string, i: number) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>
        )}

        {/* Overlay: favorite + badge */}
        <View style={styles.overlayContainer} pointerEvents="box-none">
          {showFavorite && (
            <View style={styles.favoriteOverlay}>
              <FavoriteButton listingId={listing._id} />
            </View>
          )}
          {listing.tripType && (
            <View style={styles.tripTypeBadge}>
              <Text style={styles.tripTypeText}>{formatLabel(listing.tripType)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>

        <View style={styles.row}>
          <MapPin size={14} color={theme.colors.neutral[500]} />
          <Text style={styles.locationText}>
            {[listing.departureCity, listing.departureState].filter(Boolean).join(", ")}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Clock size={14} color={theme.colors.neutral[500]} />
            <Text style={styles.detailText}>{listing.durationHours}h</Text>
          </View>
          <View style={styles.detailItem}>
            <Users size={14} color={theme.colors.neutral[500]} />
            <Text style={styles.detailText}>{listing.maxGuests}</Text>
          </View>
          {listing.reviewCount > 0 && listing.averageRating != null && (
            <View style={styles.detailItem}>
              <Star size={14} color={theme.colors.warning[500]} />
              <Text style={styles.detailText}>
                {listing.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              {formatPrice(listing.priceCents)}
            </Text>
            <Text style={styles.priceUnit}>
              {listing.priceType === "per_person" ? "/person" : "/day"}
            </Text>
          </View>
          {listing.instantBook && (
            <Badge variant="success">
              <View style={styles.instantBookBadge}>
                <Zap size={10} color={theme.colors.success[700]} />
                <Text style={styles.instantBookText}>Instant Book</Text>
              </View>
            </Badge>
          )}
        </View>

      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius["2xl"],
    overflow: "hidden",
  },
  imageContainer: {
    height: 192,
    position: "relative",
    backgroundColor: theme.colors.neutral[100],
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  navBtnLeft: {
    left: 8,
  },
  navBtnRight: {
    right: 8,
  },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    zIndex: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: "#fff",
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  favoriteOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  tripTypeBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: theme.colors.neutral[900],
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tripTypeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: "600",
    color: theme.colors.neutral[50],
  },
  content: {
    padding: theme.spacing.lg,
    gap: 8,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceText: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.neutral[900],
  },
  priceUnit: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
  },
  instantBookBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  instantBookText: {
    fontSize: theme.fontSize.xs,
    fontWeight: "500",
    color: theme.colors.success[700],
  },
}));
