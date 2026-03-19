import { Tabs } from "expo-router";
import { useConvexAuth, useQuery } from "convex/react";
import {
  LayoutDashboard,
  Ship,
  CalendarCheck,
  MessageCircle,
  DollarSign,
} from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { FloatingTabBar } from "@/components/shared/FloatingTabBar";
import { useUnistyles } from "react-native-unistyles";

export default function HostLayout() {
  const { isAuthenticated } = useConvexAuth();
  const { theme } = useUnistyles();
  const unreadCount = useQuery(
    api.conversations.getUnreadCount,
    isAuthenticated ? {} : "skip"
  );

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.neutral[50] },
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="listings/index"
        options={{
          title: "Listings",
          tabBarIcon: ({ color, size }) => (
            <Ship size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="listings/new"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="bookings/index"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox/index"
        options={{
          title: "Inbox",
          tabBarBadge: unreadCount && unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings/index"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => (
            <DollarSign size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
