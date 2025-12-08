
import React, { useState, useEffect, useRef } from "react";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, Pressable, Alert, Platform, Image, Dimensions } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { openShare } from "@/services/sharingService";
import { SecureShare } from "@/types/sharing";
import { generateWatermarkText, getWatermarkStyle, getWatermarkTextStyle } from "@/utils/watermarkUtils";
import { enableScreenshotDetection, disableScreenshotDetection, handleScreenshotDetected } from "@/utils/screenshotDetection";
import { logEvent } from "@/utils/eventLogger";

const { width, height } = Dimensions.get('window');

export default function SecureViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [share, setShare] = useState<SecureShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWatermark, setShowWatermark] = useState(true);
  const screenshotListenerRef = useRef<any>(null);

  useEffect(() => {
    loadShare();
    setupSecureMode();

    return () => {
      cleanupSecureMode();
    };
  }, []);

  const setupSecureMode = async () => {
    const userId = 'current_user';
    const shareId = params.shareId as string;
    
    // Enable screenshot detection and prevention
    screenshotListenerRef.current = await enableScreenshotDetection({
      userId,
      shareId,
      onScreenshotDetected: () => {
        handleScreenshotDetected({ userId, shareId });
      },
    });

    console.log('Secure mode enabled with screenshot protection');
  };

  const cleanupSecureMode = async () => {
    // Disable screenshot detection
    await disableScreenshotDetection();
    console.log('Secure mode disabled');
  };

  const loadShare = async () => {
    try {
      setLoading(true);
      const shareId = params.shareId as string;
      const otp = params.otp as string | undefined;
      const userId = 'current_user';

      if (!shareId) {
        throw new Error('Share ID is required');
      }

      const openedShare = await openShare({ shareId, otp, userId });
      
      if (!openedShare) {
        throw new Error('Failed to open share');
      }

      setShare(openedShare);
      setError(null);
    } catch (err: any) {
      console.error('Error loading share:', err);
      setError(err.message || 'Failed to load share');
      Alert.alert('Error', err.message || 'Failed to load share', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Close Viewer',
      'Are you sure you want to close the secure viewer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close', onPress: () => router.back() }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: '#000' }]}>
        <IconSymbol name="lock.shield.fill" color={colors.card} size={48} />
        <Text style={styles.loadingText}>Loading secure content...</Text>
      </View>
    );
  }

  if (error || !share) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: '#000' }]}>
        <IconSymbol name="exclamationmark.triangle.fill" color={colors.danger} size={48} />
        <Text style={styles.errorText}>{error || 'Failed to load share'}</Text>
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const watermarkConfig = {
    userId: 'current_user',
    timestamp: Date.now(),
    shareId: share.id,
    text: 'CONFIDENTIAL',
  };

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Secure Viewer",
            headerShown: false,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: '#000' }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.topButton}
            onPress={handleClose}
          >
            <IconSymbol name="xmark" color={colors.card} size={24} />
          </Pressable>
          
          <View style={[styles.secureModeBadge, { backgroundColor: colors.danger }]}>
            <IconSymbol name="lock.shield.fill" color={colors.card} size={14} />
            <Text style={styles.secureModeText}>SECURE MODE</Text>
          </View>

          <Pressable
            style={styles.topButton}
            onPress={() => setShowWatermark(!showWatermark)}
          >
            <IconSymbol name="info.circle" color={colors.card} size={24} />
          </Pressable>
        </View>

        {/* Image/Video Content */}
        <View style={styles.contentContainer}>
          {share.fileType === 'image' ? (
            <Image
              source={{ uri: share.fileUri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <IconSymbol name="video.fill" color={colors.card} size={64} />
              <Text style={styles.videoText}>Video playback coming soon</Text>
            </View>
          )}

          {/* Watermark Overlay */}
          {showWatermark && (
            <View style={getWatermarkStyle()}>
              <Text style={getWatermarkTextStyle()}>
                {generateWatermarkText(watermarkConfig)}
              </Text>
            </View>
          )}

          {/* Screenshot Warning Overlay (Web) */}
          {Platform.OS === 'web' && (
            <View style={styles.webWarningOverlay}>
              <View style={[styles.webWarning, { backgroundColor: colors.warning }]}>
                <IconSymbol name="exclamationmark.triangle.fill" color={colors.card} size={16} />
                <Text style={styles.webWarningText}>
                  Screenshots cannot be prevented on web
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Info Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.infoRow}>
            <IconSymbol name="doc.text" color={colors.card} size={16} />
            <Text style={styles.infoText}>{share.fileName}</Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol name="person" color={colors.card} size={16} />
            <Text style={styles.infoText}>From: {share.senderName}</Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol name="eye" color={colors.card} size={16} />
            <Text style={styles.infoText}>Views: {share.accessCount}</Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={[styles.securityNotice, { backgroundColor: colors.danger }]}>
          <IconSymbol name="exclamationmark.shield.fill" color={colors.card} size={20} />
          <Text style={styles.securityNoticeText}>
            {Platform.OS === 'android' 
              ? '🔒 Screenshots blocked • Screen recording blocked • All access logged'
              : Platform.OS === 'ios'
              ? '🔒 Screenshots blocked • Screen recording blocked • All access logged'
              : '⚠️ Limited protection on web • All access logged'}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.card,
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secureModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  secureModeText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height - 200,
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: colors.card,
    fontSize: 16,
    marginTop: 16,
  },
  webWarningOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  webWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  webWarningText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  bottomBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: colors.card,
    fontSize: 14,
    marginLeft: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  securityNoticeText: {
    color: colors.card,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
  },
});
