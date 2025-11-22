
import React, { useState, useEffect } from "react";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, TextInput, Image } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as SecureStore from 'expo-secure-store';
import { generateShareCode, logAccess, scheduleAutoDelete } from "@/utils/securityUtils";

interface AppUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  lastSeen?: number;
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
  shareCode: string;
  otpUsed: boolean;
  isReceivedContent: boolean; // Flag to prevent re-sharing
  originalOwnerId?: string; // Track the original owner
}

interface SecureFile {
  id: string;
  uri: string;
  type: 'image' | 'video';
  timestamp: number;
  encrypted: boolean;
  isReceivedContent?: boolean; // Flag to mark files received from others
}

export default function ShareWithUsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isReceivedContent, setIsReceivedContent] = useState(false);

  const fileId = params.fileId as string;
  const fileUri = params.fileUri as string;
  const fileType = params.fileType as 'image' | 'video';

  useEffect(() => {
    loadCurrentUser();
    loadRegisteredUsers();
    checkIfReceivedContent();
  }, []);

  const checkIfReceivedContent = async () => {
    try {
      // Check if this file is from received content
      const filesJson = await SecureStore.getItemAsync('secure_files');
      if (filesJson) {
        const files: SecureFile[] = JSON.parse(filesJson);
        const file = files.find(f => f.id === fileId);
        if (file && file.isReceivedContent) {
          setIsReceivedContent(true);
          // Show blocking alert immediately
          Alert.alert(
            '🚫 Sharing Blocked',
            'This content was shared with you by another user and cannot be forwarded.\n\n🔒 Security Restrictions:\n• No sharing with other users\n• No export to other apps\n• No saving to device gallery\n• No copying or forwarding\n\nThis is a core security feature of Save Me to protect the privacy of the original sender.',
            [
              {
                text: 'I Understand',
                onPress: () => router.back(),
              }
            ],
            { cancelable: false }
          );

          // Log the blocked attempt
          await logAccess('file_share', 'Blocked attempt to share received content', {
            fileId,
            userId: currentUser?.id,
          });
        }
      }
    } catch (error) {
      console.error('Error checking if received content:', error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const userJson = await SecureStore.getItemAsync('current_user');
      if (userJson) {
        setCurrentUser(JSON.parse(userJson));
      } else {
        const defaultUser: AppUser = {
          id: Date.now().toString(),
          username: 'User' + Math.floor(Math.random() * 10000),
          email: 'user@saveme.app',
          lastSeen: Date.now(),
        };
        await SecureStore.setItemAsync('current_user', JSON.stringify(defaultUser));
        setCurrentUser(defaultUser);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadRegisteredUsers = async () => {
    try {
      const usersJson = await SecureStore.getItemAsync('registered_users');
      if (usersJson) {
        const users = JSON.parse(usersJson);
        setRegisteredUsers(users);
        console.log('Loaded registered users:', users.length);
      } else {
        const demoUsers: AppUser[] = [
          {
            id: '1',
            username: 'alice_secure',
            email: 'alice@saveme.app',
            lastSeen: Date.now() - 3600000,
          },
          {
            id: '2',
            username: 'bob_private',
            email: 'bob@saveme.app',
            lastSeen: Date.now() - 7200000,
          },
          {
            id: '3',
            username: 'charlie_safe',
            email: 'charlie@saveme.app',
            lastSeen: Date.now() - 86400000,
          },
        ];
        await SecureStore.setItemAsync('registered_users', JSON.stringify(demoUsers));
        setRegisteredUsers(demoUsers);
      }
    } catch (error) {
      console.error('Error loading registered users:', error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (isReceivedContent) {
      Alert.alert(
        '🚫 Action Blocked',
        'This content cannot be shared as it was received from another user.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const shareWithSelectedUsers = async () => {
    // Double-check if this is received content
    if (isReceivedContent) {
      Alert.alert(
        '🚫 Sharing Blocked',
        'This content was shared with you and cannot be forwarded to others.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('No Users Selected', 'Please select at least one user to share with.');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const sharedJson = await SecureStore.getItemAsync('shared_content');
      const sharedContent: SharedContent[] = sharedJson ? JSON.parse(sharedJson) : [];

      const shareCodes: string[] = [];

      const newShares: SharedContent[] = selectedUsers.map(userId => {
        const shareCode = generateShareCode();
        shareCodes.push(shareCode);
        
        return {
          id: `${Date.now()}_${userId}`,
          fileId,
          fileUri,
          fileType,
          fromUserId: currentUser.id,
          toUserId: userId,
          sharedAt: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000),
          viewCount: 0,
          maxViews: 1,
          shareCode,
          otpUsed: false,
          isReceivedContent: true, // Mark as received content for recipients
          originalOwnerId: currentUser.id,
        };
      });

      const updatedSharedContent = [...sharedContent, ...newShares];
      await SecureStore.setItemAsync('shared_content', JSON.stringify(updatedSharedContent));

      await scheduleAutoDelete(fileId, 24);

      await logAccess('file_share', `Shared ${fileType} with ${selectedUsers.length} user(s)`, {
        fileId,
        userId: currentUser.id,
      });

      const usernames = selectedUsers
        .map(id => registeredUsers.find(u => u.id === id)?.username)
        .filter(Boolean)
        .join(', ');

      const codesText = shareCodes.map((code, idx) => 
        `${registeredUsers.find(u => u.id === selectedUsers[idx])?.username}: ${code}`
      ).join('\n');

      Alert.alert(
        '✓ Content Shared Successfully',
        `Your ${fileType} has been securely shared with:\n${usernames}\n\n🔐 One-Time Access Codes:\n${codesText}\n\n⚠️ Important:\n- Each code can only be used once\n- Content expires in 24 hours\n- Recipients CANNOT share this with others\n- Recipients CANNOT export to other apps\n- You&apos;ll be alerted when viewed\n\n🛡️ Recipients are protected by Save Me security protocols.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          }
        ]
      );

      console.log('Shared content with users:', selectedUsers);
    } catch (error) {
      console.error('Error sharing content:', error);
      Alert.alert('Error', 'Failed to share content');
    }
  };

  const filteredUsers = registeredUsers.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const getLastSeenText = (lastSeen?: number) => {
    if (!lastSeen) return 'Never';
    
    const now = Date.now();
    const diff = now - lastSeen;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => router.back()}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="xmark" color={colors.primary} />
    </Pressable>
  );

  const renderHeaderRight = () => (
    <Pressable
      onPress={shareWithSelectedUsers}
      style={styles.headerButtonContainer}
      disabled={selectedUsers.length === 0 || isReceivedContent}
    >
      <Text style={[
        styles.shareButtonText,
        { color: (selectedUsers.length > 0 && !isReceivedContent) ? colors.primary : colors.textSecondary }
      ]}>
        Share
      </Text>
    </Pressable>
  );

  // If this is received content, show blocking screen
  if (isReceivedContent) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: "Sharing Blocked",
              headerLeft: renderHeaderLeft,
            }}
          />
        )}
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.blockedContainer}>
            <View style={[styles.blockedIconContainer, { backgroundColor: colors.danger }]}>
              <IconSymbol name="lock.shield.fill" color={colors.card} size={64} />
            </View>
            <Text style={styles.blockedTitle}>🚫 Sharing Not Allowed</Text>
            <Text style={styles.blockedDescription}>
              This content was shared with you by another user and is protected by Save Me security protocols.
            </Text>
            <View style={[styles.restrictionsCard, { backgroundColor: colors.card }]}>
              <Text style={styles.restrictionsTitle}>🔒 Active Restrictions:</Text>
              <View style={styles.restrictionsList}>
                <View style={styles.restrictionItem}>
                  <IconSymbol name="xmark.circle.fill" color={colors.danger} size={20} />
                  <Text style={styles.restrictionText}>Cannot share with other users</Text>
                </View>
                <View style={styles.restrictionItem}>
                  <IconSymbol name="xmark.circle.fill" color={colors.danger} size={20} />
                  <Text style={styles.restrictionText}>Cannot export to other apps</Text>
                </View>
                <View style={styles.restrictionItem}>
                  <IconSymbol name="xmark.circle.fill" color={colors.danger} size={20} />
                  <Text style={styles.restrictionText}>Cannot save to device gallery</Text>
                </View>
                <View style={styles.restrictionItem}>
                  <IconSymbol name="xmark.circle.fill" color={colors.danger} size={20} />
                  <Text style={styles.restrictionText}>Cannot copy or forward</Text>
                </View>
              </View>
            </View>
            <Pressable
              style={[styles.backButton, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Share with Users",
            headerLeft: renderHeaderLeft,
            headerRight: renderHeaderRight,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={[styles.infoCard, { backgroundColor: colors.accent }]}>
            <IconSymbol name="lock.shield.fill" color={colors.card} size={24} />
            <Text style={styles.infoText}>
              🔐 Ultra-Secure Sharing: One-time access codes • Screenshot protection • Auto-delete • No re-sharing
            </Text>
          </View>

          {fileUri && (
            <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
              <Image
                source={{ uri: fileUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.previewOverlay}>
                <IconSymbol 
                  name={fileType === 'video' ? 'video.fill' : 'photo.fill'} 
                  color={colors.card} 
                  size={24} 
                />
              </View>
            </View>
          )}

          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <IconSymbol name="magnifyingglass" color={colors.textSecondary} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" color={colors.textSecondary} size={20} />
              </Pressable>
            )}
          </View>

          {selectedUsers.length > 0 && (
            <View style={[styles.selectionBanner, { backgroundColor: colors.primary }]}>
              <Text style={styles.selectionText}>
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </Text>
              <Pressable onPress={() => setSelectedUsers([])}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>
            Registered Users ({filteredUsers.length})
          </Text>

          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="person.2.slash.fill" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery ? 'Try a different search term' : 'No registered users available'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUsers.includes(user.id);
              return (
                <Pressable
                  key={user.id}
                  style={[
                    styles.userCard,
                    { backgroundColor: colors.card },
                    isSelected && { borderColor: colors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => toggleUserSelection(user.id)}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>
                      {user.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.username}>{user.username}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.lastSeen}>
                      Last seen: {getLastSeenText(user.lastSeen)}
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    { borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { backgroundColor: colors.primary }
                  ]}>
                    {isSelected && (
                      <IconSymbol name="checkmark" color={colors.card} size={16} />
                    )}
                  </View>
                </Pressable>
              );
            })
          )}

          <View style={[styles.securityInfo, { backgroundColor: colors.card }]}>
            <IconSymbol name="info.circle.fill" color={colors.primary} size={24} />
            <View style={styles.securityInfoContent}>
              <Text style={styles.securityInfoTitle}>🔐 Ultra-Secure Sharing</Text>
              <Text style={styles.securityInfoText}>
                - One-time access code (OTP) per recipient{'\n'}
                - Content auto-deletes after 24 hours{'\n'}
                - Single view only (cannot be viewed twice){'\n'}
                - Screenshot & screen recording blocked{'\n'}
                - Recipients CANNOT share with others{'\n'}
                - Recipients CANNOT export to other apps{'\n'}
                - You&apos;re notified when content is viewed{'\n'}
                - Complete access logging
              </Text>
            </View>
          </View>
        </ScrollView>

        {Platform.OS !== 'ios' && selectedUsers.length > 0 && (
          <View style={[styles.bottomBar, { backgroundColor: colors.card }]}>
            <Pressable
              style={[styles.shareButton, { backgroundColor: colors.primary }]}
              onPress={shareWithSelectedUsers}
            >
              <IconSymbol name="paperplane.fill" color={colors.card} size={20} />
              <Text style={styles.shareButtonTextBottom}>
                Share with {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerButtonContainer: {
    padding: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.card,
    marginLeft: 12,
    lineHeight: 18,
  },
  previewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    height: 200,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  selectionBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.card,
    opacity: 0.8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.card,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  securityInfo: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  securityInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  securityInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  shareButtonTextBottom: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginLeft: 8,
  },
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  blockedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  blockedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  blockedDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  restrictionsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  restrictionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  restrictionsList: {
    gap: 12,
  },
  restrictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restrictionText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
});
