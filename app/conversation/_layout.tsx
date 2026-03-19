import { Stack, router } from "expo-router";
import { Pressable, useColorScheme } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { colors, darkColors } from "@/lib/colors";

function BackButton() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? darkColors : colors;
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/");
      }}
      hitSlop={12}
      style={{ paddingHorizontal: 4, paddingVertical: 4 }}
    >
      <ChevronLeft size={26} color={c.neutral[700]} />
    </Pressable>
  );
}

export default function ConversationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen name="[id]" options={{ title: "" }} />
    </Stack>
  );
}
