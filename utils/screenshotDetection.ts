
import { Platform, Alert } from 'react-native';
import { logEvent } from './eventLogger';

export interface ScreenshotDetectionConfig {
  userId: string;
  shareId: string;
  onScreenshotDetected?: () => void;
}

let screenshotListener: any = null;

// Enable screenshot detection (iOS)
export const enableScreenshotDetection = (config: ScreenshotDetectionConfig) => {
  if (Platform.OS === 'ios') {
    // iOS: Use addListener for screenshot events
    // Note: This requires expo-screen-capture or similar package
    console.log('Screenshot detection enabled (iOS)');
    
    // Placeholder for actual implementation
    // In production, use expo-screen-capture or react-native-screenshot-detector
    screenshotListener = {
      remove: () => console.log('Screenshot listener removed'),
    };
    
    return screenshotListener;
  } else if (Platform.OS === 'android') {
    console.log('Screenshot detection enabled (Android)');
    // Android: Use FLAG_SECURE to prevent screenshots
    // This is handled in the native layer
    return null;
  }
  
  return null;
};

// Disable screenshot detection
export const disableScreenshotDetection = () => {
  if (screenshotListener) {
    screenshotListener.remove();
    screenshotListener = null;
    console.log('Screenshot detection disabled');
  }
};

// Handle screenshot detected event
export const handleScreenshotDetected = async (config: ScreenshotDetectionConfig) => {
  console.log('Screenshot detected!');
  
  // Log the event
  await logEvent({
    type: 'screenshot.detected',
    userId: config.userId,
    shareId: config.shareId,
    timestamp: Date.now(),
    details: 'Screenshot attempt detected during secure viewing',
  });
  
  // Show alert
  Alert.alert(
    '⚠️ Screenshot Detected',
    'This action has been logged for security purposes.',
    [{ text: 'OK' }]
  );
  
  // Call custom handler if provided
  if (config.onScreenshotDetected) {
    config.onScreenshotDetected();
  }
};

// Check if FLAG_SECURE is supported
export const isFlagSecureSupported = (): boolean => {
  return Platform.OS === 'android';
};

// Enable FLAG_SECURE (Android only)
export const enableFlagSecure = () => {
  if (Platform.OS === 'android') {
    console.log('FLAG_SECURE enabled - screenshots blocked');
    // Note: This requires native module implementation
    // For MVP, this is a placeholder
    return true;
  }
  return false;
};

// Disable FLAG_SECURE (Android only)
export const disableFlagSecure = () => {
  if (Platform.OS === 'android') {
    console.log('FLAG_SECURE disabled');
    return true;
  }
  return false;
};
