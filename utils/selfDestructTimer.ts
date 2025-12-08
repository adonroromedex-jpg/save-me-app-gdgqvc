
import * as SecureStore from 'expo-secure-store';
import { logEvent } from './eventLogger';
import { SecureShare } from '../types/sharing';

export interface SelfDestructSchedule {
  shareId: string;
  destructAt: number;
  reason: 'expiration' | 'timer' | 'manual';
}

const SELF_DESTRUCT_KEY = 'self_destruct_schedules';
const SHARES_KEY = 'secure_shares';

// Schedule self-destruct for a share
export const scheduleSelfDestruct = async (
  shareId: string,
  hoursUntilDestruct: number = 24,
  reason: 'expiration' | 'timer' | 'manual' = 'timer'
): Promise<void> => {
  try {
    const destructAt = Date.now() + (hoursUntilDestruct * 60 * 60 * 1000);
    
    const schedulesJson = await SecureStore.getItemAsync(SELF_DESTRUCT_KEY);
    const schedules: SelfDestructSchedule[] = schedulesJson ? JSON.parse(schedulesJson) : [];
    
    // Remove existing schedule for this share if any
    const filteredSchedules = schedules.filter(s => s.shareId !== shareId);
    
    // Add new schedule
    filteredSchedules.push({
      shareId,
      destructAt,
      reason,
    });
    
    await SecureStore.setItemAsync(SELF_DESTRUCT_KEY, JSON.stringify(filteredSchedules));
    
    console.log(`Self-destruct scheduled for share ${shareId} in ${hoursUntilDestruct} hours`);
    
    await logEvent({
      type: 'share.create',
      userId: 'current_user',
      shareId,
      timestamp: Date.now(),
      details: `Self-destruct scheduled for ${hoursUntilDestruct} hours`,
      metadata: { destructAt, reason },
    });
  } catch (error) {
    console.error('Error scheduling self-destruct:', error);
    throw error;
  }
};

// Cancel self-destruct for a share
export const cancelSelfDestruct = async (shareId: string): Promise<void> => {
  try {
    const schedulesJson = await SecureStore.getItemAsync(SELF_DESTRUCT_KEY);
    if (!schedulesJson) return;
    
    const schedules: SelfDestructSchedule[] = JSON.parse(schedulesJson);
    const filteredSchedules = schedules.filter(s => s.shareId !== shareId);
    
    await SecureStore.setItemAsync(SELF_DESTRUCT_KEY, JSON.stringify(filteredSchedules));
    console.log(`Self-destruct cancelled for share ${shareId}`);
  } catch (error) {
    console.error('Error cancelling self-destruct:', error);
  }
};

// Execute self-destruct for a specific share
export const executeSelfDestruct = async (shareId: string): Promise<void> => {
  try {
    // Get all shares
    const sharesJson = await SecureStore.getItemAsync(SHARES_KEY);
    if (!sharesJson) return;
    
    const shares: SecureShare[] = JSON.parse(sharesJson);
    const share = shares.find(s => s.id === shareId);
    
    if (!share) return;
    
    // Mark share as expired/deleted
    share.status = 'expired';
    
    // Update shares
    await SecureStore.setItemAsync(SHARES_KEY, JSON.stringify(shares));
    
    // Delete private key
    await SecureStore.deleteItemAsync(`share_key_${shareId}`);
    
    // Remove from self-destruct schedule
    await cancelSelfDestruct(shareId);
    
    // Log event
    await logEvent({
      type: 'share.revoke',
      userId: share.senderId,
      shareId,
      timestamp: Date.now(),
      details: 'Share self-destructed',
    });
    
    console.log(`Share ${shareId} self-destructed`);
  } catch (error) {
    console.error('Error executing self-destruct:', error);
  }
};

// Check and execute pending self-destructs
export const checkAndExecuteSelfDestructs = async (): Promise<number> => {
  try {
    const schedulesJson = await SecureStore.getItemAsync(SELF_DESTRUCT_KEY);
    if (!schedulesJson) return 0;
    
    const schedules: SelfDestructSchedule[] = JSON.parse(schedulesJson);
    const now = Date.now();
    let destructedCount = 0;
    
    for (const schedule of schedules) {
      if (now >= schedule.destructAt) {
        await executeSelfDestruct(schedule.shareId);
        destructedCount++;
      }
    }
    
    if (destructedCount > 0) {
      console.log(`Executed ${destructedCount} self-destructs`);
    }
    
    return destructedCount;
  } catch (error) {
    console.error('Error checking self-destructs:', error);
    return 0;
  }
};

// Get time remaining until self-destruct
export const getTimeRemaining = async (shareId: string): Promise<number | null> => {
  try {
    const schedulesJson = await SecureStore.getItemAsync(SELF_DESTRUCT_KEY);
    if (!schedulesJson) return null;
    
    const schedules: SelfDestructSchedule[] = JSON.parse(schedulesJson);
    const schedule = schedules.find(s => s.shareId === shareId);
    
    if (!schedule) return null;
    
    const remaining = schedule.destructAt - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch (error) {
    console.error('Error getting time remaining:', error);
    return null;
  }
};

// Get all scheduled self-destructs
export const getAllScheduledDestructs = async (): Promise<SelfDestructSchedule[]> => {
  try {
    const schedulesJson = await SecureStore.getItemAsync(SELF_DESTRUCT_KEY);
    return schedulesJson ? JSON.parse(schedulesJson) : [];
  } catch (error) {
    console.error('Error getting scheduled destructs:', error);
    return [];
  }
};

// Format time remaining as human-readable string
export const formatTimeRemaining = (milliseconds: number): string => {
  if (milliseconds <= 0) return 'Expired';
  
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  
  return `${seconds}s`;
};
