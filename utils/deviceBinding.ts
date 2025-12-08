
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface DeviceIdentifier {
  deviceId: string;
  platform: string;
  model: string;
  osVersion: string;
}

// Generate a unique device identifier
export const generateDeviceId = async (): Promise<string> => {
  try {
    // Check if device ID already exists
    let deviceId = await SecureStore.getItemAsync('device_id');
    
    if (!deviceId) {
      // Generate new device ID using random bytes
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      deviceId = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Store device ID securely (device-bound)
      await SecureStore.setItemAsync('device_id', deviceId, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      
      console.log('Generated new device ID');
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error generating device ID:', error);
    throw error;
  }
};

// Get device information
export const getDeviceInfo = async (): Promise<DeviceIdentifier> => {
  try {
    const deviceId = await generateDeviceId();
    
    return {
      deviceId,
      platform: Platform.OS,
      model: Constants.deviceName || 'Unknown',
      osVersion: Platform.Version.toString(),
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    throw error;
  }
};

// Bind a key to the current device
export const bindKeyToDevice = async (
  key: string,
  identifier: string
): Promise<void> => {
  try {
    const deviceId = await generateDeviceId();
    
    // Create device-bound key by combining with device ID
    const boundKey = `${key}_${deviceId}`;
    
    // Store with device-only accessibility
    await SecureStore.setItemAsync(`bound_${identifier}`, boundKey, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    
    console.log(`Key bound to device: ${identifier}`);
  } catch (error) {
    console.error('Error binding key to device:', error);
    throw error;
  }
};

// Retrieve device-bound key
export const retrieveDeviceBoundKey = async (
  identifier: string
): Promise<string | null> => {
  try {
    const boundKey = await SecureStore.getItemAsync(`bound_${identifier}`);
    
    if (!boundKey) {
      return null;
    }
    
    const deviceId = await generateDeviceId();
    
    // Verify device binding
    if (!boundKey.endsWith(`_${deviceId}`)) {
      console.warn('Key device binding mismatch - key was bound to different device');
      return null;
    }
    
    // Extract original key
    const key = boundKey.substring(0, boundKey.length - deviceId.length - 1);
    return key;
  } catch (error) {
    console.error('Error retrieving device-bound key:', error);
    return null;
  }
};

// Delete device-bound key
export const deleteDeviceBoundKey = async (identifier: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(`bound_${identifier}`);
    console.log(`Device-bound key deleted: ${identifier}`);
  } catch (error) {
    console.error('Error deleting device-bound key:', error);
  }
};

// Verify device binding
export const verifyDeviceBinding = async (identifier: string): Promise<boolean> => {
  try {
    const key = await retrieveDeviceBoundKey(identifier);
    return key !== null;
  } catch (error) {
    console.error('Error verifying device binding:', error);
    return false;
  }
};

// Store device-bound share key
export const storeDeviceBoundShareKey = async (
  shareId: string,
  privateKey: string
): Promise<void> => {
  try {
    await bindKeyToDevice(privateKey, `share_${shareId}`);
    console.log(`Share key bound to device: ${shareId}`);
  } catch (error) {
    console.error('Error storing device-bound share key:', error);
    throw error;
  }
};

// Retrieve device-bound share key
export const retrieveDeviceBoundShareKey = async (
  shareId: string
): Promise<string | null> => {
  try {
    return await retrieveDeviceBoundKey(`share_${shareId}`);
  } catch (error) {
    console.error('Error retrieving device-bound share key:', error);
    return null;
  }
};

// Check if running on rooted/jailbroken device (basic check)
export const isDeviceCompromised = async (): Promise<boolean> => {
  try {
    // Basic check - in production, use a dedicated library like react-native-device-info
    // or react-native-jailbreak-detector
    
    if (Platform.OS === 'ios') {
      // Check for common jailbreak indicators
      // This is a simplified check - production should be more comprehensive
      return false; // Placeholder
    } else if (Platform.OS === 'android') {
      // Check for common root indicators
      // This is a simplified check - production should be more comprehensive
      return false; // Placeholder
    }
    
    return false;
  } catch (error) {
    console.error('Error checking device compromise:', error);
    return false;
  }
};

// Get device security level
export const getDeviceSecurityLevel = async (): Promise<'high' | 'medium' | 'low'> => {
  try {
    const isCompromised = await isDeviceCompromised();
    
    if (isCompromised) {
      return 'low';
    }
    
    // Check if device has secure storage
    const hasSecureStorage = await SecureStore.isAvailableAsync();
    
    if (!hasSecureStorage) {
      return 'low';
    }
    
    // Check if biometric authentication is available
    const LocalAuthentication = require('expo-local-authentication');
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      return 'high';
    }
    
    return 'medium';
  } catch (error) {
    console.error('Error getting device security level:', error);
    return 'low';
  }
};
