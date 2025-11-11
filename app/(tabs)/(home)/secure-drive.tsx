
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, Image } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface SecureFile {
  id: string;
  uri: string;
  type: 'image' | 'video';
  timestamp: number;
  encrypted: boolean;
  isReceivedContent?: boolean; // Flag to mark files received from others
}

export default function SecureDriveScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [secureFiles, setSecureFiles] = useState<SecureFile[]>([]);

  useEffect(() => {
    loadSecureFiles();
  }, []);

  const loadSecureFiles = async () => {
    try {
      const filesJson = await SecureStore.getItemAsync('secure_files');
      if (filesJson) {
        const files = JSON.parse(filesJson);
        setSecureFiles(files);
        console.log('Loaded secure files:', files.length);
      }
    } catch (error) {
      console.error('Error loading secure files:', error);
    }
  };

  const saveSecureFiles = async (newFiles: SecureFile[]) => {
    try {
      await SecureStore.setItemAsync('secure_files', JSON.stringify(newFiles));
      setSecureFiles(newFiles);
      console.log('Saved secure files:', newFiles.length);
    } catch (error) {
      console.error('Error saving secure files:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to import files.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        const newFile: SecureFile = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          timestamp: Date.now(),
          encrypted: true,
          isReceivedContent: false, // User's own content
        };

        const updatedFiles = [...secureFiles, newFile];
        await saveSecureFiles(updatedFiles);

        Alert.alert('Success', 'File added to secure drive');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to import file');
    }
  };

  const deleteFile = async (fileId: string) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to permanently delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedFiles = secureFiles.filter(f => f.id !== fileId);
              await saveSecureFiles(updatedFiles);
              console.log('Deleted file:', fileId);
            } catch (error) {
              console.error('Error deleting file:', error);
              Alert.alert('Error', 'Failed to delete file');
            }
          }
        }
      ]
    );
  };

  const shareFile = (file: SecureFile) => {
    // Check if this is received content
    if (file.isReceivedContent) {
      Alert.alert(
        '🚫 Sharing Blocked',
        'This content was shared with you by another user and cannot be forwarded.\n\n🔒 Security Restrictions:\n• No sharing with other users\n• No export to other apps\n• No saving to device gallery\n• No copying or forwarding\n\nThis is a core security feature of Save Me to protect the privacy of the original sender.',
        [{ text: 'I Understand' }]
      );
      return;
    }

    // Navigate to share screen for user's own content
    router.push({
      pathname: '/(tabs)/(home)/share-with-users',
      params: {
        fileId: file.id,
        fileUri: file.uri,
        fileType: file.type,
      }
    });
  };

  const handleFilePress = (file: SecureFile) => {
    const options = file.isReceivedContent 
      ? ['View', 'Delete', 'Cancel']
      : ['View', 'Share', 'Delete', 'Cancel'];

    const actions = file.isReceivedContent
      ? [
          { text: 'View', onPress: () => console.log('Viewing file:', file.id) },
          { text: 'Delete', style: 'destructive' as const, onPress: () => deleteFile(file.id) },
          { text: 'Cancel', style: 'cancel' as const },
        ]
      : [
          { text: 'View', onPress: () => console.log('Viewing file:', file.id) },
          { text: 'Share', onPress: () => shareFile(file) },
          { text: 'Delete', style: 'destructive' as const, onPress: () => deleteFile(file.id) },
          { text: 'Cancel', style: 'cancel' as const },
        ];

    Alert.alert(
      file.isReceivedContent ? '🔒 Received Content' : 'File Options',
      file.isReceivedContent 
        ? 'This content was shared with you and cannot be forwarded to others.'
        : 'What would you like to do with this file?',
      actions
    );
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={pickImage}
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

  const ownFiles = secureFiles.filter(f => !f.isReceivedContent);
  const receivedFiles = secureFiles.filter(f => f.isReceivedContent);

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Secure Drive",
            headerLeft: renderHeaderLeft,
            headerRight: renderHeaderRight,
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
              <IconSymbol name="folder.fill" color={colors.card} size={32} />
            </View>
            <Text style={commonStyles.title}>Secure Drive</Text>
            <Text style={commonStyles.subtitle}>
              Your encrypted files stored securely
            </Text>
          </View>

          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{secureFiles.length}</Text>
              <Text style={styles.statLabel}>Total Files</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{ownFiles.length}</Text>
              <Text style={styles.statLabel}>Your Files</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{receivedFiles.length}</Text>
              <Text style={styles.statLabel}>Received</Text>
            </View>
          </View>

          {secureFiles.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="folder.fill" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyTitle}>No Files Yet</Text>
              <Text style={styles.emptyDescription}>
                Add files from your gallery or use the private camera to capture new content
              </Text>
              <Pressable
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={pickImage}
              >
                <IconSymbol name="plus" color={colors.card} size={20} />
                <Text style={styles.addButtonText}>Add File</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Your Files Section */}
              {ownFiles.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Your Files ({ownFiles.length})</Text>
                  <View style={styles.filesGrid}>
                    {ownFiles.map((file) => (
                      <Pressable
                        key={file.id}
                        style={[styles.fileCard, { backgroundColor: colors.card }]}
                        onPress={() => handleFilePress(file)}
                      >
                        <Image
                          source={{ uri: file.uri }}
                          style={styles.fileImage}
                          resizeMode="cover"
                        />
                        <View style={styles.fileOverlay}>
                          <IconSymbol
                            name={file.type === 'video' ? 'video.fill' : 'photo.fill'}
                            color={colors.card}
                            size={24}
                          />
                        </View>
                        <View style={styles.fileInfo}>
                          <Text style={styles.fileDate}>
                            {new Date(file.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {/* Received Files Section */}
              {receivedFiles.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Received Files ({receivedFiles.length})</Text>
                    <View style={[styles.protectedBadge, { backgroundColor: colors.danger }]}>
                      <IconSymbol name="lock.fill" color={colors.card} size={12} />
                      <Text style={styles.protectedBadgeText}>Protected</Text>
                    </View>
                  </View>
                  <View style={[styles.warningCard, { backgroundColor: colors.danger }]}>
                    <IconSymbol name="exclamationmark.triangle.fill" color={colors.card} size={20} />
                    <Text style={styles.warningText}>
                      These files cannot be shared with others or exported to any app
                    </Text>
                  </View>
                  <View style={styles.filesGrid}>
                    {receivedFiles.map((file) => (
                      <Pressable
                        key={file.id}
                        style={[styles.fileCard, { backgroundColor: colors.card }]}
                        onPress={() => handleFilePress(file)}
                      >
                        <Image
                          source={{ uri: file.uri }}
                          style={styles.fileImage}
                          resizeMode="cover"
                        />
                        <View style={styles.fileOverlay}>
                          <IconSymbol
                            name={file.type === 'video' ? 'video.fill' : 'photo.fill'}
                            color={colors.card}
                            size={24}
                          />
                        </View>
                        {/* Lock badge for received content */}
                        <View style={[styles.lockBadge, { backgroundColor: colors.danger }]}>
                          <IconSymbol name="lock.fill" color={colors.card} size={14} />
                        </View>
                        <View style={styles.fileInfo}>
                          <Text style={styles.fileDate}>
                            {new Date(file.timestamp).toLocaleDateString()}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          <View style={[styles.infoCard, { backgroundColor: colors.accent }]}>
            <IconSymbol name="info.circle.fill" color={colors.card} size={24} />
            <Text style={styles.infoText}>
              🔐 All files are encrypted with AES-256 encryption. Files marked with 🔒 were received from others and cannot be shared further.
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  protectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  protectedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.card,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.card,
    fontWeight: '600',
  },
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  fileCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  fileImage: {
    width: '100%',
    height: '100%',
  },
  fileOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 6,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 16,
    padding: 6,
  },
  fileInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  fileDate: {
    fontSize: 11,
    color: colors.card,
    fontWeight: '600',
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.card,
    marginLeft: 12,
    lineHeight: 20,
  },
});
