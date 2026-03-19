import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { Send } from "lucide-react-native";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
}

function shouldShowTimestamp(
  currentMsg: { createdAt: number },
  prevMsg: { createdAt: number } | undefined
): boolean {
  if (!prevMsg) return true;
  return currentMsg.createdAt - prevMsg.createdAt > 60 * 60 * 1000; // 1 hour gap
}

export default function ConversationScreen() {
  const { theme } = useUnistyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id as Id<"conversations">;
  const { user } = useCurrentUser();
  const flatListRef = useRef<FlatList>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const conversation = useQuery(api.conversations.getById, {
    id: conversationId,
  });
  const messages = useQuery(api.messages.getByConversation, {
    conversationId,
  });
  const sendMessage = useMutation(api.messages.send);
  const markRead = useMutation(api.messages.markRead);

  // Mark messages as read when viewing
  useEffect(() => {
    if (conversation && messages && messages.length > 0) {
      const hasUnread = messages.some(
        (m) => !m.isRead && m.senderId !== user?._id
      );
      if (hasUnread) {
        markRead({ conversationId });
      }
    }
  }, [messages, conversation]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText("");
    try {
      await sendMessage({
        conversationId,
        body: trimmed,
        type: "text",
      });
    } catch {
      setText(trimmed); // Restore on failure
    } finally {
      setSending(false);
    }
  };

  if (!conversation || messages === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  const otherName = conversation.otherUser
    ? `${conversation.otherUser.firstName ?? ""} ${conversation.otherUser.lastName ?? ""}`.trim()
    : "User";

  const listingContext = conversation.listing?.title;

  return (
    <>
      <Stack.Screen
        options={{
          title: otherName,
          headerStyle: {
            backgroundColor: theme.colors.white,
          },
          headerTintColor: theme.colors.neutral[900],
          headerShadowVisible: false,
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherName}
              </Text>
              {listingContext && (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {listingContext}
                </Text>
              )}
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => {
            const isMe = item.senderId === user?._id;
            const isSystem = item.type === "system";
            const prev = index > 0 ? messages[index - 1] : undefined;
            const showTime = shouldShowTimestamp(item, prev);
            const sameAuthorAsPrev =
              prev && prev.senderId === item.senderId && !showTime;

            if (isSystem) {
              return (
                <View style={styles.systemMessageContainer}>
                  {showTime && (
                    <Text style={styles.timestamp}>
                      {formatMessageTime(item.createdAt)}
                    </Text>
                  )}
                  <Text style={styles.systemMessage}>{item.body}</Text>
                </View>
              );
            }

            return (
              <View>
                {showTime && (
                  <Text style={styles.timestamp}>
                    {formatMessageTime(item.createdAt)}
                  </Text>
                )}
                <View
                  style={[
                    styles.bubbleRow,
                    isMe ? styles.bubbleRowRight : styles.bubbleRowLeft,
                    sameAuthorAsPrev && styles.bubbleRowCompact,
                  ]}
                >
                  {!isMe && !sameAuthorAsPrev && (
                    <View style={styles.senderAvatar}>
                      <Text style={styles.senderAvatarText}>
                        {item.sender?.firstName?.[0] ?? "?"}
                      </Text>
                    </View>
                  )}
                  {!isMe && sameAuthorAsPrev && (
                    <View style={styles.avatarSpacer} />
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMine : styles.bubbleTheirs,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isMe
                          ? styles.bubbleTextMine
                          : styles.bubbleTextTheirs,
                      ]}
                    >
                      {item.body}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={theme.colors.neutral[400]}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[
              styles.sendButton,
              text.trim() ? styles.sendButtonActive : styles.sendButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Send
              size={20}
              color={text.trim() ? "#fff" : theme.colors.neutral[400]}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.white,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.neutral[900],
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.neutral[500],
    marginTop: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  timestamp: {
    textAlign: "center",
    fontSize: 11,
    color: theme.colors.neutral[400],
    marginVertical: 12,
    fontWeight: "500",
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-end",
  },
  bubbleRowRight: {
    justifyContent: "flex-end",
  },
  bubbleRowLeft: {
    justifyContent: "flex-start",
  },
  bubbleRowCompact: {
    marginBottom: 2,
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.secondary[500],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  senderAvatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  avatarSpacer: {
    width: 28,
    marginRight: 8,
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary[500],
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.neutral[100],
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMine: {
    color: "#fff",
  },
  bubbleTextTheirs: {
    color: theme.colors.neutral[900],
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  systemMessage: {
    fontSize: 13,
    color: theme.colors.neutral[500],
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
    backgroundColor: theme.colors.white,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    color: theme.colors.neutral[900],
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: theme.colors.primary[500],
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.neutral[100],
  },
}));
