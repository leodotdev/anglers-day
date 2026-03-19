import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useAction, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ChevronRight,
  Anchor,
  LayoutDashboard,
  LogOut,
  UserCircle,
  Camera,
  User,
  Lock,
  MapPin,
  Bell,
  Fish,
  Heart,
  CreditCard,
  Share2,
  Moon,
  Sun,
  Monitor,
  HelpCircle,
  Shield,
} from "lucide-react-native";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useThemeMode, type ThemeMode } from "@/hooks/useTheme";
import { useAuthDialog } from "@/components/auth/AuthDialog";
import { Button } from "@/components/ui/button";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function AccountScreen() {
  const { signOut } = useAuthActions();
  const { user } = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Feedback
  const sendFeedback = useAction(api.email.sendFeedback);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [fbSubject, setFbSubject] = useState("");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSending, setFbSending] = useState(false);

  const handleSendFeedback = async () => {
    if (!fbSubject.trim() || !fbMessage.trim()) {
      Alert.alert("Required", "Please fill in both subject and message.");
      return;
    }
    setFbSending(true);
    try {
      await sendFeedback({
        email: user?.email ?? "unknown",
        name: user?.firstName ?? "User",
        subject: fbSubject.trim(),
        message: fbMessage.trim(),
      });
      Alert.alert("Sent!", "Thanks for your feedback.");
      setFeedbackVisible(false);
      setFbSubject("");
      setFbMessage("");
    } catch {
      Alert.alert("Error", "Failed to send. Please try again.");
    } finally {
      setFbSending(false);
    }
  };

  const { theme } = useUnistyles();

  // Theme
  const { mode: themeMode, setMode: setThemeMode } = useThemeMode();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const startEditing = () => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setPhone(user?.phone ?? "");
    setBio(user?.bio ?? "");
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      setEditing(false);
    } catch {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setAvatarUploading(true);
    try {
      const asset = result.assets[0];

      const uploadUrl = await generateUploadUrl();
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": asset.mimeType ?? "image/jpeg" },
        body: blob,
      });
      const { storageId } = await uploadResponse.json();

      await updateProfile({ avatarStorageId: storageId });
    } catch {
      Alert.alert("Error", "Failed to upload avatar. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {}
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email ?? "User";

  const initial = user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "?";

  const { showAuth } = useAuthDialog();

  // -- Unauthenticated: centered prompt matching Trips/Inbox layout --
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconWrap}>
            <UserCircle size={32} color={theme.colors.primary[500]} />
          </View>
          <Text style={styles.authTitle}>Log in to your account</Text>
          <Text style={styles.authSub}>Book charters, message captains, and more</Text>
          <View style={styles.authActions}>
            <Button onPress={() => showAuth("login")}>Log In</Button>
          </View>
          <View style={styles.signUpRow}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <Pressable onPress={() => showAuth("signup")}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // -- Authenticated --
  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <Pressable
            style={styles.avatarWrap}
            onPress={handleAvatarPick}
            disabled={avatarUploading}
          >
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            {avatarUploading ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <View style={styles.cameraIcon}>
                <Camera size={14} color="#fff" />
              </View>
            )}
          </Pressable>

          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.editRow}>
                <TextInput
                  style={styles.editInput}
                  placeholder="First name"
                  placeholderTextColor={theme.colors.neutral[400]}
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <TextInput
                  style={styles.editInput}
                  placeholder="Last name"
                  placeholderTextColor={theme.colors.neutral[400]}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
              <TextInput
                style={styles.editInput}
                placeholder="Phone"
                placeholderTextColor={theme.colors.neutral[400]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.editInput, styles.editBio]}
                placeholder="Bio"
                placeholderTextColor={theme.colors.neutral[400]}
                value={bio}
                onChangeText={setBio}
                multiline
              />
              <View style={styles.editActions}>
                <Pressable
                  style={styles.editCancel}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.editCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.editSave, saving && { opacity: 0.6 }]}
                  onPress={saveProfile}
                  disabled={saving}
                >
                  <Text style={styles.editSaveText}>
                    {saving ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.profileInfo} onPress={startEditing}>
              <View>
                <Text style={styles.userName}>{displayName}</Text>
                {user.email && (
                  <Text style={styles.userEmail}>{user.email}</Text>
                )}
                {user.phone && (
                  <Text style={styles.userDetail}>{user.phone}</Text>
                )}
              </View>
              <ChevronRight size={20} color={theme.colors.neutral[400]} />
            </Pressable>
          )}
        </View>

        {/* Host section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Host</Text>
          <View style={styles.sectionCard}>
            {(user.role === "host" || user.role === "admin") && (
              <RenderItem
                icon={<LayoutDashboard size={20} color={theme.colors.neutral[600]} />}
                label="Host Dashboard"
                subtitle="Manage listings & bookings"
                onPress={() => router.push("/(host)/dashboard")}
              />
            )}
            <RenderItem
              icon={<Anchor size={20} color={theme.colors.primary[500]} />}
              label="List Your Boat"
              subtitle="Start hosting fishing charters"
              onPress={() => {
                Alert.alert(
                  "List Your Boat",
                  "Interested in hosting? We'll help you get started.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Contact Us",
                      onPress: () =>
                        Linking.openURL(
                          "mailto:host@anglersday.com?subject=I want to list my boat"
                        ),
                    },
                  ]
                );
              }}
              isLast
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Appearance</Text>
          <View style={styles.sectionCard}>
            <View style={styles.themeRow}>
              {(["light", "dark", "auto"] as ThemeMode[]).map((mode) => {
                const active = themeMode === mode;
                const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;
                return (
                  <Pressable
                    key={mode}
                    style={[styles.themeOption, active && styles.themeOptionActive]}
                    onPress={() => setThemeMode(mode)}
                  >
                    <Icon
                      size={18}
                      color={active ? theme.colors.primary[500] : theme.colors.neutral[500]}
                    />
                    <Text
                      style={[
                        styles.themeOptionText,
                        active && styles.themeOptionTextActive,
                      ]}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.sectionCard}>
            <RenderItem
              icon={<MapPin size={20} color={theme.colors.neutral[600]} />}
              label="Preferred Location"
              subtitle="Set your home port"
              onPress={() => {}}
              comingSoon
            />
            <RenderItem
              icon={<Fish size={20} color={theme.colors.neutral[600]} />}
              label="Favorite Species"
              subtitle="Customize your feed"
              onPress={() => {}}
              comingSoon
            />
            <RenderItem
              icon={<Heart size={20} color={theme.colors.neutral[600]} />}
              label="Saved Locations"
              subtitle="Your favorite fishing spots"
              onPress={() => {}}
              isLast
              comingSoon
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <View style={styles.sectionCard}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Bell size={20} color={theme.colors.neutral[600]} />
                <Text style={styles.switchLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{
                  false: theme.colors.neutral[200],
                  true: theme.colors.primary[300],
                }}
                thumbColor={pushEnabled ? theme.colors.primary[500] : theme.colors.neutral[400]}
              />
            </View>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Bell size={20} color={theme.colors.neutral[600]} />
                <Text style={styles.switchLabel}>Email Notifications</Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{
                  false: theme.colors.neutral[200],
                  true: theme.colors.primary[300],
                }}
                thumbColor={emailEnabled ? theme.colors.primary[500] : theme.colors.neutral[400]}
              />
            </View>
            <View style={[styles.switchRow, styles.lastRow]}>
              <View style={styles.switchLeft}>
                <Bell size={20} color={theme.colors.neutral[600]} />
                <Text style={styles.switchLabel}>SMS Notifications</Text>
              </View>
              <Switch
                value={smsEnabled}
                onValueChange={setSmsEnabled}
                trackColor={{
                  false: theme.colors.neutral[200],
                  true: theme.colors.primary[300],
                }}
                thumbColor={smsEnabled ? theme.colors.primary[500] : theme.colors.neutral[400]}
              />
            </View>
          </View>
        </View>

        {/* Account & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account & Security</Text>
          <View style={styles.sectionCard}>
            <RenderItem
              icon={<Lock size={20} color={theme.colors.neutral[600]} />}
              label="Change Password"
              onPress={() => {}}
              comingSoon
            />
            <RenderItem
              icon={<Shield size={20} color={theme.colors.neutral[600]} />}
              label="Permissions"
              subtitle="Camera, location, contacts"
              onPress={() => Linking.openSettings()}
            />
            <RenderItem
              icon={<Share2 size={20} color={theme.colors.neutral[600]} />}
              label="Linked Accounts"
              subtitle="Apple, Google"
              onPress={() => {}}
              comingSoon
            />
            <RenderItem
              icon={<CreditCard size={20} color={theme.colors.neutral[600]} />}
              label="Payment Methods"
              subtitle="Manage via Stripe"
              onPress={() => {}}
              isLast
              comingSoon
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Support</Text>
          <View style={styles.sectionCard}>
            <RenderItem
              icon={<HelpCircle size={20} color={theme.colors.neutral[600]} />}
              label="Send Feedback"
              subtitle="Report issues or suggest improvements"
              onPress={() => setFeedbackVisible(true)}
              isLast
            />
          </View>
        </View>

        {/* Feedback Modal */}
        <Modal
          visible={feedbackVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setFeedbackVisible(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.colors.neutral[50] }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.fbHeader}>
                <Pressable onPress={() => setFeedbackVisible(false)}>
                  <Text style={styles.fbCancel}>Cancel</Text>
                </Pressable>
                <Text style={styles.fbTitle}>Send Feedback</Text>
                <Pressable
                  onPress={handleSendFeedback}
                  disabled={fbSending}
                >
                  <Text style={[styles.fbSend, fbSending && { opacity: 0.5 }]}>
                    {fbSending ? "Sending..." : "Send"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.fbBody}>
                <Text style={styles.fbLabel}>Subject</Text>
                <TextInput
                  style={styles.fbInput}
                  placeholder="Bug report, feature request, etc."
                  placeholderTextColor={theme.colors.neutral[400]}
                  value={fbSubject}
                  onChangeText={setFbSubject}
                />
                <Text style={styles.fbLabel}>Message</Text>
                <TextInput
                  style={[styles.fbInput, styles.fbTextArea]}
                  placeholder="Tell us what's on your mind..."
                  placeholderTextColor={theme.colors.neutral[400]}
                  value={fbMessage}
                  onChangeText={setFbMessage}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={styles.fbHint}>
                  We'll reply to {user?.email ?? "your email"}
                </Text>
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>

        {/* Sign out */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <LogOut size={20} color={theme.colors.error[500]} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function RenderItem({
  icon,
  label,
  subtitle,
  onPress,
  isLast = false,
  comingSoon = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
  comingSoon?: boolean;
}) {
  const { theme: t } = useUnistyles();
  return (
    <Pressable style={[styles.menuItem, isLast && styles.lastRow]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconWrap}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuItemLabel}>{label}</Text>
          {subtitle && <Text style={styles.menuItemSub}>{subtitle}</Text>}
        </View>
      </View>
      {comingSoon ? (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Soon</Text>
        </View>
      ) : (
        <ChevronRight size={18} color={t.colors.neutral[400]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.neutral[900],
  },

  // Profile card
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  avatarWrap: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.neutral[700],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    textAlign: "center",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
  userDetail: {
    fontSize: 13,
    color: theme.colors.neutral[400],
    textAlign: "center",
    marginTop: 1,
  },

  // Edit form
  editForm: {
    gap: 10,
  },
  editRow: {
    flexDirection: "row",
    gap: 10,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: theme.colors.neutral[900],
    backgroundColor: theme.colors.white,
  },
  editBio: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  editCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    alignItems: "center",
  },
  editCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.neutral[600],
  },
  editSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.primary[500],
    alignItems: "center",
  },
  editSaveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Sections
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.neutral[900],
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    overflow: "hidden",
  },

  // Menu items
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemLabel: {
    fontSize: 15,
    color: theme.colors.neutral[800],
    fontWeight: "500",
  },
  menuItemSub: {
    fontSize: 12,
    color: theme.colors.neutral[500],
    marginTop: 1,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.neutral[400],
  },

  // Theme switcher
  themeRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.neutral[100],
    borderRadius: 10,
    padding: 3,
    margin: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  themeOptionActive: {
    backgroundColor: theme.colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.neutral[500],
  },
  themeOptionTextActive: {
    color: theme.colors.primary[500],
  },

  // Switch rows
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  switchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  switchLabel: {
    fontSize: 15,
    color: theme.colors.neutral[800],
    fontWeight: "500",
  },

  // Sign out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  signOutText: {
    fontSize: 16,
    color: theme.colors.error[500],
    fontWeight: "600",
  },

  // Sign in prompt (unauthenticated) — matches AuthGuard layout
  authPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  authIconWrap: {
    marginBottom: theme.spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  authTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.neutral[900],
    textAlign: "center",
  },
  authSub: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  authActions: {
    marginTop: theme.spacing.xl,
  },
  signUpRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
    color: theme.colors.neutral[500],
  },
  signUpLink: {
    fontSize: 14,
    color: theme.colors.primary[500],
    fontWeight: "600",
  },

  // Feedback modal
  fbHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  fbCancel: {
    fontSize: 16,
    color: theme.colors.neutral[600],
  },
  fbTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.neutral[900],
  },
  fbSend: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary[500],
  },
  fbBody: {
    padding: 20,
    gap: 8,
  },
  fbLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.neutral[700],
    marginTop: 8,
  },
  fbInput: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.neutral[900],
  },
  fbTextArea: {
    minHeight: 140,
    textAlignVertical: "top",
  },
  fbHint: {
    fontSize: 12,
    color: theme.colors.neutral[400],
    marginTop: 4,
  },
}));
