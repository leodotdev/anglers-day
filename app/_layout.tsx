import "@/lib/unistyles";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SecureStore from "expo-secure-store";
import { AuthDialogProvider } from "@/components/auth/AuthDialog";
import { useThemeMode } from "@/hooks/useTheme";


const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!,
  {
    unsavedChangesWarning: false,
  }
);

const secureStorage = Platform.OS !== "web" ? {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
} : undefined;

export default function RootLayout() {
  useThemeMode();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexAuthProvider client={convex} storage={secureStorage}>
          <AuthDialogProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(guest)" />
              <Stack.Screen name="(host)" />
              <Stack.Screen name="(auth)" options={{ presentation: "transparentModal", animation: "fade" }} />
              <Stack.Screen name="booking" options={{ presentation: "modal" }} />
              <Stack.Screen name="conversation" />
            </Stack>
          </AuthDialogProvider>
          <StatusBar style="auto" />
        </ConvexAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
