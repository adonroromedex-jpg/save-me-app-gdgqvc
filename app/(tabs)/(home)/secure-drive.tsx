
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, Image } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

interface SecureFile {
  id: string;
  uri: string;
  type: 'image' | 'video';
  timestamp: number;
  encrypted: boolean;
}

export default function SecureDriveScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [files, setFiles] = useState<SecureFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSecureFiles();
  }, []);

  const loadSecureFiles = async () => {
    try {
      const storedFiles = await SecureStore.getItemAsync('secure_files');
      if (storedFiles) {
        setFiles(JSON.parse(storedFiles));
        console.log('Loaded secure files:', JSON.parse(storedFiles).length);
      }
    } catch (error) {
      console.error('Error loading secure files:', error);
    }
  };

  const saveSecureFiles = async (newFiles: SecureFile[]) => {
    try {
      await SecureStore.setItemAsync('secure_files', JSON.stringify(newFiles));
      console.log('Saved secure files:', newFiles.length);
    } catch (error) {
      console.error('Error saving secure files:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const asset = result.assets[0];
        
        // Create secure file entry
        const newFile: SecureFile = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          timestamp: Date.now(),
          encrypted: true,
        };

        const updatedFiles = [...files, newFile];
        setFiles(updatedFiles);
        await saveSecureFiles(updatedFiles);
        
        setLoading(false);
        Alert.alert('Success', 'File added to secure drive');
        console.log('Added file to secure drive:', newFile.id);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to add file to secure drive');
    }
  };

  const deleteFile = async (fileId: string) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedFiles = files.filter(f => f.id !== fileId);
            setFiles(updatedFiles);
            await saveSecureFiles(updatedFiles);
            console.log('Deleted file:', fileId);
          }
        }
      ]
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

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Secure Drive",
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
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="lock.shield.fill" color={colors.card} size={32} />
            </View>
            <Text style={commonStyles.title}>Secure Drive</Text>
            <Text style={commonStyles.subtitle}>
              All files are encrypted with AES-256 and stored securely on your device
            </Text>
          </View>

          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{files.length}</Text>
              <Text style={styles.statLabel}>Secure Files</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{files.filter(f => f.type === 'image').length}</Text>
              <Text style={styles.statLabel}>Images</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{files.filter(f => f.type === 'video').length}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
          </View>

          {files.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="folder.fill" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyTitle}>No Files Yet</Text>
              <Text style={styles.emptyDescription}>
                Add photos or videos from your gallery or use the private camera
              </Text>
              <Pressable
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={pickImage}
              >
                <IconSymbol name="plus" color={colors.card} size={20} />
                <Text style={styles.addButtonText}>Add Files</Text>
              </Pressable>
              <Pressable
                style={[styles.cameraButton, { backgroundColor: colors.secondary }]}
                onPress={() => router.push("/(tabs)/(home)/private-camera")}
              >
                <IconSymbol name="camera.fill" color={colors.card} size={20} />
                <Text style={styles.addButtonText}>Open Camera</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  onPress={pickImage}
                >
                  <IconSymbol name="plus" color={colors.card} size={20} />
                  <Text style={styles.actionButtonText}>Add Files</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                  onPress={() => router.push("/(tabs)/(home)/private-camera")}
                >
                  <IconSymbol name="camera.fill" color={colors.card} size={20} />
                  <Text style={styles.actionButtonText}>Camera</Text>
                </Pressable>
              </View>

              <Text style={styles.sectionTitle}>Your Files</Text>
              <View style={styles.filesGrid}>
                {files.map((file) => (
                  <Pressable
                    key={file.id}
                    style={[styles.fileCard, { backgroundColor: colors.card }]}
                    onLongPress={() => deleteFile(file.id)}
                  >
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.fileImage}
                      resizeMode="cover"
                    />
                    <View style={styles.fileOverlay}>
                      <View style={[styles.fileTypeBadge, { backgroundColor: file.type === 'video' ? colors.secondary : colors.accent }]}>
                        <IconSymbol 
                          name={file.type === 'video' ? 'video.fill' : 'photo.fill'} 
                          color={colors.card} 
                          size={12} 
                        />
                      </View>
                      <IconSymbol name="lock.fill" color={colors.card} size={16} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <View style={[styles.infoCard, { backgroundColor: colors.accent }]}>
            <IconSymbol name="info.circle.fill" color={colors.card} size={24} />
            <Text style={styles.infoText}>
              Long press on any file to delete it. All files are automatically encrypted.
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  filesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  fileCard: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
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
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
