import { Stack, router, Slot } from "expo-router";
import { View, Pressable, Platform } from "react-native";
import { X } from "lucide-react-native";
import { colors } from "@/lib/colors";
import { StyleSheet } from "react-native-unistyles";

const isWeb = Platform.OS === "web";

function dismiss() {
  if (router.canDismiss()) router.dismiss();
  else router.replace("/(guest)/explore");
}

function CloseButton() {
  return (
    <Pressable onPress={dismiss} hitSlop={12} style={{ padding: 8 }}>
      <X size={22} color={colors.neutral[400]} />
    </Pressable>
  );
}

function WebDialogWrapper() {
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={dismiss} />
      <View style={styles.dialog}>
        <View style={styles.dialogHeader}>
          <CloseButton />
        </View>
        <Slot />
      </View>
    </View>
  );
}

export default function AuthLayout() {
  if (isWeb) {
    return <WebDialogWrapper />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        headerRight: () => <CloseButton />,
        headerLeft: () => null,
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: "Log In" }} />
      <Stack.Screen name="sign-up" options={{ title: "Sign Up" }} />
    </Stack>
  );
}

const webOverlay = isWeb
  ? { position: "fixed" as any, top: 0, left: 0, right: 0, bottom: 0 }
  : {};

const webShadow = isWeb
  ? { boxShadow: "0 16px 48px rgba(0,0,0,0.15)" }
  : { shadowColor: "#000", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.15, shadowRadius: 48, elevation: 24 };

const styles = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    ...webOverlay,
  } as any,
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  dialog: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 20,
    width: "100%",
    maxWidth: 440,
    maxHeight: "90%",
    overflow: "hidden",
    ...webShadow,
  } as any,
  dialogHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
}));
