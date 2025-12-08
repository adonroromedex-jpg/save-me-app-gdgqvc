
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VerificationResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * Generate a random 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send a verification code to the provided phone number
 * In production, this would integrate with an SMS service like Twilio
 * For now, it generates a code and returns it for testing
 */
export async function sendVerificationCode(
  phoneNumber: string,
  countryCode: string = '+1'
): Promise<VerificationResult> {
  try {
    console.log(`Sending verification code to ${countryCode}${phoneNumber}`);
    
    // Generate a 6-digit code
    const code = generateVerificationCode();
    
    // Store the code temporarily for verification
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    await AsyncStorage.setItem(`verification_code_${fullPhoneNumber}`, code);
    await AsyncStorage.setItem(`verification_code_timestamp_${fullPhoneNumber}`, Date.now().toString());
    
    // In production, you would send the code via SMS here
    // For testing, we return the code in the response
    console.log(`Generated verification code: ${code}`);
    
    return {
      success: true,
      code, // Remove this in production
    };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return {
      success: false,
      error: 'Failed to send verification code. Please try again.',
    };
  }
}

/**
 * Resend a verification code to the provided phone number
 */
export async function resendVerificationCode(
  phoneNumber: string,
  countryCode: string = '+1'
): Promise<VerificationResult> {
  return sendVerificationCode(phoneNumber, countryCode);
}

/**
 * Verify the phone number with the provided code
 */
export async function verifyPhoneNumber(
  phoneNumber: string,
  code: string,
  countryCode: string = '+1'
): Promise<VerificationResult> {
  try {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    
    // Retrieve the stored code
    const storedCode = await AsyncStorage.getItem(`verification_code_${fullPhoneNumber}`);
    const timestamp = await AsyncStorage.getItem(`verification_code_timestamp_${fullPhoneNumber}`);
    
    if (!storedCode || !timestamp) {
      return {
        success: false,
        error: 'No verification code found. Please request a new code.',
      };
    }
    
    // Check if code has expired (10 minutes)
    const codeAge = Date.now() - parseInt(timestamp);
    const TEN_MINUTES = 10 * 60 * 1000;
    
    if (codeAge > TEN_MINUTES) {
      // Clean up expired code
      await AsyncStorage.removeItem(`verification_code_${fullPhoneNumber}`);
      await AsyncStorage.removeItem(`verification_code_timestamp_${fullPhoneNumber}`);
      
      return {
        success: false,
        error: 'Verification code has expired. Please request a new code.',
      };
    }
    
    // Verify the code
    if (code === storedCode) {
      // Clean up the verification code
      await AsyncStorage.removeItem(`verification_code_${fullPhoneNumber}`);
      await AsyncStorage.removeItem(`verification_code_timestamp_${fullPhoneNumber}`);
      
      // Mark phone as verified
      await AsyncStorage.setItem('phone_verified', 'true');
      await AsyncStorage.setItem('user_phone_number', fullPhoneNumber);
      
      console.log('Phone number verified successfully');
      
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        error: 'Invalid verification code. Please try again.',
      };
    }
  } catch (error) {
    console.error('Error verifying phone number:', error);
    return {
      success: false,
      error: 'Verification failed. Please try again.',
    };
  }
}

/**
 * Set the current user's phone number
 */
export async function setCurrentUserPhone(phoneNumber: string, countryCode: string = '+1'): Promise<void> {
  try {
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    await AsyncStorage.setItem('user_phone_number', fullPhoneNumber);
    console.log('User phone number set:', fullPhoneNumber);
  } catch (error) {
    console.error('Error setting user phone number:', error);
  }
}

/**
 * Get the current user's phone number
 */
export async function getCurrentUserPhone(): Promise<string | null> {
  try {
    const phoneNumber = await AsyncStorage.getItem('user_phone_number');
    return phoneNumber;
  } catch (error) {
    console.error('Error getting user phone number:', error);
    return null;
  }
}

/**
 * Check if the current user's phone is verified
 */
export async function isPhoneVerified(): Promise<boolean> {
  try {
    const verified = await AsyncStorage.getItem('phone_verified');
    return verified === 'true';
  } catch (error) {
    console.error('Error checking phone verification status:', error);
    return false;
  }
}

/**
 * Clear phone verification status (for logout)
 */
export async function clearPhoneVerification(): Promise<void> {
  try {
    await AsyncStorage.removeItem('phone_verified');
    await AsyncStorage.removeItem('user_phone_number');
    console.log('Phone verification cleared');
  } catch (error) {
    console.error('Error clearing phone verification:', error);
  }
}
