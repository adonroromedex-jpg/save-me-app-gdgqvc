
import * as Crypto from 'expo-crypto';

/**
 * Generate a random secret key for TOTP (Time-based One-Time Password)
 * In production, use a proper library like 'otplib'
 */
export const generate2FASecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 characters
  let secret = '';
  
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return secret;
};

/**
 * Generate QR code data for authenticator apps
 * Format: otpauth://totp/ISSUER:ACCOUNT?secret=SECRET&issuer=ISSUER
 */
export const generateQRCodeData = (
  secret: string,
  accountName: string,
  issuer: string = 'Save Me'
): string => {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}`;
};

/**
 * Generate a 6-digit verification code
 */
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Verify TOTP code (simplified version)
 * In production, use a proper library like 'otplib' that implements RFC 6238
 */
export const verifyTOTP = (code: string, secret: string): boolean => {
  // This is a simplified placeholder
  // In production, implement proper TOTP verification using:
  // 1. Current Unix timestamp
  // 2. Time step (usually 30 seconds)
  // 3. HMAC-SHA1 algorithm
  // 4. Dynamic truncation
  
  // For now, just validate format
  return code.length === 6 && /^\d+$/.test(code);
};

/**
 * Hash a verification code for secure storage
 */
export const hashCode = async (code: string): Promise<string> => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    code
  );
  return digest;
};

/**
 * Verify a code against its hash
 */
export const verifyCodeHash = async (code: string, hash: string): Promise<boolean> => {
  const codeHash = await hashCode(code);
  return codeHash === hash;
};

/**
 * Generate a backup code (for account recovery)
 */
export const generateBackupCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) {
      code += '-';
    }
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return code;
};

/**
 * Generate multiple backup codes
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    codes.push(generateBackupCode());
  }
  
  return codes;
};

/**
 * Mask phone number for display
 * Example: +1 (555) 123-4567 -> +1 (555) ***-4567
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
};

/**
 * Mask email for display
 * Example: user@example.com -> us***@example.com
 */
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username}***@${domain}`;
  }
  return `${username.substring(0, 2)}***@${domain}`;
};
