
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { logEvent } from './eventLogger';

export interface PhoneAuthData {
  phoneNumber: string;
  countryCode: string;
  verified: boolean;
  verificationCode?: string;
  verificationExpiry?: number;
  createdAt: number;
}

const PHONE_AUTH_KEY = 'phone_auth_data';
const VERIFIED_USERS_KEY = 'verified_phone_users';

// Generate 6-digit verification code
export const generateVerificationCode = (): string => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
};

// Send verification code (simulated for MVP - in production, use SMS service)
export const sendVerificationCode = async (
  phoneNumber: string,
  countryCode: string
): Promise<{ success: boolean; code?: string; error?: string }> => {
  try {
    const code = generateVerificationCode();
    const expiry = Date.now() + (10 * 60 * 1000); // 10 minutes

    const authData: PhoneAuthData = {
      phoneNumber,
      countryCode,
      verified: false,
      verificationCode: await hashCode(code),
      verificationExpiry: expiry,
      createdAt: Date.now(),
    };

    await SecureStore.setItemAsync(
      `${PHONE_AUTH_KEY}_${phoneNumber}`,
      JSON.stringify(authData)
    );

    await logEvent({
      type: 'share.create',
      userId: phoneNumber,
      timestamp: Date.now(),
      details: 'Verification code sent',
    });

    console.log(`Verification code sent to ${countryCode}${phoneNumber}: ${code}`);
    
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    // For MVP, return the code for testing
    return { success: true, code };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
};

// Hash verification code
const hashCode = async (code: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    code
  );
};

// Verify phone number with code
export const verifyPhoneNumber = async (
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const authDataJson = await SecureStore.getItemAsync(
      `${PHONE_AUTH_KEY}_${phoneNumber}`
    );

    if (!authDataJson) {
      return { success: false, error: 'No verification request found' };
    }

    const authData: PhoneAuthData = JSON.parse(authDataJson);

    // Check if code has expired
    if (authData.verificationExpiry && Date.now() > authData.verificationExpiry) {
      return { success: false, error: 'Verification code has expired' };
    }

    // Verify code
    const hashedInput = await hashCode(code);
    if (hashedInput !== authData.verificationCode) {
      await logEvent({
        type: 'access.denied',
        userId: phoneNumber,
        timestamp: Date.now(),
        details: 'Invalid verification code',
      });
      return { success: false, error: 'Invalid verification code' };
    }

    // Mark as verified
    authData.verified = true;
    authData.verificationCode = undefined;
    authData.verificationExpiry = undefined;

    await SecureStore.setItemAsync(
      `${PHONE_AUTH_KEY}_${phoneNumber}`,
      JSON.stringify(authData)
    );

    // Add to verified users list
    await addVerifiedUser(phoneNumber, authData.countryCode);

    await logEvent({
      type: 'share.open',
      userId: phoneNumber,
      timestamp: Date.now(),
      details: 'Phone number verified successfully',
    });

    console.log(`Phone number verified: ${phoneNumber}`);
    return { success: true };
  } catch (error) {
    console.error('Error verifying phone number:', error);
    return { success: false, error: 'Verification failed' };
  }
};

// Add verified user to the list
const addVerifiedUser = async (phoneNumber: string, countryCode: string): Promise<void> => {
  try {
    const usersJson = await SecureStore.getItemAsync(VERIFIED_USERS_KEY);
    const users: PhoneAuthData[] = usersJson ? JSON.parse(usersJson) : [];

    // Check if user already exists
    const existingIndex = users.findIndex(u => u.phoneNumber === phoneNumber);
    
    if (existingIndex >= 0) {
      users[existingIndex].verified = true;
    } else {
      users.push({
        phoneNumber,
        countryCode,
        verified: true,
        createdAt: Date.now(),
      });
    }

    await SecureStore.setItemAsync(VERIFIED_USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error adding verified user:', error);
  }
};

// Check if phone number is verified
export const isPhoneVerified = async (phoneNumber: string): Promise<boolean> => {
  try {
    const authDataJson = await SecureStore.getItemAsync(
      `${PHONE_AUTH_KEY}_${phoneNumber}`
    );

    if (!authDataJson) {
      return false;
    }

    const authData: PhoneAuthData = JSON.parse(authDataJson);
    return authData.verified;
  } catch (error) {
    console.error('Error checking phone verification:', error);
    return false;
  }
};

// Get all verified users
export const getVerifiedUsers = async (): Promise<PhoneAuthData[]> => {
  try {
    const usersJson = await SecureStore.getItemAsync(VERIFIED_USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Error getting verified users:', error);
    return [];
  }
};

// Get current user's phone data
export const getCurrentUserPhone = async (): Promise<PhoneAuthData | null> => {
  try {
    const phoneNumber = await SecureStore.getItemAsync('current_user_phone');
    if (!phoneNumber) {
      return null;
    }

    const authDataJson = await SecureStore.getItemAsync(
      `${PHONE_AUTH_KEY}_${phoneNumber}`
    );

    return authDataJson ? JSON.parse(authDataJson) : null;
  } catch (error) {
    console.error('Error getting current user phone:', error);
    return null;
  }
};

// Set current user's phone
export const setCurrentUserPhone = async (phoneNumber: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync('current_user_phone', phoneNumber);
  } catch (error) {
    console.error('Error setting current user phone:', error);
  }
};

// Resend verification code
export const resendVerificationCode = async (
  phoneNumber: string,
  countryCode: string
): Promise<{ success: boolean; code?: string; error?: string }> => {
  return await sendVerificationCode(phoneNumber, countryCode);
};
