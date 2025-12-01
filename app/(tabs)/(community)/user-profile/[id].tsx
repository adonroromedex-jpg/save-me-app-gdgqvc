
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import i18n from '@/i18n';

interface AppUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  registeredAt: number;
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: colors.card,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  bio: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  actionButtonDanger: {
    backgroundColor: colors.danger,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionIconDanger: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  actionTitleDanger: {
    color: colors.card,
  },
  actionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionDescriptionDanger: {
    color: colors.card,
    opacity: 0.9,
  },
  memberSince: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<AppUser | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  const loadUserData = useCallback(async () => {
    try {
      // Load current user
      const currentUserJson = await SecureStore.getItemAsync('current_user');
      if (currentUserJson) {
        const currentUser = JSON.parse(currentUserJson);
        setCurrentUserId(currentUser.id);

        // Load user profile
        if (id === currentUser.id) {
          setUser(currentUser);
        } else {
          const usersJson = await SecureStore.getItemAsync('registered_users');
          if (usersJson) {
            const users = JSON.parse(usersJson);
            const foundUser = users.find((u: AppUser) => u.id === id);
            setUser(foundUser || null);
          }
        }

        // Check if user is blocked
        const blockedJson = await SecureStore.getItemAsync('blocked_users');
        if (blockedJson) {
          const blockedUsers = JSON.parse(blockedJson);
          setIsBlocked(blockedUsers.includes(id));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('community.errorLoadingProfile'));
    }
  }, [id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleBlockUser = async () => {
    if (!user) return;

    Alert.alert(
      isBlocked ? i18n.t('community.unblockUser') : i18n.t('community.blockUser'),
      isBlocked
        ? i18n.t('community.unblockUserConfirm', { username: user.username })
        : i18n.t('community.blockUserConfirm', { username: user.username }),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: isBlocked ? i18n.t('community.unblock') : i18n.t('community.block'),
          style: 'destructive',
          onPress: async () => {
            try {
              const blockedJson = await SecureStore.getItemAsync('blocked_users');
              let blockedUsers = blockedJson ? JSON.parse(blockedJson) : [];

              if (isBlocked) {
                blockedUsers = blockedUsers.filter((uid: string) => uid !== id);
              } else {
                blockedUsers.push(id);
              }

              await SecureStore.setItemAsync('blocked_users', JSON.stringify(blockedUsers));
              setIsBlocked(!isBlocked);
              Alert.alert(
                i18n.t('common.success'),
                isBlocked ? i18n.t('community.userUnblocked') : i18n.t('community.userBlocked')
              );
            } catch (error) {
              console.error('Error blocking/unblocking user:', error);
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = () => {
    Alert.alert(i18n.t('common.info'), i18n.t('community.directMessagingComingSoon'));
  };

  const formatMemberSince = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.card} />
          </Pressable>
          <Text style={styles.headerTitle}>{i18n.t('community.userProfile')}</Text>
        </View>
        <View style={commonStyles.centerContent}>
          <Text style={commonStyles.subtitle}>{i18n.t('community.userNotFound')}</Text>
        </View>
      </View>
    );
  }

  const isOwnProfile = user.id === currentUserId;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.card} />
        </Pressable>
        <Text style={styles.headerTitle}>{i18n.t('community.userProfile')}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
          {user.registeredAt && (
            <Text style={styles.memberSince}>
              {i18n.t('community.memberSince')} {formatMemberSince(user.registeredAt)}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{i18n.t('community.messages')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{i18n.t('community.channels')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{i18n.t('community.reactions')}</Text>
          </View>
        </View>

        {/* Actions */}
        {!isOwnProfile && (
          <View style={styles.actionsContainer}>
            <Pressable style={styles.actionButton} onPress={handleSendMessage}>
              <View style={styles.actionIcon}>
                <IconSymbol name="paperplane.fill" size={20} color={colors.primary} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{i18n.t('community.sendMessage')}</Text>
                <Text style={styles.actionDescription}>
                  {i18n.t('community.sendMessageDescription')}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.actionButton, isBlocked && styles.actionButtonDanger]}
              onPress={handleBlockUser}
            >
              <View style={[styles.actionIcon, isBlocked && styles.actionIconDanger]}>
                <IconSymbol
                  name={isBlocked ? 'checkmark.circle.fill' : 'hand.raised.fill'}
                  size={20}
                  color={isBlocked ? colors.card : colors.danger}
                />
              </View>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, isBlocked && styles.actionTitleDanger]}>
                  {isBlocked ? i18n.t('community.unblockUser') : i18n.t('community.blockUser')}
                </Text>
                <Text
                  style={[styles.actionDescription, isBlocked && styles.actionDescriptionDanger]}
                >
                  {isBlocked
                    ? i18n.t('community.unblockUserDescription')
                    : i18n.t('community.blockUserDescription')}
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
