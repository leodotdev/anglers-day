import { useState, useRef, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, Share, ActivityIndicator, Image, Platform } from "react-native";
import type { ScrollView as ScrollViewType } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import {
  MapPin,
  Clock,
  Users,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Share as ShareIcon,
  MessageCircle,
  Anchor,
  Info,
  Fish,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Gallery } from "@/components/listings/Gallery";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import { CaptainProfileModal } from "@/components/listings/CaptainProfileModal";
import { HostProfileModal } from "@/components/listings/HostProfileModal";
import { MiniCalendar } from "@/components/listings/MiniCalendar";
import { useAuthDialog } from "@/components/auth/AuthDialog";
import { formatPrice, formatLabel } from "@/lib/utils";
import { getSpeciesImage } from "@/lib/speciesImages";
import { getListingPhotos } from "@/lib/dummyPhotos";
import { ListingMap } from "@/components/listings/ListingMap";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const SPECIES_CARD_WIDTH = 120; // card width + gap

export default function ListingDetailScreen() {
  const { id, date, guests } = useLocalSearchParams<{ id: string; date?: string; guests?: string }>();
  const { theme } = useUnistyles();
  const { width: screenWidth } = useWindowDimensions();
  const heroAspectRatio = screenWidth >= 768 ? 16 / 9 : 4 / 3;
  const speciesScrollRef = useRef<ScrollViewType>(null);
  const speciesOffsetRef = useRef(0);
  const { isAuthenticated } = useConvexAuth();
  const { showAuth } = useAuthDialog();
  const [selectedDate, setSelectedDate] = useState<string | null>(date ?? null);
  const [captainModalVisible, setCaptainModalVisible] = useState(false);
  const [hostModalVisible, setHostModalVisible] = useState(false);
  const listing = useQuery(api.listings.getById, {
    id: id as Id<"listings">,
  });
  const calendarSlots = useQuery(api.availability.getCalendar, {
    listingId: id as Id<"listings">,
  });
  const getOrCreateInquiry = useMutation(api.conversations.getOrCreateInquiry);

  // Price calculation for selected date
  const selectedSlotData = useMemo(() => {
    if (!selectedDate || !calendarSlots || !listing) return null;
    const slot = calendarSlots.find((s) => s.date === selectedDate);
    if (!slot || slot.status !== "available") return null;
    const baseCents = slot.customPriceCents ?? listing.priceCents;
    const serviceFee = Math.round(baseCents * 0.10); // 10% service fee
    const taxes = Math.round(baseCents * 0.07); // ~7% taxes
    const total = baseCents + serviceFee + taxes;
    return { baseCents, serviceFee, taxes, total };
  }, [selectedDate, calendarSlots, listing]);

  const handleShare = async () => {
    if (!listing) return;
    try {
      await Share.share({
        message: `Check out "${listing.title}" on Angler's Day!`,
      });
    } catch (_error) {
      // User cancelled
    }
  };

  const handleBook = () => {
    if (!listing) return;
    const params: Record<string, string> = {};
    if (selectedDate) params.date = selectedDate;
    if (guests) params.guests = guests;
    const qs = Object.keys(params).length
      ? "?" + new URLSearchParams(params).toString()
      : "";
    router.push(`/booking/${listing._id}${qs}` as any);
  };

  const handleMessage = async () => {
    if (!isAuthenticated) {
      showAuth("login");
      return;
    }
    if (!listing) return;
    try {
      const convoId = await getOrCreateInquiry({
        listingId: listing._id,
        hostId: listing.hostId,
      });
      router.push(`/conversation/${convoId}`);
    } catch {
      // Silently fail — user might not be authenticated yet
    }
  };

  if (listing === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  if (listing === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Listing not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.errorLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Gallery photos={getListingPhotos(id)} aspectRatio={heroAspectRatio} showArrows />

        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <FavoriteButton listingId={id as Id<"listings">} />
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <ShareIcon size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header card */}
          <View style={[styles.sectionCard, { marginBottom: 24 }]}>
            <Text style={styles.title}>{listing.title}</Text>

            <View style={styles.locationRow}>
              <MapPin size={16} color={theme.colors.neutral[500]} />
              <Text style={styles.locationText}>
                {listing.departurePort}, {listing.departureCity}
              </Text>
            </View>

            <Text style={styles.description}>{listing.description}</Text>

            <View style={styles.quickInfo}>
              <View style={styles.quickInfoItem}>
                <Clock size={18} color={theme.colors.primary[500]} />
                <Text style={styles.quickInfoText}>{listing.durationHours}h</Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Users size={18} color={theme.colors.primary[500]} />
                <Text style={styles.quickInfoText}>
                  Up to {listing.maxGuests} guests
                </Text>
              </View>
              {listing.averageRating != null && (
                <View style={styles.quickInfoItem}>
                  <Star size={18} color={theme.colors.warning[500]} />
                  <Text style={styles.quickInfoText}>
                    {listing.averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.badges}>
              {listing.tripType && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{formatLabel(listing.tripType)}</Text>
                </View>
              )}
              {listing.instantBook && (
                <View style={[styles.badge, styles.badgeAccent]}>
                  <Text style={[styles.badgeText, styles.badgeAccentText]}>
                    Instant Book
                  </Text>
                </View>
              )}
              {listing.captainIncluded && (
                <View style={[styles.badge, styles.badgeSecondary]}>
                  <Anchor size={12} color={theme.colors.secondary[700]} />
                  <Text style={[styles.badgeText, styles.badgeSecondaryText]}>
                    Captain Included
                  </Text>
                </View>
              )}
            </View>
          </View>

          {calendarSlots && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability & Rates</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.success[50], borderColor: theme.colors.success[500] }]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.error[50], borderColor: theme.colors.error[500] }]} />
                  <Text style={styles.legendText}>Booked</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.neutral[100], borderColor: theme.colors.neutral[300] }]} />
                  <Text style={styles.legendText}>Unavailable</Text>
                </View>
              </View>
              <View style={styles.calendarBleed}>
                <MiniCalendar
                  slots={calendarSlots}
                  basePriceCents={listing.priceCents}
                  selectedDate={selectedDate}
                  onDayPress={(d) => setSelectedDate(d === selectedDate ? null : d)}
                  onMessageHost={handleMessage}
                />
              </View>
            </View>
          )}

          {listing.captainIncluded && listing.captainName && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Captain</Text>
              <Pressable
                style={[styles.sectionCard, styles.captainCard]}
                onPress={() => setCaptainModalVisible(true)}
              >
                <View style={styles.captainAvatar}>
                  <Anchor size={24} color={theme.colors.primary[500]} />
                </View>
                <View style={styles.captainInfo}>
                  <Text style={styles.captainName}>{listing.captainName}</Text>
                  {listing.captainBio && (
                    <Text style={styles.captainBio} numberOfLines={2}>{listing.captainBio}</Text>
                  )}
                </View>
                <ChevronRight size={20} color={theme.colors.neutral[400]} />
              </Pressable>
            </View>
          )}

          {listing.targetSpecies && listing.targetSpecies.length > 0 && (
            <View style={styles.section}>
              <View style={styles.speciesHeader}>
                <Text style={styles.sectionTitle}>Target Species</Text>
                {listing.targetSpecies.length > 4 && (
                  <View style={styles.speciesNav}>
                    <Pressable
                      onPress={() => {
                        const x = Math.max(0, speciesOffsetRef.current - SPECIES_CARD_WIDTH * 2);
                        speciesScrollRef.current?.scrollTo({ x, animated: true });
                      }}
                      hitSlop={8}
                    >
                      <ChevronLeft size={18} color={theme.colors.neutral[400]} />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        const x = speciesOffsetRef.current + SPECIES_CARD_WIDTH * 2;
                        speciesScrollRef.current?.scrollTo({ x, animated: true });
                      }}
                      hitSlop={8}
                    >
                      <ChevronRight size={18} color={theme.colors.neutral[400]} />
                    </Pressable>
                  </View>
                )}
              </View>
              <View style={styles.sectionCard}>
                <ScrollView
                  ref={speciesScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.speciesScroller}
                  onScroll={(e) => { speciesOffsetRef.current = e.nativeEvent.contentOffset.x; }}
                  scrollEventThrottle={16}
                >
                  {listing.targetSpecies.map((species: string) => {
                    const img = getSpeciesImage(species);
                    return (
                      <View key={species} style={styles.speciesCard}>
                        {img ? (
                          <Image source={img} style={styles.speciesImage} resizeMode="contain" />
                        ) : (
                          <View style={styles.speciesImagePlaceholder}>
                            <Fish size={32} color={theme.colors.neutral[300]} />
                          </View>
                        )}
                        <Text style={styles.speciesName} numberOfLines={2}>{species}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          )}

          {(() => {
            const inclusions: string[] = [];
            if (listing.includesEquipment) inclusions.push("Fishing Equipment");
            if (listing.includesBait) inclusions.push("Bait & Tackle");
            if (listing.includesLunch) inclusions.push("Lunch");
            inclusions.push(...(listing.customInclusions ?? []));
            return inclusions.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What's Included</Text>
                <View style={styles.sectionCard}>
                  <View style={styles.cardPadded}>
                    {inclusions.map((item: string) => (
                      <View key={item} style={styles.checklistItem}>
                        <Check size={16} color={theme.colors.success[500]} />
                        <Text style={styles.checklistText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : null;
          })()}

          {listing.cancellationPolicy && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cancellation Policy</Text>
              <View style={[styles.sectionCard, styles.policyCard]}>
                <Info size={18} color={theme.colors.neutral[500]} />
                <Text style={styles.policyText}>
                  {formatLabel(listing.cancellationPolicy)}
                </Text>
              </View>
            </View>
          )}

          {listing.boat && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>The Boat</Text>
              <View style={styles.sectionCard}>
                <View style={styles.cardPadded}>
                  <Text style={styles.description}>
                    {listing.boat.name} - {listing.boat.type}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Departure & Fishing Area</Text>
            <View style={styles.sectionCard}>
              <ListingMap
                latitude={listing.departureLatitude}
                longitude={listing.departureLongitude}
                departurePort={listing.departurePort}
                tripType={listing.tripType}
                durationHours={listing.durationHours}
                departureCity={listing.departureCity}
              />
            </View>
          </View>

          {listing.host && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hosted by</Text>
              <Pressable
                style={[styles.sectionCard, styles.hostCard]}
                onPress={() => setHostModalVisible(true)}
              >
                <View style={styles.hostAvatar}>
                  <Text style={styles.hostAvatarText}>
                    {listing.host.firstName?.[0] ?? "H"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hostName}>
                    {listing.host.firstName} {listing.host.lastName}
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.colors.neutral[400]} />
              </Pressable>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View style={styles.priceContainer}>
            {selectedSlotData ? (
              <>
                <Text style={styles.price}>
                  {formatPrice(selectedSlotData.total)}
                </Text>
                <Text style={styles.priceType}> total</Text>
              </>
            ) : (
              <>
                <Text style={styles.price}>
                  {formatPrice(listing.priceCents)}
                </Text>
                <Text style={styles.priceType}>
                  / {listing.priceType === "per_person" ? "person" : "day"}
                </Text>
              </>
            )}
          </View>
          <View style={styles.bottomActions}>
            <Pressable style={styles.messageButton} onPress={handleMessage}>
              <MessageCircle size={20} color={theme.colors.primary[500]} />
            </Pressable>
            <Pressable
              style={[styles.bookButton, !selectedDate && styles.bookButtonMuted]}
              onPress={handleBook}
              disabled={!selectedDate}
            >
              <Text style={styles.bookButtonText}>
                {selectedDate ? "Book Now" : "Select a Date"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {listing.captainIncluded && listing.captainName && (
        <CaptainProfileModal
          visible={captainModalVisible}
          onClose={() => setCaptainModalVisible(false)}
          captainName={listing.captainName}
          captainBio={listing.captainBio}
          listingId={listing._id}
          hostId={listing.hostId}
        />
      )}

      {listing.host && (
        <HostProfileModal
          visible={hostModalVisible}
          onClose={() => setHostModalVisible(false)}
          hostId={listing.hostId}
          hostFirstName={listing.host.firstName}
          hostLastName={listing.host.lastName}
          listingId={listing._id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.neutral[50],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.neutral[700],
    fontWeight: "600",
  },
  errorLink: {
    fontSize: 16,
    color: theme.colors.primary[500],
    fontWeight: "600",
  },
  headerOverlay: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.neutral[900],
    marginBottom: 8,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  locationText: {
    fontSize: 15,
    color: theme.colors.neutral[500],
  },
  quickInfo: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickInfoText: {
    fontSize: 14,
    color: theme.colors.neutral[700],
    fontWeight: "500",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    color: theme.colors.neutral[700],
    fontWeight: "500",
  },
  badgeAccent: {
    backgroundColor: theme.colors.accent[50],
  },
  badgeAccentText: {
    color: theme.colors.accent[700],
  },
  badgeSecondary: {
    backgroundColor: theme.colors.secondary[50],
  },
  badgeSecondaryText: {
    color: theme.colors.secondary[700],
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 11,
    color: theme.colors.neutral[600],
    fontWeight: "500",
  },
  calendarBleed: {
    ...(Platform.OS === "web"
      ? { width: "100vw", position: "relative", left: "50%", right: "50%", marginLeft: "-50vw", marginRight: "-50vw" }
      : { marginHorizontal: -20 }),
  } as any,
  section: {
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardPadded: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: theme.colors.neutral[600],
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  captainCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  captainAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  captainInfo: {
    flex: 1,
  },
  captainName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  captainBio: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    marginTop: 4,
  },
  speciesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  speciesNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  speciesScroller: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  speciesCard: {
    width: 110,
    alignItems: "center",
    overflow: "visible",
  },
  speciesImage: {
    width: 100,
    height: 72,
    marginBottom: 6,
  },
  speciesImagePlaceholder: {
    width: 100,
    height: 72,
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  speciesName: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.neutral[700],
    textAlign: "center",
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  checklistText: {
    fontSize: 15,
    color: theme.colors.neutral[700],
  },
  policyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
  },
  policyText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.neutral[600],
    lineHeight: 20,
  },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  hostAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  hostName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
    alignItems: "center",
  },
  bottomBarInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    maxWidth: 960,
    width: "100%",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.neutral[900],
  },
  priceType: {
    fontSize: 14,
    color: theme.colors.neutral[500],
  },
  bottomActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  bookButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bookButtonMuted: {
    backgroundColor: theme.colors.neutral[300],
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
}));
