import { Stack, router } from "expo-router";
import { Pressable } from "react-native";
import { X } from "lucide-react-native";
import { colors } from "@/lib/colors";

function CloseButton() {
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
      <X size={22} color={colors.neutral[400]} />
    </Pressable>
  );
}

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: "Book Charter",
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerRight: () => <CloseButton />,
        headerLeft: () => null,
      }}
    >
      <Stack.Screen name="[listingId]" />
    </Stack>
  );
}
