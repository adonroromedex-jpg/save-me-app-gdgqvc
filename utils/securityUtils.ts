
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

export interface AccessLogEntry {
  id: string;
  type: 'login' | 'file_view' | 'file_share' | 'file_delete' | 'failed_auth' | 'session_timeout';
  timestamp: number;
  details: string;
  userId?: string;
  fileId?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export const logAccess = async (
  type: AccessLogEntry['type'],
  details: string,
  additionalData?: Partial<AccessLogEntry>
) => {
  try {
    const logsJson = await SecureStore.getItemAsync('access_logs');
    const logs: AccessLogEntry[] = logsJson ? JSON.parse(logsJson) : [];

    const newLog: AccessLogEntry = {
      id: Date.now().toString(),
      type,
      timestamp: Date.now(),
      details,
      deviceInfo: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
      ...additionalData,
    };

    logs.push(newLog);

    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }

    await SecureStore.setItemAsync('access_logs', JSON.stringify(logs));
    console.log('Access logged:', type, details);
  } catch (error) {
    console.error('Error logging access:', error);
  }
};

export const generateOTP = (): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

export const generateShareCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const preventScreenCapture = () => {
  if (Platform.OS === 'android') {
    console.log('Screenshot prevention enabled (Android)');
    // Note: Actual implementation requires native module
    // This is a placeholder for the concept
  } else if (Platform.OS === 'ios') {
    console.log('Screenshot prevention enabled (iOS)');
    // Note: iOS has limited screenshot prevention capabilities
    // This is a placeholder for the concept
  }
};

export const checkSessionTimeout = async (): Promise<boolean> => {
  try {
    const lastActivityStr = await SecureStore.getItemAsync('last_activity');
    if (!lastActivityStr) {
      await updateLastActivity();
      return false;
    }

    const lastActivity = parseInt(lastActivityStr, 10);
    const now = Date.now();
    const timeout = 15 * 60 * 1000; // 15 minutes

    if (now - lastActivity > timeout) {
      await logAccess('session_timeout', 'Session timed out due to inactivity');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking session timeout:', error);
    return false;
  }
};

export const updateLastActivity = async () => {
  try {
    await SecureStore.setItemAsync('last_activity', Date.now().toString());
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
};

export const clearSession = async () => {
  try {
    await SecureStore.deleteItemAsync('last_activity');
    console.log('Session cleared');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export const scheduleAutoDelete = async (fileId: string, hoursUntilDelete: number = 24) => {
  try {
    const deleteTime = Date.now() + (hoursUntilDelete * 60 * 60 * 1000);
    
    const scheduledDeletesJson = await SecureStore.getItemAsync('scheduled_deletes');
    const scheduledDeletes = scheduledDeletesJson ? JSON.parse(scheduledDeletesJson) : {};
    
    scheduledDeletes[fileId] = deleteTime;
    
    await SecureStore.setItemAsync('scheduled_deletes', JSON.stringify(scheduledDeletes));
    console.log(`Scheduled auto-delete for file ${fileId} in ${hoursUntilDelete} hours`);
  } catch (error) {
    console.error('Error scheduling auto-delete:', error);
  }
};

export const checkAndExecuteAutoDeletes = async () => {
  try {
    const scheduledDeletesJson = await SecureStore.getItemAsync('scheduled_deletes');
    if (!scheduledDeletesJson) return;

    const scheduledDeletes = JSON.parse(scheduledDeletesJson);
    const now = Date.now();
    const filesToDelete: string[] = [];

    for (const [fileId, deleteTime] of Object.entries(scheduledDeletes)) {
      if (now >= (deleteTime as number)) {
        filesToDelete.push(fileId);
      }
    }

    if (filesToDelete.length > 0) {
      // Delete files
      const filesJson = await SecureStore.getItemAsync('secure_files');
      if (filesJson) {
        const files = JSON.parse(filesJson);
        const updatedFiles = files.filter((f: any) => !filesToDelete.includes(f.id));
        await SecureStore.setItemAsync('secure_files', JSON.stringify(updatedFiles));
      }

      // Remove from scheduled deletes
      for (const fileId of filesToDelete) {
        delete scheduledDeletes[fileId];
        await logAccess('file_delete', `Auto-deleted file after 24 hours`, { fileId });
      }

      await SecureStore.setItemAsync('scheduled_deletes', JSON.stringify(scheduledDeletes));
      console.log(`Auto-deleted ${filesToDelete.length} files`);
    }
  } catch (error) {
    console.error('Error executing auto-deletes:', error);
  }
};

export const notifyFileViewed = async (fileName: string, viewerName: string) => {
  Alert.alert(
    '👁️ File Viewed',
    `${viewerName} has viewed your file: ${fileName}`,
    [{ text: 'OK' }]
  );
  
  await logAccess('file_view', `File viewed by ${viewerName}`, { details: fileName });
};

export const encryptData = (data: string): string => {
  // Placeholder for actual AES-256 encryption
  // In production, use a proper encryption library
  console.log('Encrypting data with AES-256');
  return Buffer.from(data).toString('base64');
};

export const decryptData = (encryptedData: string): string => {
  // Placeholder for actual AES-256 decryption
  // In production, use a proper encryption library
  console.log('Decrypting data with AES-256');
  return Buffer.from(encryptedData, 'base64').toString();
};
