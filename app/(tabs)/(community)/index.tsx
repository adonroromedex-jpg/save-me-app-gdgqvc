
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Pressable,
  StyleSheet,
  View,
  Text,
  Alert,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import i18n from '@/i18n';

interface Channel {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
  memberCount: number;
  lastMessage?: {
    text: string;
    timestamp: number;
    userId: string;
  };
  isPrivate: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.card,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.card,
    opacity: 0.9,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.card,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  channelCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  channelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 12,
  },
  privateBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  privateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.card,
  },
  channelDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  lastMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  createButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 6,
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
});

export default function CommunityScreen() {
  const router = useRouter();
  const { colors: themeColors } = useTheme();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load current user
      const userJson = await SecureStore.getItemAsync('current_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUserId(user.id);
      }

      // Load channels
      const channelsJson = await SecureStore.getItemAsync('chat_channels');
      if (channelsJson) {
        const loadedChannels = JSON.parse(channelsJson);
        setChannels(loadedChannels);
      } else {
        // Create default channels
        const defaultChannels: Channel[] = [
          {
            id: 'general',
            name: 'General',
            description: i18n.t('community.generalDescription'),
            createdBy: 'system',
            createdAt: Date.now(),
            memberCount: 1,
            isPrivate: false,
          },
          {
            id: 'help',
            name: 'Help & Support',
            description: i18n.t('community.helpDescription'),
            createdBy: 'system',
            createdAt: Date.now(),
            memberCount: 1,
            isPrivate: false,
          },
        ];
        await SecureStore.setItemAsync('chat_channels', JSON.stringify(defaultChannels));
        setChannels(defaultChannels);
      }
    } catch (error) {
      console.error('Error loading community data:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('community.errorLoading'));
    }
  };

  const filteredChannels = channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChannelPress = (channel: Channel) => {
    router.push(`/(tabs)/(community)/channel/${channel.id}`);
  };

  const handleCreateChannel = () => {
    router.push('/(tabs)/(community)/create-channel');
  };

  const formatLastMessageTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return i18n.t('community.justNow');
    if (minutes < 60) return `${minutes}${i18n.t('community.minutesAgo')}`;
    if (hours < 24) return `${hours}${i18n.t('community.hoursAgo')}`;
    return `${days}${i18n.t('community.daysAgo')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('community.title')}</Text>
        <Text style={styles.headerSubtitle}>{i18n.t('community.subtitle')}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={i18n.t('community.searchChannels')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Channels List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredChannels.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{i18n.t('community.channels')}</Text>
            {filteredChannels.map((channel) => (
              <Pressable
                key={channel.id}
                style={styles.channelCard}
                onPress={() => handleChannelPress(channel)}
              >
                <View style={styles.channelHeader}>
                  <View style={styles.channelIcon}>
                    <IconSymbol
                      name={channel.isPrivate ? 'lock.fill' : 'number'}
                      size={24}
                      color={colors.card}
                    />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelName}>{channel.name}</Text>
                    <View style={styles.channelMeta}>
                      <Text style={styles.memberCount}>
                        {channel.memberCount} {i18n.t('community.members')}
                      </Text>
                      {channel.isPrivate && (
                        <View style={styles.privateBadge}>
                          <Text style={styles.privateBadgeText}>
                            {i18n.t('community.private')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <Text style={styles.channelDescription}>{channel.description}</Text>
                {channel.lastMessage && (
                  <Text style={styles.lastMessage}>
                    {channel.lastMessage.text} • {formatLastMessageTime(channel.lastMessage.timestamp)}
                  </Text>
                )}
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <IconSymbol name="bubble.left.and.bubble.right" size={40} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyStateTitle}>{i18n.t('community.noChannels')}</Text>
            <Text style={styles.emptyStateDescription}>
              {i18n.t('community.noChannelsDescription')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Channel Button */}
      <Pressable style={styles.createButton} onPress={handleCreateChannel}>
        <IconSymbol name="plus" size={28} color={colors.card} />
      </Pressable>
    </View>
  );
}
