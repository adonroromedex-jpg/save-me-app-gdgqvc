
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { logEvent } from './eventLogger';

export interface BiometricAuthConfig {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

// Check if biometric authentication is available
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

// Get supported authentication types
export const getSupportedAuthTypes = async (): Promise<number[]> => {
  try {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  } catch (error) {
    console.error('Error getting supported auth types:', error);
    return [];
  }
};

// Authenticate with biometrics
export const authenticateWithBiometrics = async (
  config: BiometricAuthConfig = {}
): Promise<boolean> => {
  try {
    const isAvailable = await isBiometricAvailable();
    
    if (!isAvailable) {
      Alert.alert(
        'Biometric Authentication Unavailable',
        'Please set up fingerprint or face recognition on your device.'
      );
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: config.promptMessage || 'Authenticate to access Save Me',
      cancelLabel: config.cancelLabel || 'Cancel',
      fallbackLabel: config.fallbackLabel || 'Use Passcode',
      disableDeviceFallback: config.disableDeviceFallback || false,
    });

    if (result.success) {
      await logEvent({
        type: 'share.open',
        userId: 'current_user',
        timestamp: Date.now(),
        details: 'Biometric authentication successful',
      });
      return true;
    } else {
      await logEvent({
        type: 'access.denied',
        userId: 'current_user',
        timestamp: Date.now(),
        details: `Biometric authentication failed: ${result.error}`,
      });
      return false;
    }
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

// Check if app access protection is enabled
export const isAppLockEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync('app_lock_enabled');
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking app lock status:', error);
    return false;
  }
};

// Enable app access protection
export const enableAppLock = async (): Promise<void> => {
  try {
    await SecureStore.setItemAsync('app_lock_enabled', 'true');
    console.log('App lock enabled');
  } catch (error) {
    console.error('Error enabling app lock:', error);
    throw error;
  }
};

// Disable app access protection
export const disableAppLock = async (): Promise<void> => {
  try {
    await SecureStore.setItemAsync('app_lock_enabled', 'false');
    console.log('App lock disabled');
  } catch (error) {
    console.error('Error disabling app lock:', error);
    throw error;
  }
};

// Set PIN for app access
export const setAppPIN = async (pin: string): Promise<boolean> => {
  try {
    // Hash the PIN before storing
    const crypto = require('expo-crypto');
    const hashedPIN = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
    await SecureStore.setItemAsync('app_pin', hashedPIN);
    await enableAppLock();
    console.log('App PIN set successfully');
    return true;
  } catch (error) {
    console.error('Error setting app PIN:', error);
    return false;
  }
};

// Verify PIN
export const verifyAppPIN = async (pin: string): Promise<boolean> => {
  try {
    const storedHash = await SecureStore.getItemAsync('app_pin');
    if (!storedHash) {
      return false;
    }

    const crypto = require('expo-crypto');
    const inputHash = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );

    const isValid = inputHash === storedHash;
    
    if (isValid) {
      await logEvent({
        type: 'share.open',
        userId: 'current_user',
        timestamp: Date.now(),
        details: 'PIN authentication successful',
      });
    } else {
      await logEvent({
        type: 'access.denied',
        userId: 'current_user',
        timestamp: Date.now(),
        details: 'PIN authentication failed',
      });
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
};

// Check if PIN is set
export const isPINSet = async (): Promise<boolean> => {
  try {
    const pin = await SecureStore.getItemAsync('app_pin');
    return pin !== null;
  } catch (error) {
    console.error('Error checking PIN status:', error);
    return false;
  }
};

// Authenticate user (biometric or PIN)
export const authenticateUser = async (
  preferBiometric: boolean = true
): Promise<boolean> => {
  try {
    const isLockEnabled = await isAppLockEnabled();
    
    if (!isLockEnabled) {
      return true; // No authentication required
    }

    // Try biometric first if preferred and available
    if (preferBiometric) {
      const biometricAvailable = await isBiometricAvailable();
      if (biometricAvailable) {
        return await authenticateWithBiometrics();
      }
    }

    // Fall back to PIN
    const pinSet = await isPINSet();
    if (pinSet) {
      // PIN verification will be handled by UI
      return false; // Indicate that PIN UI should be shown
    }

    // No authentication method available
    return true;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return false;
  }
};

// Get authentication method name
export const getAuthMethodName = async (): Promise<string> => {
  try {
    const authTypes = await getSupportedAuthTypes();
    
    if (authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    
    if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    
    if (authTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Recognition';
    }
    
    return 'Biometric Authentication';
  } catch (error) {
    console.error('Error getting auth method name:', error);
    return 'Biometric Authentication';
  }
};
