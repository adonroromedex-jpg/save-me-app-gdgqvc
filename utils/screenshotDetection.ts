
import { Platform, Alert } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { logEvent } from './eventLogger';

export interface ScreenshotDetectionConfig {
  userId: string;
  shareId: string;
  onScreenshotDetected?: () => void;
}

let screenshotListener: any = null;

// Enable screenshot prevention and detection
export const enableScreenshotDetection = async (config: ScreenshotDetectionConfig) => {
  try {
    // Prevent screen capture on both iOS and Android
    await ScreenCapture.preventScreenCaptureAsync();
    console.log('Screen capture prevention enabled');

    // Add screenshot listener for iOS (Android is blocked by preventScreenCaptureAsync)
    if (Platform.OS === 'ios') {
      screenshotListener = ScreenCapture.addScreenshotListener(() => {
        handleScreenshotDetected(config);
      });
      console.log('Screenshot detection listener added (iOS)');
    }

    return screenshotListener;
  } catch (error) {
    console.error('Error enabling screenshot detection:', error);
    return null;
  }
};

// Disable screenshot detection
export const disableScreenshotDetection = async () => {
  try {
    // Allow screen capture again
    await ScreenCapture.allowScreenCaptureAsync();
    console.log('Screen capture prevention disabled');

    // Remove screenshot listener
    if (screenshotListener) {
      screenshotListener.remove();
      screenshotListener = null;
      console.log('Screenshot detection listener removed');
    }
  } catch (error) {
    console.error('Error disabling screenshot detection:', error);
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
    'This action has been logged for security purposes. Screenshots are not allowed for secure content.',
    [{ text: 'OK' }]
  );
  
  // Call custom handler if provided
  if (config.onScreenshotDetected) {
    config.onScreenshotDetected();
  }
};

// Check if screen capture prevention is supported
export const isScreenCapturePreventionSupported = (): boolean => {
  return Platform.OS === 'android' || Platform.OS === 'ios';
};

// Enable screen capture prevention (for secure viewer)
export const enableFlagSecure = async (): Promise<boolean> => {
  try {
    await ScreenCapture.preventScreenCaptureAsync();
    console.log('Screen capture blocked');
    return true;
  } catch (error) {
    console.error('Error enabling screen capture prevention:', error);
    return false;
  }
};

// Disable screen capture prevention
export const disableFlagSecure = async (): Promise<boolean> => {
  try {
    await ScreenCapture.allowScreenCaptureAsync();
    console.log('Screen capture allowed');
    return true;
  } catch (error) {
    console.error('Error disabling screen capture prevention:', error);
    return false;
  }
};

// Check if screen capture is currently prevented
export const isScreenCapturePrevented = async (): Promise<boolean> => {
  try {
    // expo-screen-capture doesn't provide a direct way to check status
    // We'll track it manually
    return false; // Default to false, will be managed by enable/disable calls
  } catch (error) {
    console.error('Error checking screen capture status:', error);
    return false;
  }
};
