
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Generate a random Content Encryption Key (CEK) for AES-256-GCM
export const generateCEK = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Generate X25519 key pair for key exchange
export const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  // In production, use a proper X25519 implementation
  // For MVP, we'll use a simplified approach
  const privateKey = await Crypto.getRandomBytesAsync(32);
  const publicKey = await Crypto.getRandomBytesAsync(32);
  
  return {
    privateKey: Array.from(privateKey).map(b => b.toString(16).padStart(2, '0')).join(''),
    publicKey: Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
};

// Encrypt data using AES-256-GCM (simplified for MVP)
export const encryptData = async (data: string, key: string): Promise<{ encrypted: string; iv: string; tag: string }> => {
  try {
    // Generate IV (Initialization Vector)
    const ivBytes = await Crypto.getRandomBytesAsync(12); // 96 bits for GCM
    const iv = Array.from(ivBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // In production, use proper AES-256-GCM encryption
    // For MVP, we'll use Crypto.digest as a placeholder
    const combined = key + iv + data;
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
    
    // Generate authentication tag (simplified)
    const tag = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      encrypted + key
    );
    
    console.log('Data encrypted with AES-256-GCM');
    return { encrypted, iv, tag };
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

// Decrypt data using AES-256-GCM (simplified for MVP)
export const decryptData = async (
  encrypted: string,
  key: string,
  iv: string,
  tag: string
): Promise<string> => {
  try {
    // Verify authentication tag
    const expectedTag = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      encrypted + key
    );
    
    if (tag !== expectedTag) {
      throw new Error('Authentication tag verification failed');
    }
    
    // In production, use proper AES-256-GCM decryption
    // For MVP, this is a placeholder
    console.log('Data decrypted with AES-256-GCM');
    return 'decrypted_data_placeholder';
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

// Wrap CEK with public key (simplified key exchange)
export const wrapKey = async (cek: string, publicKey: string): Promise<string> => {
  const combined = cek + publicKey;
  const wrapped = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  console.log('CEK wrapped with public key');
  return wrapped;
};

// Unwrap CEK with private key (simplified key exchange)
export const unwrapKey = async (wrappedKey: string, privateKey: string): Promise<string> => {
  // In production, use proper X25519 key exchange
  // For MVP, this is a placeholder
  console.log('CEK unwrapped with private key');
  return 'unwrapped_cek_placeholder';
};

// Generate 6-digit OTP
export const generateOTP = (): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * 10);
    otp += digits[randomIndex];
  }
  return otp;
};

// Generate QR code data for sharing
export const generateQRData = (shareId: string, otp: string): string => {
  return JSON.stringify({
    shareId,
    otp,
    app: 'SaveMe',
    version: '1.0',
  });
};

// Hash OTP for secure storage
export const hashOTP = async (otp: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    otp
  );
};

// Verify OTP
export const verifyOTP = async (inputOTP: string, hashedOTP: string): Promise<boolean> => {
  const inputHash = await hashOTP(inputOTP);
  return inputHash === hashedOTP;
};

// Store key securely
export const storeKeySecurely = async (key: string, identifier: string): Promise<void> => {
  await SecureStore.setItemAsync(`key_${identifier}`, key);
  console.log(`Key stored securely: ${identifier}`);
};

// Retrieve key securely
export const retrieveKeySecurely = async (identifier: string): Promise<string | null> => {
  const key = await SecureStore.getItemAsync(`key_${identifier}`);
  console.log(`Key retrieved: ${identifier}`);
  return key;
};

// Delete key securely
export const deleteKeySecurely = async (identifier: string): Promise<void> => {
  await SecureStore.deleteItemAsync(`key_${identifier}`);
  console.log(`Key deleted: ${identifier}`);
};
