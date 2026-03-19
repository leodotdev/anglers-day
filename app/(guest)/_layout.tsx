import { Tabs } from "expo-router";
import { Waves, Calendar, MessageCircle, UserCircle } from "lucide-react-native";
import { FloatingTabBar } from "@/components/shared/FloatingTabBar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUnistyles } from "react-native-unistyles";

export default function GuestLayout() {
  const { isAuthenticated } = useCurrentUser();
  const { theme } = useUnistyles();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.neutral[50] },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Waves size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips/index"
        options={{
          title: "Trips",
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox/index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: isAuthenticated ? "Profile" : "Log In",
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
