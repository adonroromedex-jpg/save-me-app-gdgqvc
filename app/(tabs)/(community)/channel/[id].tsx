
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import i18n from '@/i18n';

interface Message {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: number;
  edited?: boolean;
  reported?: boolean;
}

interface AppUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  memberCount: number;
  isPrivate: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
  },
  channelMeta: {
    fontSize: 13,
    color: colors.card,
    opacity: 0.8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageBubble: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginLeft: 40,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
    elevation: 1,
  },
  myMessageBubble: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    marginLeft: 0,
    marginRight: 0,
  },
  messageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.card,
  },
  messageActions: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  reportedBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  reportedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.card,
  },
});

export default function ChannelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [messageText, setMessageText] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      // Load channel
      const channelsJson = await SecureStore.getItemAsync('chat_channels');
      if (channelsJson) {
        const channels = JSON.parse(channelsJson);
        const foundChannel = channels.find((c: Channel) => c.id === id);
        setChannel(foundChannel || null);
      }

      // Load current user
      const userJson = await SecureStore.getItemAsync('current_user');
      if (userJson) {
        setCurrentUser(JSON.parse(userJson));
      }

      // Load all users
      const usersJson = await SecureStore.getItemAsync('registered_users');
      if (usersJson) {
        setUsers(JSON.parse(usersJson));
      }

      // Load messages for this channel
      const messagesJson = await SecureStore.getItemAsync(`messages_${id}`);
      if (messagesJson) {
        setMessages(JSON.parse(messagesJson));
      }

      // Load blocked users
      const blockedJson = await SecureStore.getItemAsync('blocked_users');
      if (blockedJson) {
        setBlockedUsers(JSON.parse(blockedJson));
      }

      // Scroll to bottom after loading
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error loading channel data:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('community.errorLoadingChannel'));
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getUserById = (userId: string): AppUser | undefined => {
    if (currentUser && currentUser.id === userId) return currentUser;
    return users.find((u) => u.id === userId);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !currentUser || !channel) return;

    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        channelId: channel.id,
        userId: currentUser.id,
        text: messageText.trim(),
        timestamp: Date.now(),
      };

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      await SecureStore.setItemAsync(`messages_${id}`, JSON.stringify(updatedMessages));

      // Update channel's last message
      const channelsJson = await SecureStore.getItemAsync('chat_channels');
      if (channelsJson) {
        const channels = JSON.parse(channelsJson);
        const channelIndex = channels.findIndex((c: Channel) => c.id === id);
        if (channelIndex !== -1) {
          channels[channelIndex].lastMessage = {
            text: messageText.trim(),
            timestamp: Date.now(),
            userId: currentUser.id,
          };
          await SecureStore.setItemAsync('chat_channels', JSON.stringify(channels));
        }
      }

      setMessageText('');
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('community.errorSendingMessage'));
    }
  };

  const reportMessage = async (message: Message) => {
    Alert.alert(
      i18n.t('community.reportMessage'),
      i18n.t('community.reportMessageConfirm'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('community.report'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedMessages = messages.map((m) =>
                m.id === message.id ? { ...m, reported: true } : m
              );
              setMessages(updatedMessages);
              await SecureStore.setItemAsync(`messages_${id}`, JSON.stringify(updatedMessages));
              Alert.alert(i18n.t('common.success'), i18n.t('community.messageReported'));
            } catch (error) {
              console.error('Error reporting message:', error);
            }
          },
        },
      ]
    );
  };

  const blockUser = async (userId: string) => {
    const user = getUserById(userId);
    if (!user) return;

    Alert.alert(
      i18n.t('community.blockUser'),
      i18n.t('community.blockUserConfirm', { username: user.username }),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('community.block'),
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedBlockedUsers = [...blockedUsers, userId];
              setBlockedUsers(updatedBlockedUsers);
              await SecureStore.setItemAsync('blocked_users', JSON.stringify(updatedBlockedUsers));
              Alert.alert(i18n.t('common.success'), i18n.t('community.userBlocked'));
            } catch (error) {
              console.error('Error blocking user:', error);
            }
          },
        },
      ]
    );
  };

  const viewUserProfile = (userId: string) => {
    router.push(`/(tabs)/(community)/user-profile/${userId}`);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const filteredMessages = messages.filter((m) => !blockedUsers.includes(m.userId));

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.card} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.channelName}>
            {channel?.isPrivate ? '🔒 ' : '#'}{channel?.name}
          </Text>
          <Text style={styles.channelMeta}>
            {channel?.memberCount} {i18n.t('community.members')}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => {
            const user = getUserById(message.userId);
            const isMyMessage = currentUser?.id === message.userId;

            return (
              <View key={message.id} style={styles.messageWrapper}>
                {!isMyMessage && (
                  <Pressable
                    style={styles.messageHeader}
                    onPress={() => viewUserProfile(message.userId)}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {user?.username.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <Text style={styles.username}>{user?.username || 'Unknown'}</Text>
                    <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
                    {message.reported && (
                      <View style={styles.reportedBadge}>
                        <Text style={styles.reportedBadgeText}>
                          {i18n.t('community.reported')}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                )}
                <Pressable
                  style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}
                  onLongPress={() => {
                    if (!isMyMessage) {
                      Alert.alert(
                        i18n.t('community.messageOptions'),
                        '',
                        [
                          {
                            text: i18n.t('community.reportMessage'),
                            onPress: () => reportMessage(message),
                          },
                          {
                            text: i18n.t('community.blockUser'),
                            style: 'destructive',
                            onPress: () => blockUser(message.userId),
                          },
                          { text: i18n.t('common.cancel'), style: 'cancel' },
                        ]
                      );
                    }
                  }}
                >
                  <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
                    {message.text}
                  </Text>
                </Pressable>
                {isMyMessage && (
                  <Text style={[styles.timestamp, { textAlign: 'right', marginTop: 4 }]}>
                    {formatTime(message.timestamp)}
                  </Text>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <IconSymbol name="bubble.left" size={40} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyStateTitle}>{i18n.t('community.noMessages')}</Text>
            <Text style={styles.emptyStateDescription}>
              {i18n.t('community.noMessagesDescription')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={i18n.t('community.typeMessage')}
          placeholderTextColor={colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={1000}
        />
        <Pressable
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!messageText.trim()}
        >
          <IconSymbol name="arrow.up" size={24} color={colors.card} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
