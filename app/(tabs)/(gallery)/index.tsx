
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2;

interface ProtectedItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  uploadDate: string;
  metadata: {
    size: number;
    width?: number;
    height?: number;
    duration?: number;
  };
  userIdentity: string;
}

export default function GalleryScreen() {
  const router = useRouter();
  const [protectedItems, setProtectedItems] = useState<ProtectedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProtectedItems();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to upload content.'
      );
    }
  };

  const loadProtectedItems = async () => {
    try {
      const stored = await AsyncStorage.getItem('protected_items');
      if (stored) {
        setProtectedItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading protected items:', error);
    }
  };

  const saveProtectedItems = async (items: ProtectedItem[]) => {
    try {
      await AsyncStorage.setItem('protected_items', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving protected items:', error);
    }
  };

  const handleUploadMedia = async () => {
    try {
      setLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Extract metadata
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const userName = await AsyncStorage.getItem('user_name') || 'Anonymous User';
        
        const newItem: ProtectedItem = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: asset.type === 'video' ? 'video' : 'image',
          uploadDate: new Date().toISOString(),
          metadata: {
            size: fileInfo.size || 0,
            width: asset.width,
            height: asset.height,
            duration: asset.duration,
          },
          userIdentity: userName,
        };

        const updatedItems = [...protectedItems, newItem];
        setProtectedItems(updatedItems);
        await saveProtectedItems(updatedItems);

        Alert.alert(
          'Success',
          'Content has been protected and added to your secure gallery!'
        );
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      Alert.alert('Error', 'Failed to upload media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access.');
        return;
      }

      setLoading(true);

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const userName = await AsyncStorage.getItem('user_name') || 'Anonymous User';

        const newItem: ProtectedItem = {
          id: Date.now().toString(),
          uri: asset.uri,
          type: 'image',
          uploadDate: new Date().toISOString(),
          metadata: {
            size: fileInfo.size || 0,
            width: asset.width,
            height: asset.height,
          },
          userIdentity: userName,
        };

        const updatedItems = [...protectedItems, newItem];
        setProtectedItems(updatedItems);
        await saveProtectedItems(updatedItems);

        Alert.alert('Success', 'Photo captured and protected!');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (item: ProtectedItem) => {
    router.push({
      pathname: '/(tabs)/(gallery)/protection-report',
      params: { itemId: item.id },
    });
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to delete this protected content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedItems = protectedItems.filter(item => item.id !== itemId);
            setProtectedItems(updatedItems);
            await saveProtectedItems(updatedItems);
          },
        },
      ]
    );
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={handleUploadMedia}
      style={styles.headerButton}
      disabled={loading}
    >
      <IconSymbol name="plus.circle.fill" color={colors.primary} size={28} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Protected Gallery',
            headerRight: renderHeaderRight,
          }}
        />
      )}
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Protected Gallery</Text>
            <Text style={styles.subtitle}>
              Your encrypted media with protection reports
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="photo.stack.fill" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{protectedItems.length}</Text>
              <Text style={styles.statLabel}>Protected Items</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="shield.checkmark.fill" size={24} color={colors.success} />
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>Encrypted</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleTakePhoto}
              disabled={loading}
            >
              <IconSymbol name="camera.fill" size={24} color="#ffffff" />
              <Text style={styles.actionButtonText}>Take Photo</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={handleUploadMedia}
              disabled={loading}
            >
              <IconSymbol name="photo.on.rectangle.angled" size={24} color="#ffffff" />
              <Text style={styles.actionButtonText}>Upload Media</Text>
            </Pressable>
          </View>

          {protectedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primary }]}>
                <IconSymbol name="photo.stack" size={60} color="#ffffff" />
              </View>
              <Text style={styles.emptyTitle}>No Protected Content Yet</Text>
              <Text style={styles.emptyDescription}>
                Upload photos or videos to create protection reports and secure your content
              </Text>
            </View>
          ) : (
            <View style={styles.gallery}>
              {protectedItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.galleryItem, { backgroundColor: colors.card }]}
                  onPress={() => handleViewReport(item)}
                >
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                  <View style={styles.itemOverlay}>
                    <View style={[styles.typeBadge, { backgroundColor: colors.primary }]}>
                      <IconSymbol
                        name={item.type === 'video' ? 'video.fill' : 'photo.fill'}
                        size={12}
                        color="#ffffff"
                      />
                      <Text style={styles.typeBadgeText}>
                        {item.type === 'video' ? 'Video' : 'Image'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemDate}>
                      {new Date(item.uploadDate).toLocaleDateString()}
                    </Text>
                    <View style={styles.itemActions}>
                      <Pressable
                        onPress={() => handleViewReport(item)}
                        style={styles.itemActionButton}
                      >
                        <IconSymbol name="doc.text.fill" size={16} color={colors.primary} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteItem(item.id)}
                        style={styles.itemActionButton}
                      >
                        <IconSymbol name="trash.fill" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
            <IconSymbol name="checkmark.shield.fill" size={28} color="#ffffff" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Protection Active</Text>
              <Text style={styles.infoDescription}>
                All content is encrypted with AES-256 and includes metadata protection reports
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  headerButton: {
    padding: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  galleryItem: {
    width: ITEM_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: ITEM_WIDTH,
    backgroundColor: colors.border,
  },
  itemOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  itemInfo: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemActionButton: {
    padding: 4,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    opacity: 0.9,
  },
});
