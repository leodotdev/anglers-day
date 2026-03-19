import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useUnistyles();
  const activeColor = theme.colors.primary[500];
  const inactiveColor = theme.colors.neutral[500];

  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    const itemStyle = options.tabBarItemStyle as { display?: string } | undefined;
    return itemStyle?.display !== "none";
  });

  const tabs = visibleRoutes.map((route, index) => {
    const { options } = descriptors[route.key];
    const label =
      typeof options.tabBarLabel === "string"
        ? options.tabBarLabel
        : options.title ?? route.name;
    const isFocused = state.routes[state.index]?.key === route.key;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: "tabLongPress",
        target: route.key,
      });
    };

    const icon = options.tabBarIcon?.({
      focused: isFocused,
      color: isFocused ? activeColor : inactiveColor,
      size: 24,
    });

    const badge = options.tabBarBadge;

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        style={[
          styles.tab,
          isFocused && styles.tabActive,
          index > 0 && styles.tabOverlap,
        ]}
      >
        <View style={styles.iconContainer}>
          {icon}
          {badge != null && Number(badge) > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {Number(badge) > 99 ? "99+" : badge}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.label, isFocused && styles.labelActive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        <View style={styles.tabRow}>
          {tabs}
        </View>
      </View>
    </View>
  );
}

const isWeb = Platform.OS === "web";

const styles = StyleSheet.create((theme) => ({
  wrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 28 : 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pill: {
    borderRadius: 9999,
    backgroundColor: theme.colors.white,
    ...(!isWeb ? {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 40,
      elevation: 16,
    } : {
      boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
    } as any),
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 1,
  },
  tabActive: {
    backgroundColor: theme.colors.neutral[100],
  },
  tabOverlap: {
    marginLeft: -8,
  },
  iconContainer: {
    position: "relative",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.neutral[500],
  },
  labelActive: {
    color: theme.colors.primary[500],
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: theme.colors.error[500],
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
}));
