
import * as SecureStore from 'expo-secure-store';

export interface EventLog {
  id: string;
  type: 'share.create' | 'share.open' | 'share.revoke' | 'screenshot.detected' | 'access.denied' | 'otp.verified' | 'otp.failed';
  userId: string;
  shareId?: string;
  timestamp: number;
  details: string;
  metadata?: Record<string, any>;
}

const EVENT_LOG_KEY = 'event_logs';
const MAX_LOGS = 500;

// Log an event
export const logEvent = async (event: Omit<EventLog, 'id'>): Promise<void> => {
  try {
    const logsJson = await SecureStore.getItemAsync(EVENT_LOG_KEY);
    const logs: EventLog[] = logsJson ? JSON.parse(logsJson) : [];
    
    const newEvent: EventLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...event,
    };
    
    logs.push(newEvent);
    
    // Keep only the most recent logs
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    
    await SecureStore.setItemAsync(EVENT_LOG_KEY, JSON.stringify(logs));
    console.log(`Event logged: ${event.type}`, event.details);
  } catch (error) {
    console.error('Error logging event:', error);
  }
};

// Get all events
export const getEvents = async (): Promise<EventLog[]> => {
  try {
    const logsJson = await SecureStore.getItemAsync(EVENT_LOG_KEY);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

// Get events by type
export const getEventsByType = async (type: EventLog['type']): Promise<EventLog[]> => {
  const allEvents = await getEvents();
  return allEvents.filter(event => event.type === type);
};

// Get events by share ID
export const getEventsByShareId = async (shareId: string): Promise<EventLog[]> => {
  const allEvents = await getEvents();
  return allEvents.filter(event => event.shareId === shareId);
};

// Get events by user ID
export const getEventsByUserId = async (userId: string): Promise<EventLog[]> => {
  const allEvents = await getEvents();
  return allEvents.filter(event => event.userId === userId);
};

// Get recent events
export const getRecentEvents = async (limit: number = 50): Promise<EventLog[]> => {
  const allEvents = await getEvents();
  return allEvents.slice(-limit).reverse();
};

// Clear all events
export const clearEvents = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(EVENT_LOG_KEY);
    console.log('All events cleared');
  } catch (error) {
    console.error('Error clearing events:', error);
  }
};

// Export events as JSON
export const exportEvents = async (): Promise<string> => {
  const events = await getEvents();
  return JSON.stringify(events, null, 2);
};

// Get event statistics
export const getEventStatistics = async (): Promise<{
  total: number;
  byType: Record<string, number>;
  recentActivity: EventLog[];
}> => {
  const events = await getEvents();
  
  const byType: Record<string, number> = {};
  events.forEach(event => {
    byType[event.type] = (byType[event.type] || 0) + 1;
  });
  
  return {
    total: events.length,
    byType,
    recentActivity: events.slice(-10).reverse(),
  };
};
