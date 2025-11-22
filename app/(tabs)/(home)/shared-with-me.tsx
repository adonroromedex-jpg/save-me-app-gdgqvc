
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, Image } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as SecureStore from 'expo-secure-store';

interface AppUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface SharedContent {
  id: string;
  fileId: string;
  fileUri: string;
  fileType: 'image' | 'video';
  fromUserId: string;
  toUserId: string;
  sharedAt: number;
  expiresAt?: number;
  viewCount: number;
  maxViews?: number;
}

export default function SharedWithMeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load current user
      const userJson = await SecureStore.getItemAsync('current_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user);

        // Load all users
        const usersJson = await SecureStore.getItemAsync('registered_users');
        if (usersJson) {
          setUsers(JSON.parse(usersJson));
        }

        // Load shared content
        const sharedJson = await SecureStore.getItemAsync('shared_content');
        if (sharedJson) {
          const allShared: SharedContent[] = JSON.parse(sharedJson);
          // Filter content shared with current user
          const myShared = allShared.filter(item => item.toUserId === user.id);
          setSharedContent(myShared);
          console.log('Loaded shared content:', myShared.length);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getUserById = (userId: string): AppUser | undefined => {
    return users.find(u => u.id === userId);
  };

  const viewContent = async (content: SharedContent) => {
    // Check if expired
    if (content.expiresAt && Date.now() > content.expiresAt) {
      Alert.alert('Content Expired', 'This content has expired and can no longer be viewed.');
      return;
    }

    // Check if max views reached
    if (content.maxViews && content.viewCount >= content.maxViews) {
      Alert.alert('View Limit Reached', 'You have reached the maximum number of views for this content.');
      return;
    }

    // Increment view count
    try {
      const sharedJson = await SecureStore.getItemAsync('shared_content');
      if (sharedJson) {
        const allShared: SharedContent[] = JSON.parse(sharedJson);
        const updatedShared = allShared.map(item => {
          if (item.id === content.id) {
            return { ...item, viewCount: item.viewCount + 1 };
          }
          return item;
        });
        await SecureStore.setItemAsync('shared_content', JSON.stringify(updatedShared));
        
        // Reload data
        loadData();

        // Show content
        Alert.alert(
          'Viewing Shared Content',
          `From: ${getUserById(content.fromUserId)?.username || 'Unknown'}\nViews: ${content.viewCount + 1}/${content.maxViews || '∞'}\nExpires: ${content.expiresAt ? new Date(content.expiresAt).toLocaleString() : 'Never'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error viewing content:', error);
      Alert.alert('Error', 'Failed to view content');
    }
  };

  const deleteSharedContent = async (contentId: string) => {
    Alert.alert(
      'Delete Shared Content',
      'Are you sure you want to delete this shared content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const sharedJson = await SecureStore.getItemAsync('shared_content');
              if (sharedJson) {
                const allShared: SharedContent[] = JSON.parse(sharedJson);
                const updatedShared = allShared.filter(item => item.id !== contentId);
                await SecureStore.setItemAsync('shared_content', JSON.stringify(updatedShared));
                loadData();
                console.log('Deleted shared content:', contentId);
              }
            } catch (error) {
              console.error('Error deleting shared content:', error);
              Alert.alert('Error', 'Failed to delete content');
            }
          }
        }
      ]
    );
  };

  const getTimeRemaining = (expiresAt?: number) => {
    if (!expiresAt) return 'Never expires';
    
    const now = Date.now();
    const diff = expiresAt - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => router.back()}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="chevron.left" color={colors.primary} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Shared with Me",
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
              <IconSymbol name="tray.fill" color={colors.card} size={32} />
            </View>
            <Text style={commonStyles.title}>Shared with Me</Text>
            <Text style={commonStyles.subtitle}>
              Content shared by other Save Me users
            </Text>
          </View>

          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sharedContent.length}</Text>
              <Text style={styles.statLabel}>Total Shared</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {sharedContent.filter(c => c.viewCount === 0).length}
              </Text>
              <Text style={styles.statLabel}>Unviewed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {sharedContent.filter(c => c.expiresAt && Date.now() > c.expiresAt).length}
              </Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
          </View>

          {sharedContent.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="tray.fill" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyTitle}>No Shared Content</Text>
              <Text style={styles.emptyDescription}>
                When other users share content with you, it will appear here
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Received Content</Text>
              {sharedContent.map((content) => {
                const sender = getUserById(content.fromUserId);
                const isExpired = content.expiresAt && Date.now() > content.expiresAt;
                const maxViewsReached = content.maxViews && content.viewCount >= content.maxViews;
                const canView = !isExpired && !maxViewsReached;

                return (
                  <Pressable
                    key={content.id}
                    style={[
                      styles.contentCard,
                      { backgroundColor: colors.card },
                      !canView && styles.contentCardDisabled
                    ]}
                    onPress={() => canView && viewContent(content)}
                    onLongPress={() => deleteSharedContent(content.id)}
                  >
                    <Image
                      source={{ uri: content.fileUri }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.contentInfo}>
                      <View style={styles.senderInfo}>
                        <View style={[styles.senderAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.senderAvatarText}>
                            {sender?.username.charAt(0).toUpperCase() || '?'}
                          </Text>
                        </View>
                        <View style={styles.senderDetails}>
                          <Text style={styles.senderName}>
                            {sender?.username || 'Unknown User'}
                          </Text>
                          <Text style={styles.sharedDate}>
                            {new Date(content.sharedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.contentMeta}>
                        <View style={styles.metaRow}>
                          <IconSymbol 
                            name={content.fileType === 'video' ? 'video.fill' : 'photo.fill'} 
                            color={colors.textSecondary} 
                            size={16} 
                          />
                          <Text style={styles.metaText}>
                            {content.fileType === 'video' ? 'Video' : 'Photo'}
                          </Text>
                        </View>

                        <View style={styles.metaRow}>
                          <IconSymbol name="eye.fill" color={colors.textSecondary} size={16} />
                          <Text style={styles.metaText}>
                            {content.viewCount}/{content.maxViews || '∞'} views
                          </Text>
                        </View>

                        <View style={styles.metaRow}>
                          <IconSymbol name="clock.fill" color={colors.textSecondary} size={16} />
                          <Text style={[
                            styles.metaText,
                            isExpired && { color: colors.danger }
                          ]}>
                            {getTimeRemaining(content.expiresAt)}
                          </Text>
                        </View>
                      </View>

                      {!canView && (
                        <View style={[styles.statusBadge, { 
                          backgroundColor: isExpired ? colors.danger : colors.textSecondary 
                        }]}>
                          <Text style={styles.statusText}>
                            {isExpired ? 'Expired' : 'Max Views Reached'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <IconSymbol 
                      name={canView ? "chevron.right" : "lock.fill"} 
                      color={colors.textSecondary} 
                      size={20} 
                    />
                  </Pressable>
                );
              })}
            </>
          )}

          <View style={[styles.infoCard, { backgroundColor: colors.accent }]}>
            <IconSymbol name="info.circle.fill" color={colors.card} size={24} />
            <Text style={styles.infoText}>
              Long press on any item to delete it. Content automatically expires after 24 hours or when view limit is reached.
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerButtonContainer: {
    padding: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  contentCardDisabled: {
    opacity: 0.6,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  contentInfo: {
    flex: 1,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  senderAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sharedDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  contentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.card,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.card,
    marginLeft: 12,
    lineHeight: 20,
  },
});
