import { useState, useMemo, useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { AnimatedCollapse } from "@/components/shared/AnimatedCollapse";
import { useAuthDialog } from "@/components/auth/AuthDialog";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  MapPin,
  Clock,
  Users,
  Minus,
  Plus,
  LogIn,
  UserPlus,
  Check,
  X,
  Mail,
  CalendarDays,
  CalendarRange,
  ChevronDown,
} from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Calendar } from "@/components/booking/Calendar";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function BookingScreen() {
  const { theme } = useUnistyles();
  const { listingId, date: prefillDate, guests: prefillGuests } = useLocalSearchParams<{
    listingId: string;
    date?: string;
    guests?: string;
  }>();
  const { isAuthenticated } = useConvexAuth();
  const { user } = useCurrentUser();
  const { showAuth } = useAuthDialog();
  const { signIn } = useAuthActions();
  const createOrGet = useMutation(api.users.createOrGet);

  const listing = useQuery(api.listings.getById, {
    id: listingId as Id<"listings">,
  });
  const availability = useQuery(api.availability.getByListing, {
    listingId: listingId as Id<"listings">,
  });

  const createBooking = useMutation(api.bookings.create);
  const createAsGuest = useMutation(api.bookings.createAsGuest);
  const inviteParticipant = useMutation(api.participants.invite);

  // Form state — prefill from search params if available
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [selectedDate, setSelectedDate] = useState<string | null>(prefillDate ?? null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(
    prefillGuests ? Math.max(1, parseInt(prefillGuests, 10) || 1) : 1
  );
  const [specialRequests, setSpecialRequests] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Invite state
  const [inviteExpanded, setInviteExpanded] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");

  // Default to upcoming Saturday if available (only if no prefilled date)
  useEffect(() => {
    if (selectedDate || !availability) return;
    if (prefillDate) return; // Don't override prefill
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
    const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7; // next Sat, not today
    const sat = new Date(today);
    sat.setDate(today.getDate() + daysUntilSat);
    const satStr = sat.toISOString().split("T")[0];

    const isAvailable = availability.some(
      (s) => s.date === satStr && s.isAvailable
    );
    if (isAvailable) {
      setSelectedDate(satStr);
    }
  }, [availability]);

  // Clamp party size to listing bounds once listing loads
  useEffect(() => {
    if (!listing) return;
    const min = listing.minGuests ?? 1;
    const max = listing.maxGuests;
    if (partySize < min) setPartySize(min);
    else if (partySize > max) setPartySize(max);
  }, [listing]);

  const availableDateSet = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const set = new Set<string>();
    for (const s of availability ?? []) {
      if (s.isAvailable && s.date >= today) set.add(s.date);
    }
    return set;
  }, [availability]);

  // Find the first slot for the selected start date (used for time display)
  const selectedSlot = useMemo(() => {
    if (!selectedDate || !availability) return null;
    return availability.find((s) => s.date === selectedDate && s.isAvailable) ?? null;
  }, [selectedDate, availability]);

  if (listing === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  if (listing === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Listing not found</Text>
      </View>
    );
  }

  // Price calculation
  const numDays = (() => {
    if (dateMode === "single" || !selectedEndDate || !selectedDate) return 1;
    const start = new Date(selectedDate + "T12:00:00");
    const end = new Date(selectedEndDate + "T12:00:00");
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  })();

  const unitPrice = selectedSlot?.customPriceCents ?? listing.priceCents;
  const dayPrice = listing.priceType === "per_person" ? unitPrice * partySize : unitPrice;
  const totalPrice = dayPrice * numDays;

  const minGuests = listing.minGuests ?? 1;
  const maxGuests = listing.maxGuests;

  const hasValidDate = dateMode === "single"
    ? !!selectedDate
    : !!selectedDate && !!selectedEndDate;

  const canSubmit = hasValidDate && selectedSlot && (
    isAuthenticated ||
    (guestName.trim() && guestEmail.trim() && /\S+@\S+\.\S+/.test(guestEmail))
  ) && (!createAccount || password.length >= 8);

  const handleDateModeChange = (mode: "single" | "range") => {
    setDateMode(mode);
    setSelectedDate(null);
    setSelectedEndDate(null);
  };

  const addInviteEmail = () => {
    const email = inviteInput.trim();
    if (!email) return;
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address");
      return;
    }
    if (inviteEmails.includes(email)) return;
    if (inviteEmails.length >= partySize - 1) {
      Alert.alert("Party full", `You can invite up to ${partySize - 1} additional guests`);
      return;
    }
    setInviteEmails([...inviteEmails, email]);
    setInviteInput("");
  };

  const removeInviteEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email));
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedDate) return;
    setError("");
    setIsSubmitting(true);

    try {
      let bookingId: Id<"bookings">;
      let accessToken: string | undefined;

      const endDate = dateMode === "range" ? selectedEndDate ?? undefined : undefined;

      if (isAuthenticated) {
        bookingId = await createBooking({
          listingId: listingId as Id<"listings">,
          date: selectedDate,
          endDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          partySize,
          costSharingEnabled: false,
          specialRequests: specialRequests.trim() || undefined,
        });
      } else {
        const result = await createAsGuest({
          listingId: listingId as Id<"listings">,
          date: selectedDate,
          endDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          partySize,
          specialRequests: specialRequests.trim() || undefined,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim() || undefined,
        });
        bookingId = result.bookingId;
        accessToken = result.accessToken;

        if (createAccount && password.length >= 8) {
          try {
            await signIn("password", {
              email: guestEmail.trim(),
              password,
              flow: "signUp",
            });
            await createOrGet({
              firstName: guestName.trim().split(" ")[0],
              lastName: guestName.trim().split(" ").slice(1).join(" ") || undefined,
              phone: guestPhone.trim() || undefined,
            });
          } catch {
            // Booking succeeded, account creation didn't - that's OK
          }
        }
      }

      // Send invites (best-effort)
      for (const email of inviteEmails) {
        try {
          await inviteParticipant({
            bookingId,
            email,
            accessToken,
          });
        } catch {
          // Non-critical
        }
      }

      Alert.alert(
        "Booking Confirmed!",
        isAuthenticated
          ? "You can view your booking in the Trips tab."
          : "We'll send a confirmation to your email with a link to manage your booking.",
        [
          {
            text: "OK",
            onPress: () => {
              if (router.canDismiss()) {
                router.dismiss();
              } else {
                router.replace("/(guest)/explore");
              }
            },
          },
        ]
      );
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Login banner for unauthenticated users */}
        {!isAuthenticated && (
          <View style={styles.loginBanner}>
            <Text style={styles.loginBannerTitle}>Have an account?</Text>
            <Text style={styles.loginBannerSub}>
              Log in for faster booking and to manage your trips
            </Text>
            <View style={styles.loginBannerButtons}>
              <TouchableOpacity
                style={styles.loginBannerBtn}
                onPress={() => showAuth("login")}
              >
                <LogIn size={16} color={theme.colors.primary[500]} />
                <Text style={styles.loginBannerBtnText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.loginBannerBtn, styles.loginBannerBtnOutline]}
                onPress={() => showAuth("signup")}
              >
                <UserPlus size={16} color={theme.colors.neutral[600]} />
                <Text style={styles.loginBannerBtnTextOutline}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Listing summary */}
        <View style={styles.listingSummary}>
          <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
          <View style={styles.listingMeta}>
            <View style={styles.metaItem}>
              <MapPin size={14} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{listing.departurePort}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{listing.durationHours}h</Text>
            </View>
            <View style={styles.metaItem}>
              <Users size={14} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>Up to {maxGuests}</Text>
            </View>
          </View>
        </View>

        {/* Date mode toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Dates</Text>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, dateMode === "single" && styles.modeBtnActive]}
              onPress={() => handleDateModeChange("single")}
            >
              <CalendarDays size={16} color={dateMode === "single" ? "#fff" : theme.colors.neutral[600]} />
              <Text style={[styles.modeBtnText, dateMode === "single" && styles.modeBtnTextActive]}>
                Single Day
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, dateMode === "range" && styles.modeBtnActive]}
              onPress={() => handleDateModeChange("range")}
            >
              <CalendarRange size={16} color={dateMode === "range" ? "#fff" : theme.colors.neutral[600]} />
              <Text style={[styles.modeBtnText, dateMode === "range" && styles.modeBtnTextActive]}>
                Multiple Days
              </Text>
            </TouchableOpacity>
          </View>

          {/* Calendar */}
          <Calendar
            mode={dateMode}
            availableDates={availableDateSet}
            selectedDate={selectedDate}
            selectedEndDate={selectedEndDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setSelectedEndDate(null);
            }}
            onSelectRange={(start, end) => {
              setSelectedDate(start);
              setSelectedEndDate(end);
            }}
          />

          {/* Selection summary */}
          {selectedDate && (
            <View style={styles.dateSelection}>
              <Text style={styles.dateSelectionText}>
                {dateMode === "single" || !selectedEndDate
                  ? formatDate(selectedDate)
                  : `${formatDate(selectedDate)} - ${formatDate(selectedEndDate)} (${numDays} days)`}
              </Text>
            </View>
          )}
        </View>

        {/* Time display */}
        {selectedSlot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time</Text>
            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>
                {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
              </Text>
            </View>
          </View>
        )}

        {/* Party size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Party Size</Text>
          <View style={styles.stepper}>
            <Pressable
              style={[styles.stepperBtn, partySize <= minGuests && styles.stepperBtnDisabled]}
              onPress={() => {
                if (partySize > minGuests) setPartySize(partySize - 1);
              }}
            >
              <Minus size={20} color={partySize <= minGuests ? theme.colors.neutral[300] : theme.colors.neutral[700]} />
            </Pressable>
            <Text style={styles.stepperValue}>{partySize}</Text>
            <Pressable
              style={[styles.stepperBtn, partySize >= maxGuests && styles.stepperBtnDisabled]}
              onPress={() => {
                if (partySize < maxGuests) setPartySize(partySize + 1);
              }}
            >
              <Plus size={20} color={partySize >= maxGuests ? theme.colors.neutral[300] : theme.colors.neutral[700]} />
            </Pressable>
          </View>
          {listing.priceType === "per_person" && (
            <Text style={styles.priceCalc}>
              {formatPrice(unitPrice)} x {partySize} guest{partySize > 1 ? "s" : ""}
              {numDays > 1 ? ` x ${numDays} days` : ""}
            </Text>
          )}
        </View>

        {/* Invite participants */}
        {partySize > 1 && (
          <View style={styles.section}>
            <Pressable
              style={styles.inviteToggle}
              onPress={() => setInviteExpanded(!inviteExpanded)}
            >
              <View style={styles.inviteToggleLeft}>
                <Mail size={18} color={theme.colors.primary[500]} />
                <View>
                  <Text style={styles.inviteToggleTitle}>
                    Invite Your Party
                    {inviteEmails.length > 0 ? ` (${inviteEmails.length})` : ""}
                  </Text>
                  <Text style={styles.inviteToggleSub}>Optional — can do after booking too</Text>
                </View>
              </View>
              <AnimatedChevron expanded={inviteExpanded} />
            </Pressable>

            <AnimatedCollapse expanded={inviteExpanded}>
              <View style={styles.inviteBody}>
                <View style={styles.inviteInputRow}>
                  <TextInput
                    style={styles.inviteInput}
                    placeholder="friend@email.com"
                    placeholderTextColor={theme.colors.neutral[400]}
                    value={inviteInput}
                    onChangeText={setInviteInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onSubmitEditing={addInviteEmail}
                    returnKeyType="done"
                  />
                  <Pressable
                    style={[styles.inviteAddBtn, !inviteInput.trim() && styles.inviteAddBtnDisabled]}
                    onPress={addInviteEmail}
                  >
                    <Plus size={18} color={!inviteInput.trim() ? theme.colors.neutral[300] : "#fff"} />
                  </Pressable>
                </View>

                {inviteEmails.length > 0 && (
                  <View style={styles.inviteList}>
                    {inviteEmails.map((email) => (
                      <View key={email} style={styles.inviteChip}>
                        <Mail size={14} color={theme.colors.primary[500]} />
                        <Text style={styles.inviteChipText} numberOfLines={1}>{email}</Text>
                        <Pressable
                          onPress={() => removeInviteEmail(email)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={16} color={theme.colors.neutral[400]} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={styles.inviteCount}>
                  {inviteEmails.length} of {partySize - 1} spots invited
                </Text>
              </View>
            </AnimatedCollapse>
          </View>
        )}

        {/* Special requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Requests (optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any dietary needs, accessibility requirements, or preferences..."
            placeholderTextColor={theme.colors.neutral[400]}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Contact info for unauthenticated users */}
        {!isAuthenticated ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Contact Info</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Smith"
                placeholderTextColor={theme.colors.neutral[400]}
                value={guestName}
                onChangeText={setGuestName}
                autoComplete="name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.neutral[400]}
                value={guestEmail}
                onChangeText={setGuestEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor={theme.colors.neutral[400]}
                value={guestPhone}
                onChangeText={setGuestPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setCreateAccount(!createAccount)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, createAccount && styles.checkboxChecked]}>
                {createAccount && <Check size={14} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>
                Create an account to manage your bookings
              </Text>
            </TouchableOpacity>

            {createAccount && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password (min 8 characters)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={theme.colors.neutral[400]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking as</Text>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View>
                <Text style={styles.userName}>
                  {user?.firstName
                    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
                    : user?.email ?? "User"}
                </Text>
                {user?.email && <Text style={styles.userEmail}>{user.email}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentCardLeft}>
              <View style={styles.paymentIcon}>
                <Text style={styles.paymentIconText}>💳</Text>
              </View>
              <View>
                <Text style={styles.paymentLabel}>Pay at checkout</Text>
                <Text style={styles.paymentSub}>
                  Secure payment via Stripe
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.paymentNote}>
            You won't be charged until the host confirms your booking.
          </Text>
        </View>

        {/* Price summary */}
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {listing.priceType === "per_person"
                ? `${formatPrice(unitPrice)} x ${partySize} guest${partySize > 1 ? "s" : ""}`
                : `${formatPrice(unitPrice)} / day`}
              {numDays > 1 ? ` x ${numDays} days` : ""}
            </Text>
            <Text style={styles.priceValue}>{formatPrice(totalPrice)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total</Text>
            <Text style={styles.priceTotalValue}>{formatPrice(totalPrice)}</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, (!canSubmit || isSubmitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AnimatedChevron({ expanded }: { expanded: boolean }) {
  const { theme } = useUnistyles();
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withTiming(expanded ? 180 : 0, { duration: 200 });
  }, [expanded]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <ChevronDown size={20} color={theme.colors.neutral[400]} />
    </Animated.View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.white,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.neutral[500],
  },

  // Login banner
  loginBanner: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  loginBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    marginBottom: 4,
  },
  loginBannerSub: {
    fontSize: 13,
    color: theme.colors.neutral[600],
    marginBottom: 12,
  },
  loginBannerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  loginBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginBannerBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary[500],
  },
  loginBannerBtnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  loginBannerBtnTextOutline: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.neutral[600],
  },

  // Listing summary
  listingSummary: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    marginBottom: 10,
  },
  listingMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.neutral[500],
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    marginBottom: 12,
  },
  sectionSub: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    marginBottom: 12,
  },
  optionalBadge: {
    fontSize: 11,
    color: theme.colors.neutral[400],
    fontWeight: "500",
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },

  // Date mode toggle
  modeToggle: {
    flexDirection: "row",
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: theme.colors.primary[500],
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.neutral[600],
  },
  modeBtnTextActive: {
    color: "#fff",
  },

  // Date selection summary
  dateSelection: {
    marginTop: 12,
    backgroundColor: theme.colors.primary[50],
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dateSelectionText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary[700],
    textAlign: "center",
  },

  // Time
  timeDisplay: {
    backgroundColor: theme.colors.neutral[50],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.neutral[700],
  },

  // Stepper
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    justifyContent: "center",
    alignItems: "center",
  },
  stepperBtnDisabled: {
    borderColor: theme.colors.neutral[100],
    backgroundColor: theme.colors.neutral[50],
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    minWidth: 32,
    textAlign: "center",
  },
  priceCalc: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    marginTop: 8,
  },

  // Invite participants
  inviteToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.neutral[100],
  },
  inviteToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  inviteToggleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  inviteToggleSub: {
    fontSize: 12,
    color: theme.colors.neutral[400],
    marginTop: 1,
  },
  inviteBody: {
    marginTop: 12,
  },
  inviteInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  inviteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.neutral[900],
    backgroundColor: theme.colors.neutral[50],
  },
  inviteAddBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  inviteAddBtnDisabled: {
    backgroundColor: theme.colors.neutral[100],
  },
  inviteList: {
    marginTop: 10,
    gap: 6,
  },
  inviteChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primary[50],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inviteChipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.neutral[700],
  },
  inviteCount: {
    fontSize: 12,
    color: theme.colors.neutral[400],
    marginTop: 8,
    textAlign: "right",
  },

  // Text area
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.neutral[900],
    minHeight: 80,
    backgroundColor: theme.colors.neutral[50],
  },

  // Inputs
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.neutral[700],
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: theme.colors.neutral[900],
    backgroundColor: theme.colors.neutral[50],
  },

  // Checkbox
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  checkboxLabel: {
    fontSize: 14,
    color: theme.colors.neutral[700],
    flex: 1,
  },

  // User info (authenticated)
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 12,
    padding: 14,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    marginTop: 1,
  },

  // Price summary
  priceSummary: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    flex: 1,
  },
  priceValue: {
    fontSize: 14,
    color: theme.colors.neutral[700],
    fontWeight: "500",
  },
  priceDivider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginVertical: 12,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.neutral[900],
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.neutral[900],
  },

  // Error
  errorBox: {
    backgroundColor: theme.colors.error[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBoxText: {
    fontSize: 14,
    color: theme.colors.error[700],
    fontWeight: "500",
  },

  // Submit
  submitButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  // Payment
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  paymentCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.primary[50],
    justifyContent: "center",
    alignItems: "center",
  },
  paymentIconText: {
    fontSize: 20,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.neutral[800],
  },
  paymentSub: {
    fontSize: 12,
    color: theme.colors.neutral[500],
    marginTop: 1,
  },
  paymentNote: {
    fontSize: 12,
    color: theme.colors.neutral[400],
    marginTop: 8,
    fontStyle: "italic",
  },
}));
