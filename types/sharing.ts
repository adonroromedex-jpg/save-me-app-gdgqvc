
export interface SecureShare {
  id: string;
  fileId: string;
  fileName: string;
  fileUri: string;
  fileType: 'image' | 'video';
  senderId: string;
  senderName: string;
  createdAt: number;
  expiresAt: number;
  duration: '1h' | '24h' | '7d' | 'custom';
  requireOTP: boolean;
  otpHash?: string;
  qrCode?: string;
  wrappedKey: string;
  publicKey: string;
  status: 'active' | 'revoked' | 'expired';
  accessCount: number;
  maxAccess?: number;
  metadata: {
    encrypted: boolean;
    iv: string;
    tag: string;
  };
}

export interface ShareAccess {
  shareId: string;
  accessedBy: string;
  accessedAt: number;
  ipAddress?: string;
  deviceInfo?: string;
}

export interface ShareCreateRequest {
  fileId: string;
  fileName: string;
  fileUri: string;
  fileType: 'image' | 'video';
  duration: '1h' | '24h' | '7d' | 'custom';
  customDuration?: number;
  requireOTP: boolean;
  maxAccess?: number;
}

export interface ShareOpenRequest {
  shareId: string;
  otp?: string;
  userId: string;
}

export interface ShareRevokeRequest {
  shareId: string;
  userId: string;
}
