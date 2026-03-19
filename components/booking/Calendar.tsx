import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { StyleSheet } from "react-native-unistyles";
import { colors } from "@/lib/colors";

type DateSet = Set<string>;

interface CalendarProps {
  mode: "single" | "range";
  availableDates: DateSet;
  selectedDate: string | null;
  selectedEndDate: string | null;
  onSelectDate: (date: string) => void;
  onSelectRange: (start: string, end: string | null) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseDate(s: string): Date {
  return new Date(s + "T12:00:00");
}

export function Calendar({
  mode,
  availableDates,
  selectedDate,
  selectedEndDate,
  onSelectDate,
  onSelectRange,
}: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayPress = (day: number) => {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    if (dateStr < todayStr) return;
    if (!availableDates.has(dateStr)) return;

    if (mode === "single") {
      onSelectDate(dateStr);
    } else {
      // Range mode
      if (!selectedDate || (selectedDate && selectedEndDate)) {
        // Start new range
        onSelectRange(dateStr, null);
      } else {
        // Complete the range
        if (dateStr < selectedDate) {
          onSelectRange(dateStr, selectedDate);
        } else if (dateStr === selectedDate) {
          // Same date = single-day range
          onSelectRange(dateStr, dateStr);
        } else {
          onSelectRange(selectedDate, dateStr);
        }
      }
    }
  };

  const getDayState = (day: number) => {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    const isPast = dateStr < todayStr;
    const isAvailable = availableDates.has(dateStr);
    const isToday = dateStr === todayStr;

    let isSelected = false;
    let isRangeStart = false;
    let isRangeEnd = false;
    let isInRange = false;

    if (mode === "single") {
      isSelected = dateStr === selectedDate;
    } else {
      isRangeStart = dateStr === selectedDate;
      isRangeEnd = dateStr === selectedEndDate;
      isSelected = isRangeStart || isRangeEnd;

      if (selectedDate && selectedEndDate) {
        isInRange = dateStr > selectedDate && dateStr < selectedEndDate;
      }
    }

    return { isPast, isAvailable, isToday, isSelected, isRangeStart, isRangeEnd, isInRange };
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Can't go before current month
  const canGoPrev = viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.header}>
        <Pressable
          onPress={goToPrevMonth}
          disabled={!canGoPrev}
          style={styles.navBtn}
        >
          <ChevronLeft size={22} color={canGoPrev ? colors.neutral[700] : colors.neutral[200]} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={goToNextMonth} style={styles.navBtn}>
          <ChevronRight size={22} color={colors.neutral[700]} />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((wd) => (
          <View key={wd} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{wd}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {calendarDays.map((day, i) => {
          if (day === null) {
            return <View key={`empty-${i}`} style={styles.dayCell} />;
          }

          const state = getDayState(day);
          const disabled = state.isPast || !state.isAvailable;

          return (
            <Pressable
              key={day}
              style={[
                styles.dayCell,
                state.isInRange && styles.dayCellInRange,
                state.isRangeStart && styles.dayCellRangeStart,
                state.isRangeEnd && styles.dayCellRangeEnd,
              ]}
              onPress={() => handleDayPress(day)}
              disabled={disabled}
            >
              <View
                style={[
                  styles.dayCircle,
                  state.isSelected && styles.dayCircleSelected,
                  state.isToday && !state.isSelected && styles.dayCircleToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    disabled && styles.dayTextDisabled,
                    state.isSelected && styles.dayTextSelected,
                    state.isToday && !state.isSelected && styles.dayTextToday,
                    state.isInRange && styles.dayTextInRange,
                  ]}
                >
                  {day}
                </Text>
              </View>
              {state.isAvailable && !state.isPast && (
                <View style={[styles.availDot, state.isSelected && styles.availDotSelected]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.neutral[900],
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.neutral[400],
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayCellInRange: {
    backgroundColor: colors.primary[50],
  },
  dayCellRangeStart: {
    backgroundColor: colors.primary[50],
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  dayCellRangeEnd: {
    backgroundColor: colors.primary[50],
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleSelected: {
    backgroundColor: colors.primary[500],
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: colors.primary[300],
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.neutral[900],
  },
  dayTextDisabled: {
    color: colors.neutral[200],
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dayTextToday: {
    color: colors.primary[500],
    fontWeight: "700",
  },
  dayTextInRange: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  availDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.success[500],
  },
  availDotSelected: {
    backgroundColor: "#fff",
  },
}));
