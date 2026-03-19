import { Stack, router } from "expo-router";
import { Pressable } from "react-native";
import { X } from "lucide-react-native";
import { useUnistyles } from "react-native-unistyles";

function CloseButton() {
  const { theme } = useUnistyles();
  return (
    <Pressable
      onPress={() => {
        if (router.canDismiss()) router.dismiss();
        else router.replace("/(guest)/explore");
      }}
      hitSlop={12}
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <X size={22} color={theme.colors.neutral[400]} />
    </Pressable>
  );
}

export default function BookingLayout() {
  const { theme } = useUnistyles();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: "Book Charter",
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerRight: () => <CloseButton />,
        headerLeft: () => null,
        headerStyle: { backgroundColor: theme.colors.white },
        headerTintColor: theme.colors.neutral[900],
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="[listingId]" />
    </Stack>
  );
}
