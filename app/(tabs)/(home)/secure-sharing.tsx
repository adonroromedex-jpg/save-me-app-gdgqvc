
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, TextInput, Modal } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles } from "@/styles/commonStyles";
import { createShare, getUserShares, revokeShare, cleanupExpiredShares } from "@/services/sharingService";
import { SecureShare, ShareCreateRequest } from "@/types/sharing";
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';

interface SecureFile {
  id: string;
  uri: string;
  type: 'image' | 'video';
  timestamp: number;
  encrypted: boolean;
}

export default function SecureSharingScreen() {
  const router = useRouter();
  const [shares, setShares] = useState<SecureShare[]>([]);
  const [files, setFiles] = useState<SecureFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SecureFile | null>(null);
  const [duration, setDuration] = useState<'1h' | '24h' | '7d'>('24h');
  const [requireOTP, setRequireOTP] = useState(true);
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load files
      const storedFiles = await SecureStore.getItemAsync('secure_files');
      if (storedFiles) {
        setFiles(JSON.parse(storedFiles));
      }

      // Load shares
      const userId = 'current_user'; // In production, get from auth context
      const userShares = await getUserShares(userId);
      setShares(userShares);

      // Cleanup expired shares
      await cleanupExpiredShares();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateShare = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to share');
      return;
    }

    try {
      setLoading(true);

      const request: ShareCreateRequest = {
        fileId: selectedFile.id,
        fileName: `File_${selectedFile.id}`,
        fileUri: selectedFile.uri,
        fileType: selectedFile.type,
        duration,
        requireOTP,
      };

      const userId = 'current_user'; // In production, get from auth context
      const share = await createShare(request, userId);

      // Show OTP if generated
      if (share.otpHash) {
        setGeneratedOTP(share.otpHash);
        setShowOTPModal(true);
      }

      setShowCreateModal(false);
      setSelectedFile(null);
      await loadData();

      Alert.alert(
        'Success',
        'Secure share created successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error creating share:', error);
      Alert.alert('Error', 'Failed to create secure share');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    Alert.alert(
      'Revoke Share',
      'Are you sure you want to revoke this share? The recipient will no longer be able to access it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = 'current_user';
              await revokeShare({ shareId, userId });
              await loadData();
              Alert.alert('Success', 'Share revoked successfully');
            } catch (error) {
              console.error('Error revoking share:', error);
              Alert.alert('Error', 'Failed to revoke share');
            }
          }
        }
      ]
    );
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const formatDuration = (duration: string): string => {
    switch (duration) {
      case '1h': return '1 Hour';
      case '24h': return '24 Hours';
      case '7d': return '7 Days';
      default: return duration;
    }
  };

  const formatTimeRemaining = (expiresAt: number): string => {
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return colors.success;
      case 'revoked': return colors.danger;
      case 'expired': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => {
        if (files.length === 0) {
          Alert.alert('No Files', 'Please add files to your secure drive first');
          return;
        }
        setShowCreateModal(true);
      }}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="plus" color={colors.primary} />
    </Pressable>
  );

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
            title: "Secure Sharing",
            headerRight: renderHeaderRight,
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
            <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
              <IconSymbol name="square.and.arrow.up.fill" color={colors.card} size={32} />
            </View>
            <Text style={commonStyles.title}>Secure Sharing</Text>
            <Text style={commonStyles.subtitle}>
              Share photos with end-to-end encryption and sender-controlled access
            </Text>
          </View>

          <View style={[styles.secureModeBadge, { backgroundColor: colors.success }]}>
            <IconSymbol name="lock.shield.fill" color={colors.card} size={20} />
            <Text style={styles.secureModeText}>🔒 Secure Mode ON</Text>
          </View>

          <Pressable
            style={[styles.openShareButton, { backgroundColor: colors.secondary }]}
            onPress={() => router.push('/(tabs)/(home)/open-share')}
          >
            <IconSymbol name="lock.open.fill" color={colors.card} size={20} />
            <Text style={styles.openShareButtonText}>Open Received Share</Text>
          </Pressable>

          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{shares.filter(s => s.status === 'active').length}</Text>
              <Text style={styles.statLabel}>Active Shares</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{shares.reduce((sum, s) => sum + s.accessCount, 0)}</Text>
              <Text style={styles.statLabel}>Total Views</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{shares.filter(s => s.status === 'revoked').length}</Text>
              <Text style={styles.statLabel}>Revoked</Text>
            </View>
          </View>

          {shares.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="square.and.arrow.up" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyTitle}>No Shares Yet</Text>
              <Text style={styles.emptyDescription}>
                Create secure shares with time-limited access and OTP protection
              </Text>
              <Pressable
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (files.length === 0) {
                    Alert.alert('No Files', 'Please add files to your secure drive first', [
                      { text: 'Go to Drive', onPress: () => router.push('/(tabs)/(home)/secure-drive') },
                      { text: 'Cancel', style: 'cancel' }
                    ]);
                    return;
                  }
                  setShowCreateModal(true);
                }}
              >
                <IconSymbol name="plus" color={colors.card} size={20} />
                <Text style={styles.createButtonText}>Create Share</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Your Shares</Text>
              {shares.map((share) => (
                <View key={share.id} style={[styles.shareCard, { backgroundColor: colors.card }]}>
                  <View style={styles.shareHeader}>
                    <View style={styles.shareInfo}>
                      <Text style={styles.shareFileName}>{share.fileName}</Text>
                      <View style={styles.shareMetaRow}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(share.status) }]}>
                          <Text style={styles.statusText}>{share.status.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.shareMetaText}>
                          {share.status === 'active' ? formatTimeRemaining(share.expiresAt) : ''}
                        </Text>
                      </View>
                    </View>
                    {share.status === 'active' && (
                      <Pressable
                        style={[styles.revokeButton, { backgroundColor: colors.danger }]}
                        onPress={() => handleRevokeShare(share.id)}
                      >
                        <IconSymbol name="xmark" color={colors.card} size={16} />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.shareDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol name="clock" color={colors.textSecondary} size={16} />
                      <Text style={styles.detailText}>Duration: {formatDuration(share.duration)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol name="eye" color={colors.textSecondary} size={16} />
                      <Text style={styles.detailText}>Views: {share.accessCount}</Text>
                    </View>
                    {share.requireOTP && (
                      <View style={styles.detailRow}>
                        <IconSymbol name="lock.fill" color={colors.textSecondary} size={16} />
                        <Text style={styles.detailText}>OTP Required</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.shareActions}>
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => copyToClipboard(share.id, 'Share ID')}
                    >
                      <IconSymbol name="doc.on.doc" color={colors.card} size={16} />
                      <Text style={styles.actionButtonText}>Copy ID</Text>
                    </Pressable>
                    {share.qrCode && (
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                        onPress={() => Alert.alert('QR Code', share.qrCode)}
                      >
                        <IconSymbol name="qrcode" color={colors.card} size={16} />
                        <Text style={styles.actionButtonText}>QR Code</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={[styles.infoCard, { backgroundColor: colors.accent }]}>
            <IconSymbol name="info.circle.fill" color={colors.card} size={24} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How It Works</Text>
              <Text style={styles.infoText}>
                • Photos are encrypted locally before sharing{'\n'}
                • Recipients need OTP/PIN to decrypt{'\n'}
                • You can revoke access anytime{'\n'}
                • All access is logged for audit
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Create Share Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Secure Share</Text>
                <Pressable onPress={() => setShowCreateModal(false)}>
                  <IconSymbol name="xmark" color={colors.text} size={24} />
                </Pressable>
              </View>

              <Text style={styles.modalLabel}>Select File</Text>
              <ScrollView style={styles.filesList} horizontal showsHorizontalScrollIndicator={false}>
                {files.map((file) => (
                  <Pressable
                    key={file.id}
                    style={[
                      styles.fileOption,
                      selectedFile?.id === file.id && styles.fileOptionSelected
                    ]}
                    onPress={() => setSelectedFile(file)}
                  >
                    <IconSymbol
                      name={file.type === 'video' ? 'video.fill' : 'photo.fill'}
                      color={selectedFile?.id === file.id ? colors.card : colors.primary}
                      size={32}
                    />
                    <Text style={[
                      styles.fileOptionText,
                      selectedFile?.id === file.id && styles.fileOptionTextSelected
                    ]}>
                      {file.type}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.modalLabel}>Duration</Text>
              <View style={styles.durationOptions}>
                {(['1h', '24h', '7d'] as const).map((d) => (
                  <Pressable
                    key={d}
                    style={[
                      styles.durationOption,
                      duration === d && [styles.durationOptionSelected, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={[
                      styles.durationOptionText,
                      duration === d && styles.durationOptionTextSelected
                    ]}>
                      {formatDuration(d)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={styles.otpToggle}
                onPress={() => setRequireOTP(!requireOTP)}
              >
                <View style={styles.otpToggleLeft}>
                  <IconSymbol name="lock.fill" color={colors.primary} size={20} />
                  <Text style={styles.otpToggleText}>Require OTP</Text>
                </View>
                <View style={[
                  styles.toggle,
                  requireOTP && [styles.toggleActive, { backgroundColor: colors.success }]
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    requireOTP && styles.toggleThumbActive
                  ]} />
                </View>
              </Pressable>

              <Pressable
                style={[styles.createShareButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateShare}
                disabled={loading || !selectedFile}
              >
                <Text style={styles.createShareButtonText}>
                  {loading ? 'Creating...' : 'Create Share'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* OTP Display Modal */}
        <Modal
          visible={showOTPModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowOTPModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.otpModalContent, { backgroundColor: colors.card }]}>
              <IconSymbol name="lock.shield.fill" color={colors.success} size={48} />
              <Text style={styles.otpModalTitle}>Share Created!</Text>
              <Text style={styles.otpModalSubtitle}>
                Share this OTP with the recipient. It will only be shown once.
              </Text>
              
              <View style={[styles.otpDisplay, { backgroundColor: colors.primary }]}>
                <Text style={styles.otpText}>{generatedOTP}</Text>
              </View>

              <Pressable
                style={[styles.copyOTPButton, { backgroundColor: colors.accent }]}
                onPress={() => {
                  if (generatedOTP) {
                    copyToClipboard(generatedOTP, 'OTP');
                  }
                }}
              >
                <IconSymbol name="doc.on.doc" color={colors.card} size={20} />
                <Text style={styles.copyOTPButtonText}>Copy OTP</Text>
              </Pressable>

              <Pressable
                style={styles.closeOTPButton}
                onPress={() => {
                  setShowOTPModal(false);
                  setGeneratedOTP(null);
                }}
              >
                <Text style={[styles.closeOTPButtonText, { color: colors.primary }]}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  secureModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  secureModeText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
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
    marginBottom: 24,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  shareCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shareInfo: {
    flex: 1,
  },
  shareFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  shareMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.card,
  },
  shareMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  revokeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  shareActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.card,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  filesList: {
    marginBottom: 16,
  },
  fileOption: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  fileOptionText: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
  },
  fileOptionTextSelected: {
    color: colors.card,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  durationOptionSelected: {
    borderColor: colors.primary,
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  durationOptionTextSelected: {
    color: colors.card,
  },
  otpToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  otpToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.success,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  createShareButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createShareButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  otpModalContent: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  otpModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  otpModalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  otpDisplay: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 20,
  },
  otpText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.card,
    letterSpacing: 8,
  },
  copyOTPButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  copyOTPButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeOTPButton: {
    paddingVertical: 12,
  },
  closeOTPButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  openShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  openShareButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
