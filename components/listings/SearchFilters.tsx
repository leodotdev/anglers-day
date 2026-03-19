import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SlidersHorizontal,
  X,
  Check,
  MapPin,
  CalendarDays,
  Navigation,
  Users,
  Minus,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";

export interface SearchFilterValues {
  tripTypes: string[];
  city?: string;
  date?: string; // YYYY-MM-DD (start date)
  dateEnd?: string; // YYYY-MM-DD (end date for range)
  guests?: number;
  sortBy?: "newest" | "price_asc" | "price_desc" | "rating" | "reviews" | "nearby";
}

export interface SearchFiltersProps {
  filters: SearchFilterValues;
  onApply: (filters: SearchFilterValues) => void;
  cities: string[];
  locationCity?: string | null;
  onUseMyLocation?: () => void;
  locationLoading?: boolean;
}

const TRIP_TYPES = [
  "Inshore",
  "Offshore",
  "Deep Sea",
  "Fly Fishing",
  "Trolling",
  "Bottom Fishing",
  "Spearfishing",
  "Sunset Cruise",
];

const SORT_OPTIONS: { value: SearchFilterValues["sortBy"]; label: string }[] = [
  { value: "nearby", label: "Nearest to Me" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

type DatePreset = "this_weekend" | "next_weekend" | "custom";

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function getWeekendDates(weeksAhead: number): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const daysUntilSat = ((6 - day) % 7) + weeksAhead * 7;
  const sat = new Date(now);
  sat.setDate(now.getDate() + (daysUntilSat === 0 && weeksAhead === 0 ? 0 : daysUntilSat));
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return {
    start: toDateStr(sat.getFullYear(), sat.getMonth(), sat.getDate()),
    end: toDateStr(sun.getFullYear(), sun.getMonth(), sun.getDate()),
  };
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function detectPreset(date?: string, dateEnd?: string): DatePreset | null {
  if (!date) return null;
  const thisWknd = getWeekendDates(0);
  const nextWknd = getWeekendDates(1);
  if (date === thisWknd.start && dateEnd === thisWknd.end) return "this_weekend";
  if (date === nextWknd.start && dateEnd === nextWknd.end) return "next_weekend";
  if (date) return "custom";
  return null;
}

export function SearchFilters({
  filters,
  onApply,
  cities,
  locationCity,
  onUseMyLocation,
  locationLoading,
}: SearchFiltersProps) {
  const { theme } = useUnistyles();
  const [modalVisible, setModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [draftFilters, setDraftFilters] = useState<SearchFilterValues>(filters);

  // Calendar state for the date picker modal
  const today = new Date();
  const [calViewYear, setCalViewYear] = useState(today.getFullYear());
  const [calViewMonth, setCalViewMonth] = useState(today.getMonth());
  const [calStart, setCalStart] = useState<string | null>(null);
  const [calEnd, setCalEnd] = useState<string | null>(null);

  const activePreset = detectPreset(filters.date, filters.dateEnd);

  const activeCount =
    filters.tripTypes.length +
    (filters.city ? 1 : 0) +
    (filters.sortBy && filters.sortBy !== "newest" ? 1 : 0);

  const openModal = () => {
    setDraftFilters({ ...filters });
    setModalVisible(true);
  };

  const handleApply = () => {
    onApply(draftFilters);
    setModalVisible(false);
  };

  const handleReset = () => {
    setDraftFilters({
      tripTypes: [],
      city: undefined,
      date: undefined,
      dateEnd: undefined,
      guests: undefined,
      sortBy: undefined,
    });
  };

  const toggleTripType = (type: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      tripTypes: prev.tripTypes.includes(type)
        ? prev.tripTypes.filter((t) => t !== type)
        : [...prev.tripTypes, type],
    }));
  };

  const handlePresetTap = (preset: DatePreset) => {
    if (preset === "custom") {
      setCalStart(filters.date ?? null);
      setCalEnd(filters.dateEnd ?? null);
      setDateModalVisible(true);
      return;
    }
    const isActive = activePreset === preset;
    if (isActive) {
      onApply({ ...filters, date: undefined, dateEnd: undefined });
    } else {
      const wknd = preset === "this_weekend" ? getWeekendDates(0) : getWeekendDates(1);
      onApply({ ...filters, date: wknd.start, dateEnd: wknd.end });
    }
  };

  const handleCityChipTap = () => {
    setLocationModalVisible(true);
  };

  const handleLocationSelect = (city?: string, nearby?: boolean) => {
    setLocationModalVisible(false);
    if (nearby && onUseMyLocation) {
      onUseMyLocation();
      onApply({ ...filters, city: undefined, sortBy: "nearby" });
    } else {
      onApply({
        ...filters,
        city,
        sortBy: filters.sortBy === "nearby" ? undefined : filters.sortBy,
      });
    }
  };

  // Calendar helpers
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calViewYear, calViewMonth, 1).getDay();
    const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [calViewYear, calViewMonth]);

  const calMonthLabel = new Date(calViewYear, calViewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const canGoPrev = calViewYear > today.getFullYear() ||
    (calViewYear === today.getFullYear() && calViewMonth > today.getMonth());

  const handleCalDayPress = (day: number) => {
    const dateStr = toDateStr(calViewYear, calViewMonth, day);
    if (dateStr < todayStr) return;

    if (!calStart || (calStart && calEnd)) {
      // Start new selection
      setCalStart(dateStr);
      setCalEnd(null);
    } else {
      // Complete the range
      if (dateStr < calStart) {
        setCalStart(dateStr);
        setCalEnd(calStart);
      } else if (dateStr === calStart) {
        // Single day
        setCalEnd(dateStr);
      } else {
        setCalEnd(dateStr);
      }
    }
  };

  const getCalDayState = (day: number) => {
    const dateStr = toDateStr(calViewYear, calViewMonth, day);
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;
    const isStart = dateStr === calStart;
    const isEnd = dateStr === calEnd;
    const isSelected = isStart || isEnd;
    const isInRange = !!(calStart && calEnd && dateStr > calStart && dateStr < calEnd);
    return { isPast, isToday, isSelected, isStart, isEnd, isInRange };
  };

  const handleCalApply = () => {
    if (calStart) {
      onApply({ ...filters, date: calStart, dateEnd: calEnd ?? calStart });
    }
    setDateModalVisible(false);
  };

  const handleCalClear = () => {
    setCalStart(null);
    setCalEnd(null);
    onApply({ ...filters, date: undefined, dateEnd: undefined });
    setDateModalVisible(false);
  };

  // Date chip label for custom range
  const customDateLabel = useMemo(() => {
    if (activePreset !== "custom" || !filters.date) return null;
    if (filters.date === filters.dateEnd || !filters.dateEnd) {
      return formatShortDate(filters.date);
    }
    return `${formatShortDate(filters.date)} – ${formatShortDate(filters.dateEnd)}`;
  }, [activePreset, filters.date, filters.dateEnd]);

  const locationLabel = filters.city
    ? filters.city
    : locationCity
      ? locationCity
      : "Near Me";

  return (
    <View style={styles.root}>
      {/* Location + Date quick bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        {/* Location chip */}
        <TouchableOpacity
          onPress={handleCityChipTap}
          style={[styles.chip, styles.locationChip, filters.city && styles.chipActive]}
        >
          {locationLoading ? (
            <Text style={styles.chipText}>Locating...</Text>
          ) : (
            <>
              <Navigation size={14} color={filters.city ? theme.colors.primary[700] : theme.colors.primary[500]} />
              <Text style={[styles.chipText, filters.city && styles.chipTextActive]}>
                {locationLabel}
              </Text>
              <ChevronDown size={14} color={filters.city ? theme.colors.primary[700] : theme.colors.neutral[400]} />
            </>
          )}
        </TouchableOpacity>

        {/* Guests chip */}
        <View style={[styles.chip, styles.guestsChip, !!filters.guests && styles.chipActive]}>
          <Users size={14} color={filters.guests ? theme.colors.primary[700] : theme.colors.neutral[600]} />
          <TouchableOpacity
            onPress={() => {
              const current = filters.guests ?? 1;
              if (current > 1) onApply({ ...filters, guests: current - 1 });
              else onApply({ ...filters, guests: undefined });
            }}
            hitSlop={8}
          >
            <Minus size={14} color={theme.colors.neutral[500]} />
          </TouchableOpacity>
          <Text style={[styles.guestsText, !!filters.guests && styles.chipTextActive]}>
            {filters.guests ?? 1}
          </Text>
          <TouchableOpacity
            onPress={() => {
              const current = filters.guests ?? 1;
              onApply({ ...filters, guests: current + 1 });
            }}
            hitSlop={8}
          >
            <Plus size={14} color={theme.colors.neutral[500]} />
          </TouchableOpacity>
        </View>

        {/* Date preset chips */}
        <TouchableOpacity
          onPress={() => handlePresetTap("this_weekend")}
          style={[styles.chip, styles.datePresetChip, activePreset === "this_weekend" && styles.chipActive]}
        >
          <CalendarDays size={14} color={activePreset === "this_weekend" ? theme.colors.primary[700] : theme.colors.neutral[600]} />
          <Text style={[styles.chipText, activePreset === "this_weekend" && styles.chipTextActive]}>
            This Weekend
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handlePresetTap("next_weekend")}
          style={[styles.chip, styles.datePresetChip, activePreset === "next_weekend" && styles.chipActive]}
        >
          <Text style={[styles.chipText, activePreset === "next_weekend" && styles.chipTextActive]}>
            Next Weekend
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handlePresetTap("custom")}
          style={[styles.chip, styles.datePresetChip, activePreset === "custom" && styles.chipActive]}
        >
          <Text style={[styles.chipText, activePreset === "custom" && styles.chipTextActive]}>
            {customDateLabel ?? "Pick Dates"}
          </Text>
        </TouchableOpacity>

        {/* Filters button */}
        <TouchableOpacity onPress={openModal} style={styles.filtersButton}>
          <SlidersHorizontal size={16} color={theme.colors.neutral[700]} />
          <Text style={styles.filtersButtonText}>Filters</Text>
          {activeCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.white }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={theme.colors.neutral[900]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              {onUseMyLocation && (
                <TouchableOpacity
                  onPress={() => {
                    onUseMyLocation();
                    setDraftFilters((prev) => ({ ...prev, city: undefined, sortBy: "nearby" }));
                  }}
                  style={[
                    styles.locationRow,
                    draftFilters.sortBy === "nearby" && !draftFilters.city && styles.optionRowSelected,
                  ]}
                >
                  <Navigation size={18} color={theme.colors.primary[500]} />
                  <Text style={styles.locationRowText}>
                    {locationCity ? `Near ${locationCity}` : "Use My Location"}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.optionsList}>
                <TouchableOpacity
                  onPress={() =>
                    setDraftFilters((prev) => ({ ...prev, city: undefined, sortBy: prev.sortBy === "nearby" ? undefined : prev.sortBy }))
                  }
                  style={[
                    styles.optionRow,
                    !draftFilters.city && draftFilters.sortBy !== "nearby" && styles.optionRowSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      !draftFilters.city && draftFilters.sortBy !== "nearby" && styles.optionTextSelected,
                    ]}
                  >
                    All Locations
                  </Text>
                  {!draftFilters.city && draftFilters.sortBy !== "nearby" && (
                    <Check size={16} color={theme.colors.primary[500]} />
                  )}
                </TouchableOpacity>
                {cities.map((city) => {
                  const isSelected = draftFilters.city === city;
                  return (
                    <TouchableOpacity
                      key={city}
                      onPress={() =>
                        setDraftFilters((prev) => ({ ...prev, city, sortBy: prev.sortBy === "nearby" ? undefined : prev.sortBy }))
                      }
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {city}
                      </Text>
                      {isSelected && (
                        <Check size={16} color={theme.colors.primary[500]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Trip Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trip Type</Text>
              <View style={styles.optionsGrid}>
                {TRIP_TYPES.map((type) => {
                  const isSelected = draftFilters.tripTypes.includes(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => toggleTripType(type)}
                      style={[
                        styles.optionChip,
                        isSelected && styles.optionChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          isSelected && styles.optionChipTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                      {isSelected && (
                        <Check size={14} color={theme.colors.primary[700]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sort Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.optionsList}>
                {SORT_OPTIONS.map(({ value, label }) => {
                  const isSelected = draftFilters.sortBy === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          sortBy: value,
                        }))
                      }
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {label}
                      </Text>
                      {isSelected && (
                        <Check size={16} color={theme.colors.primary[500]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Button variant="default" size="lg" onPress={handleApply}>
              Apply Filters
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Date picker modal */}
      <Modal
        visible={dateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDateModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.white }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDateModalVisible(false)}>
              <X size={24} color={theme.colors.neutral[900]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Dates</Text>
            <TouchableOpacity onPress={handleCalClear}>
              <Text style={styles.resetText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateModalContent}>
            {/* Selection summary */}
            <View style={styles.dateSelectionSummary}>
              {calStart ? (
                <Text style={styles.dateSelectionText}>
                  {calEnd && calEnd !== calStart
                    ? `${formatShortDate(calStart)} – ${formatShortDate(calEnd)}`
                    : formatShortDate(calStart)}
                  {calStart && !calEnd && (
                    <Text style={styles.dateSelectionHint}> — tap another date for a range</Text>
                  )}
                </Text>
              ) : (
                <Text style={styles.dateSelectionHint}>Tap a date to start</Text>
              )}
            </View>

            {/* Calendar */}
            <View style={styles.calContainer}>
              <View style={styles.calHeader}>
                <Pressable
                  onPress={() => {
                    if (calViewMonth === 0) { setCalViewMonth(11); setCalViewYear(calViewYear - 1); }
                    else setCalViewMonth(calViewMonth - 1);
                  }}
                  disabled={!canGoPrev}
                  style={styles.calNavBtn}
                >
                  <ChevronLeft size={22} color={canGoPrev ? theme.colors.neutral[700] : theme.colors.neutral[200]} />
                </Pressable>
                <Text style={styles.calMonthLabel}>{calMonthLabel}</Text>
                <Pressable
                  onPress={() => {
                    if (calViewMonth === 11) { setCalViewMonth(0); setCalViewYear(calViewYear + 1); }
                    else setCalViewMonth(calViewMonth + 1);
                  }}
                  style={styles.calNavBtn}
                >
                  <ChevronRight size={22} color={theme.colors.neutral[700]} />
                </Pressable>
              </View>

              <View style={styles.calWeekdayRow}>
                {WEEKDAYS.map((wd) => (
                  <View key={wd} style={styles.calWeekdayCell}>
                    <Text style={styles.calWeekdayText}>{wd}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.calGrid}>
                {calendarDays.map((day, i) => {
                  if (day === null) {
                    return <View key={`empty-${i}`} style={styles.calDayCell} />;
                  }
                  const state = getCalDayState(day);
                  return (
                    <Pressable
                      key={day}
                      style={[
                        styles.calDayCell,
                        state.isInRange && styles.calDayCellInRange,
                        state.isStart && calEnd && styles.calDayCellRangeStart,
                        state.isEnd && calStart && calStart !== calEnd && styles.calDayCellRangeEnd,
                      ]}
                      onPress={() => handleCalDayPress(day)}
                      disabled={state.isPast}
                    >
                      <View
                        style={[
                          styles.calDayCircle,
                          state.isSelected && styles.calDayCircleSelected,
                          state.isToday && !state.isSelected && styles.calDayCircleToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calDayText,
                            state.isPast && styles.calDayTextDisabled,
                            state.isSelected && styles.calDayTextSelected,
                            state.isToday && !state.isSelected && styles.calDayTextToday,
                            state.isInRange && styles.calDayTextInRange,
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Quick presets inside modal */}
            <View style={styles.dateModalPresets}>
              <Text style={styles.dateModalPresetsLabel}>Quick Select</Text>
              <View style={styles.dateModalPresetsRow}>
                {([
                  { key: "this_weekend", label: "This Weekend" },
                  { key: "next_weekend", label: "Next Weekend" },
                ] as const).map(({ key, label }) => {
                  const wknd = key === "this_weekend" ? getWeekendDates(0) : getWeekendDates(1);
                  const isActive = calStart === wknd.start && calEnd === wknd.end;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => { setCalStart(wknd.start); setCalEnd(wknd.end); }}
                      style={[styles.dateModalPresetChip, isActive && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <Button variant="default" size="lg" onPress={handleCalApply} disabled={!calStart}>
              {calStart
                ? calEnd && calEnd !== calStart
                  ? `Select ${formatShortDate(calStart)} – ${formatShortDate(calEnd)}`
                  : `Select ${formatShortDate(calStart)}`
                : "Select Dates"}
            </Button>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Location picker modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.white }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
              <X size={24} color={theme.colors.neutral[900]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Location</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Near Me option */}
            {onUseMyLocation && (
              <TouchableOpacity
                onPress={() => handleLocationSelect(undefined, true)}
                style={styles.locationPickerRow}
              >
                <View style={styles.locationPickerIcon}>
                  <Navigation size={20} color={theme.colors.primary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationPickerLabel}>Near Me</Text>
                  {locationCity && (
                    <Text style={styles.locationPickerSub}>{locationCity}</Text>
                  )}
                </View>
                {filters.sortBy === "nearby" && !filters.city && (
                  <Check size={18} color={theme.colors.primary[500]} />
                )}
              </TouchableOpacity>
            )}

            {/* All locations */}
            <TouchableOpacity
              onPress={() => handleLocationSelect(undefined, false)}
              style={styles.locationPickerRow}
            >
              <View style={styles.locationPickerIcon}>
                <MapPin size={20} color={theme.colors.neutral[500]} />
              </View>
              <Text style={styles.locationPickerLabel}>All Locations</Text>
              {!filters.city && filters.sortBy !== "nearby" && (
                <Check size={18} color={theme.colors.primary[500]} />
              )}
            </TouchableOpacity>

            {/* Individual cities */}
            {cities.map((city) => (
              <TouchableOpacity
                key={city}
                onPress={() => handleLocationSelect(city, false)}
                style={styles.locationPickerRow}
              >
                <View style={styles.locationPickerIcon}>
                  <MapPin size={20} color={theme.colors.neutral[400]} />
                </View>
                <Text style={styles.locationPickerLabel}>{city}</Text>
                {filters.city === city && (
                  <Check size={18} color={theme.colors.primary[500]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
  },
  chipScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationChip: {
    borderColor: theme.colors.primary[200],
    backgroundColor: theme.colors.primary[50],
  },
  guestsChip: {
    gap: 6,
    borderColor: theme.colors.neutral[300],
  },
  guestsText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.neutral[700],
    minWidth: 16,
    textAlign: "center",
  },
  datePresetChip: {
    gap: 6,
  },
  chipActive: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
  },
  chipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.neutral[700],
  },
  chipTextActive: {
    color: theme.colors.primary[700],
  },
  dateModalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  dateSelectionSummary: {
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  dateSelectionText: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  dateSelectionHint: {
    fontSize: theme.fontSize.sm,
    fontWeight: "400",
    color: theme.colors.neutral[400],
  },
  calContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.neutral[100],
    padding: 12,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  calMonthLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.neutral[900],
  },
  calWeekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  calWeekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  calWeekdayText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.neutral[400],
    textTransform: "uppercase",
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calDayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calDayCellInRange: {
    backgroundColor: theme.colors.primary[50],
  },
  calDayCellRangeStart: {
    backgroundColor: theme.colors.primary[50],
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  calDayCellRangeEnd: {
    backgroundColor: theme.colors.primary[50],
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  calDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  calDayCircleSelected: {
    backgroundColor: theme.colors.primary[500],
  },
  calDayCircleToday: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary[300],
  },
  calDayText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.neutral[900],
  },
  calDayTextDisabled: {
    color: theme.colors.neutral[200],
  },
  calDayTextSelected: {
    color: theme.colors.white,
    fontWeight: "700",
  },
  calDayTextToday: {
    color: theme.colors.primary[500],
    fontWeight: "700",
  },
  calDayTextInRange: {
    color: theme.colors.primary[700],
    fontWeight: "600",
  },
  dateModalPresets: {
    marginTop: theme.spacing.lg,
  },
  dateModalPresetsLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.neutral[500],
    marginBottom: theme.spacing.sm,
  },
  dateModalPresetsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateModalPresetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  filtersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  filtersButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.neutral[700],
  },
  countBadge: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  resetText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.primary[500],
  },
  modalContent: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  sectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.md,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary[50],
    marginBottom: 8,
  },
  locationRowText: {
    fontSize: theme.fontSize.base,
    fontWeight: "500",
    color: theme.colors.primary[700],
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    backgroundColor: theme.colors.white,
  },
  optionChipSelected: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
  },
  optionChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[700],
  },
  optionChipTextSelected: {
    color: theme.colors.primary[700],
    fontWeight: "500",
  },
  optionsList: {
    gap: 2,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
  },
  optionRowSelected: {
    backgroundColor: theme.colors.primary[50],
  },
  optionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[700],
  },
  optionTextSelected: {
    color: theme.colors.primary[700],
    fontWeight: "500",
  },
  modalFooter: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },

  // Location picker
  locationPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  locationPickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.neutral[50],
    justifyContent: "center",
    alignItems: "center",
  },
  locationPickerLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.neutral[800],
  },
  locationPickerSub: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    marginTop: 1,
  },
}));
