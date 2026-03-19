import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function SignUpScreen() {
  const { theme } = useUnistyles();
  const { signIn } = useAuthActions();
  const createOrGet = useMutation(api.users.createOrGet);
  const { email: prefillEmail } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await signIn("password", { email: email.trim(), password, flow: "signUp" });
      try {
        await createOrGet({ phone: phone.trim() || undefined });
      } catch {
        // User record will be auto-created on next authenticated action
      }
      if (router.canDismiss()) {
        router.dismiss();
      } else {
        router.replace("/(guest)/explore");
      }
    } catch (e: any) {
      const msg = (e?.message ?? "").toLowerCase();
      if (msg.includes("already exists") || msg.includes("already") || msg.includes("duplicate") || msg.includes("unique")) {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (msg.includes("password") && msg.includes("weak")) {
        setError("Password is too weak. Use at least 8 characters with a mix of letters and numbers.");
      } else if (msg.includes("invalid") && msg.includes("email")) {
        setError("This email address appears to be invalid.");
      } else if (msg.includes("too many") || msg.includes("rate")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "apple" | "google") => {
    setOauthLoading(provider);
    setError("");
    try {
      await signIn(provider);
      if (router.canDismiss()) {
        router.dismiss();
      } else {
        router.replace("/(guest)/explore");
      }
    } catch (e: any) {
      setError(e?.message || "Sign up failed. Please try again.");
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Angler's Day and start fishing
          </Text>

          <Pressable style={[styles.oauthButton, styles.oauthButtonDisabled]} disabled>
            <Text style={styles.oauthIcon}>{"\uF8FF"}</Text>
            <Text style={styles.oauthButtonText}>Continue with Apple</Text>
            <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Soon</Text></View>
          </Pressable>

          <Pressable style={[styles.oauthButton, styles.oauthButtonDisabled]} disabled>
            <Text style={styles.oauthIcon}>G</Text>
            <Text style={styles.oauthButtonText}>Continue with Google</Text>
            <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Soon</Text></View>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.neutral[400]}
              value={email}
              onChangeText={(t) => { setError(""); setEmail(t); }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              placeholderTextColor={theme.colors.neutral[400]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password (min 8 chars)"
              placeholderTextColor={theme.colors.neutral[400]}
              value={password}
              onChangeText={(t) => { setError(""); setPassword(t); }}
              secureTextEntry
              autoComplete="new-password"
              editable={!isLoading}
              onSubmitEditing={handleSignUp}
              returnKeyType="go"
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, (isLoading || oauthLoading) && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading || oauthLoading !== null}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Pressable
              onPress={() => router.replace({ pathname: "/(auth)/sign-in", params: { email: email.trim() } })}
            >
              <Text style={styles.link}>Log in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.neutral[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.neutral[500],
    marginBottom: 32,
  },
  oauthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: theme.colors.white,
  },
  oauthButtonDisabled: {
    opacity: 0.6,
  },
  oauthIcon: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  soonBadge: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  soonBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.neutral[400],
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.neutral[200],
  },
  dividerText: {
    fontSize: 14,
    color: theme.colors.neutral[400],
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: theme.colors.error[50],
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error[700],
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.neutral[700],
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.neutral[900],
    backgroundColor: theme.colors.neutral[50],
  },
  button: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    alignSelf: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
    color: theme.colors.neutral[500],
  },
  link: {
    fontSize: 14,
    color: theme.colors.primary[500],
    fontWeight: "600",
  },
}));
