import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { MessageCircle } from "lucide-react-native";
import { router } from "expo-router";
import { api } from "@/convex/_generated/api";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function InboxContent() {
  const conversations = useQuery(api.conversations.getByUser);
  const { theme } = useUnistyles();

  if (conversations === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={64} color={theme.colors.neutral[300]} />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Guest inquiries and booking messages will appear here
      </Text>
    </View>
  );

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      activeOpacity={0.7}
      onPress={() => {
        router.push(`/conversation/${item._id}`);
      }}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.otherUser?.firstName?.[0] ?? "?"}
        </Text>
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.otherUser?.firstName ?? "User"}{" "}
            {item.otherUser?.lastName ?? ""}
          </Text>
          <Text style={styles.conversationTime}>
            {item.lastMessageAt
              ? formatRelativeTime(item.lastMessageAt)
              : ""}
          </Text>
        </View>
        {item.listingTitle && (
          <Text style={styles.listingLabel} numberOfLines={1}>
            {item.listingTitle}
          </Text>
        )}
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.lastMessagePreview ?? "No messages yet"}
        </Text>
      </View>

      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>
            {item.unreadCount > 99 ? "99+" : item.unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item._id}
      renderItem={renderConversation}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default function HostInboxScreen() {
  return (
    <RoleGuard roles={["host", "admin"]}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Text style={styles.subtitle}>Messages from guests</Text>
        </View>
        <InboxContent />
      </SafeAreaView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
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
  subtitle: {
    fontSize: 15,
    color: theme.colors.neutral[500],
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 120,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.secondary[500],
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.neutral[900],
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: theme.colors.neutral[400],
  },
  listingLabel: {
    fontSize: 12,
    color: theme.colors.primary[500],
    fontWeight: "600",
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    lineHeight: 20,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.neutral[700],
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
}));
