import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { MessageCircle } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_COUNT = 12;

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatDollar(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

export interface CalendarSlot {
  date: string;
  status: "available" | "booked" | "unavailable";
  customPriceCents?: number;
}

interface MiniCalendarProps {
  slots: CalendarSlot[];
  basePriceCents: number;
  selectedDate?: string | null;
  onDayPress: (date: string) => void;
  onMessageHost?: () => void;
}

interface MonthData {
  year: number;
  month: number;
  label: string;
  days: (number | null)[];
}

function buildMonths(): MonthData[] {
  const today = new Date();
  const result: MonthData[] = [];
  for (let i = 0; i < MONTH_COUNT; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = d.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let j = 0; j < firstDay; j++) days.push(null);
    for (let j = 1; j <= daysInMonth; j++) days.push(j);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    result.push({ year, month, label, days });
  }
  return result;
}

export function MiniCalendar({ slots, basePriceCents, selectedDate, onDayPress, onMessageHost }: MiniCalendarProps) {
  const { theme } = useUnistyles();
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const { width: screenWidth } = useWindowDimensions();

  // Month card width = ~65% of container so ~1.5 months show
  const containerWidth = Math.min(screenWidth - 40, 920);
  const monthWidth = Math.round(containerWidth * 0.65);
  const monthGap = 12;

  const slotMap = useMemo(() => {
    const m = new Map<string, CalendarSlot>();
    for (const s of slots) m.set(s.date, s);
    return m;
  }, [slots]);

  const months = useMemo(() => buildMonths(), []);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: monthGap, paddingHorizontal: 20 }}
        decelerationRate="fast"
        snapToInterval={monthWidth + monthGap}
        snapToAlignment="start"
      >
        {months.map((m) => (
          <View key={`${m.year}-${m.month}`} style={[styles.monthCard, { width: monthWidth }]}>
            <Text style={styles.monthLabel}>{m.label}</Text>

            {/* Weekday headers */}
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((wd, i) => (
                <View key={i} style={styles.weekdayCell}>
                  <Text style={styles.weekdayText}>{wd}</Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
              {m.days.map((day, i) => {
                if (day === null) {
                  return <View key={`e-${i}`} style={styles.cell} />;
                }

                const dateStr = toDateStr(m.year, m.month, day);
                const isPast = dateStr < todayStr;
                const slot = slotMap.get(dateStr);
                const status = slot?.status ?? "unavailable";
                const isAvailable = status === "available" && !isPast;
                const isBooked = status === "booked" && !isPast;
                const isSelected = dateStr === selectedDate;
                const priceCents = slot?.customPriceCents ?? basePriceCents;

                return (
                  <Pressable
                    key={day}
                    style={[
                      styles.cell,
                      isAvailable && !isSelected && styles.cellAvailable,
                      isBooked && styles.cellBooked,
                      isSelected && styles.cellSelected,
                      isPast && styles.cellPast,
                    ]}
                    onPress={() => {
                      if (isAvailable) onDayPress(dateStr);
                    }}
                    disabled={!isAvailable}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        isAvailable && !isSelected && styles.dayNumAvailable,
                        isBooked && styles.dayNumBooked,
                        isSelected && styles.dayNumSelected,
                        !isAvailable && !isBooked && styles.dayNumDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                    {!isPast && (isAvailable || isBooked) && (
                      <Text
                        style={[
                          styles.dayPrice,
                          isAvailable && !isSelected && styles.dayPriceAvailable,
                          isBooked && styles.dayPriceBooked,
                          isSelected && { color: "rgba(255,255,255,0.8)" },
                        ]}
                        numberOfLines={1}
                      >
                        {formatDollar(priceCents)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Message host CTA at end */}
        {onMessageHost && (
          <Pressable
            style={[styles.messageCard, { width: monthWidth * 0.6 }]}
            onPress={onMessageHost}
          >
            <MessageCircle size={28} color={theme.colors.primary[500]} />
            <Text style={styles.messageCardTitle}>Need different dates?</Text>
            <Text style={styles.messageCardSub}>Message the host to check availability</Text>
            <View style={styles.messageCardBtn}>
              <Text style={styles.messageCardBtnText}>Message Host</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {},
  monthCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 14,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    marginBottom: 10,
    textAlign: "center",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekdayCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.neutral[400],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    borderRadius: 6,
  },
  cellAvailable: {
    backgroundColor: theme.colors.success[50],
  },
  cellBooked: {
    backgroundColor: theme.colors.error[50],
  },
  cellSelected: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 8,
  },
  cellPast: {
    opacity: 0.3,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.neutral[500],
  },
  dayNumAvailable: {
    color: theme.colors.success[700],
  },
  dayNumBooked: {
    color: theme.colors.error[500],
  },
  dayNumSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dayNumDisabled: {
    color: theme.colors.neutral[300],
  },
  dayPrice: {
    fontSize: 9,
    fontWeight: "500",
    color: theme.colors.neutral[400],
    marginTop: -1,
  },
  dayPriceAvailable: {
    color: theme.colors.success[500],
  },
  dayPriceBooked: {
    color: theme.colors.error[300],
  },
  messageCard: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  messageCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    textAlign: "center",
  },
  messageCardSub: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    textAlign: "center",
    lineHeight: 18,
  },
  messageCardBtn: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  messageCardBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
}));
