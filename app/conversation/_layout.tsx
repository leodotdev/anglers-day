import { Stack, router } from "expo-router";
import { Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useUnistyles } from "react-native-unistyles";

function BackButton() {
  const { theme } = useUnistyles();
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/");
      }}
      hitSlop={12}
      style={{ paddingHorizontal: 4, paddingVertical: 4 }}
    >
      <ChevronLeft size={26} color={theme.colors.neutral[700]} />
    </Pressable>
  );
}

export default function ConversationLayout() {
  const { theme } = useUnistyles();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerLeft: () => <BackButton />,
        headerStyle: { backgroundColor: theme.colors.white },
        headerTintColor: theme.colors.neutral[900],
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="[id]" options={{ title: "" }} />
    </Stack>
  );
}
