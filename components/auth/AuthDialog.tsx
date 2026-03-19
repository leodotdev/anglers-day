import React, { createContext, useContext, useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, Modal, Platform, ActivityIndicator, Alert, ScrollView } from "react-native";
import { X } from "lucide-react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { router } from "expo-router";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type AuthMode = "login" | "signup";

interface AuthDialogContext {
  showAuth: (mode?: AuthMode) => void;
  hideAuth: () => void;
}

const AuthCtx = createContext<AuthDialogContext>({
  showAuth: () => {},
  hideAuth: () => {},
});

export const useAuthDialog = () => useContext(AuthCtx);

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const showAuth = useCallback((m: AuthMode = "login") => {
    setMode(m);
    setVisible(true);
  }, []);

  const hideAuth = useCallback(() => setVisible(false), []);

  return (
    <AuthCtx.Provider value={{ showAuth, hideAuth }}>
      {children}
      {visible && <AuthDialogModal mode={mode} setMode={setMode} onClose={hideAuth} />}
    </AuthCtx.Provider>
  );
}

function AuthDialogModal({
  mode,
  setMode,
  onClose,
}: {
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  onClose: () => void;
}) {
  const { theme } = useUnistyles();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setError("");
    setPassword("");
  };

  const switchMode = (m: AuthMode) => {
    resetForm();
    setMode(m);
  };

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setIsLoading(true);
    try {
      await signIn("password", { email: email.trim(), password, flow: "signIn" });
      onClose();
    } catch (e: any) {
      const msg = (e?.message ?? "").toLowerCase();
      if (msg.includes("invalid") || msg.includes("password") || msg.includes("credentials")) {
        setError("Incorrect email or password.");
      } else if (msg.includes("not found") || msg.includes("no user")) {
        setError("No account found. Try signing up.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setIsLoading(true);
    try {
      await signIn("password", { email: email.trim(), password, flow: "signUp" });
      onClose();
    } catch (e: any) {
      const msg = (e?.message ?? "").toLowerCase();
      if (msg.includes("already") || msg.includes("exists")) {
        setError("An account with this email already exists. Try logging in.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = () => {
    Alert.alert("Coming soon", "Social sign-in coming soon.");
  };

  const content = (
    <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
      <View style={styles.dialogHeader}>
        <Pressable onPress={onClose} hitSlop={12} style={{ padding: 4 }}>
          <X size={22} color={theme.colors.neutral[400]} />
        </Pressable>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>{mode === "login" ? "Welcome back" : "Create Account"}</Text>
        <Text style={styles.subtitle}>
          {mode === "login" ? "Log in to book your next fishing charter" : "Join Angler's Day and start fishing"}
        </Text>

        <Pressable style={[styles.oauthButton, { opacity: 0.6 }]} disabled>
          <Text style={styles.oauthIcon}>{"\uF8FF"}</Text>
          <Text style={styles.oauthButtonText}>Continue with Apple</Text>
          <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Soon</Text></View>
        </Pressable>

        <Pressable style={[styles.oauthButton, { opacity: 0.6 }]} disabled>
          <Text style={styles.oauthIcon}>G</Text>
          <Text style={styles.oauthButtonText}>Continue with Google</Text>
          <View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Soon</Text></View>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {mode === "signup" && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={theme.colors.neutral[400]}
              value={name}
              onChangeText={(t) => { setError(""); setName(t); }}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>
        )}

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
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
            placeholderTextColor={theme.colors.neutral[400]}
            value={password}
            onChangeText={(t) => { setError(""); setPassword(t); }}
            secureTextEntry
            editable={!isLoading}
            onSubmitEditing={mode === "login" ? handleLogin : handleSignup}
            returnKeyType="go"
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={mode === "login" ? handleLogin : handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{mode === "login" ? "Log In" : "Sign Up"}</Text>
          )}
        </Pressable>

        <View style={styles.linkRow}>
          <Text style={styles.linkText}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <Pressable onPress={() => switchMode(mode === "login" ? "signup" : "login")}>
            <Text style={styles.link}>{mode === "login" ? "Sign up" : "Log in"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );

  // On web: render as a fixed overlay (no Modal needed, stays in same tree)
  if (Platform.OS === "web") {
    return (
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.dialog}>
          {content}
        </View>
      </View>
    );
  }

  // On native: use Modal
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.dialog}>
          {content}
        </View>
      </View>
    </Modal>
  );
}

const isWeb = Platform.OS === "web";

const styles = StyleSheet.create((theme) => ({
  overlay: {
    ...(isWeb
      ? { position: "fixed" as any, top: 0, left: 0, right: 0, bottom: 0 }
      : { flex: 1 }),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
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
    width: "90%",
    maxWidth: 440,
    maxHeight: "90%",
    overflow: "hidden",
    ...(isWeb
      ? { boxShadow: "0 16px 48px rgba(0,0,0,0.18)" }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.15, shadowRadius: 48, elevation: 24 }),
  } as any,
  dialogHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.neutral[900],
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.neutral[500],
    marginBottom: 24,
  },
  oauthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 10,
    backgroundColor: theme.colors.white,
  },
  oauthIcon: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  oauthButtonText: {
    fontSize: 15,
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
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.neutral[200],
  },
  dividerText: {
    fontSize: 13,
    color: theme.colors.neutral[400],
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 14,
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
    paddingVertical: 13,
    fontSize: 15,
    color: theme.colors.neutral[900],
    backgroundColor: theme.colors.white,
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
  button: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
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
