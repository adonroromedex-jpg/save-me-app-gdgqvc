
import { Platform } from 'react-native';

export interface WatermarkConfig {
  userId: string;
  timestamp: number;
  shareId?: string;
  text?: string;
}

// Generate watermark text
export const generateWatermarkText = (config: WatermarkConfig): string => {
  const date = new Date(config.timestamp);
  const dateStr = date.toLocaleString();
  
  let watermark = `User: ${config.userId}\n${dateStr}`;
  
  if (config.shareId) {
    watermark += `\nShare: ${config.shareId}`;
  }
  
  if (config.text) {
    watermark += `\n${config.text}`;
  }
  
  return watermark;
};

// Apply watermark styling
export const getWatermarkStyle = () => {
  return {
    position: 'absolute' as const,
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
  };
};

// Get watermark text style
export const getWatermarkTextStyle = () => {
  return {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  };
};

// Check if watermark should be visible
export const shouldShowWatermark = (secureMode: boolean): boolean => {
  return secureMode;
};

// Generate watermark for screenshot detection
export const generateScreenshotWatermark = (userId: string): string => {
  return `⚠️ SCREENSHOT DETECTED\nUser: ${userId}\n${new Date().toLocaleString()}`;
};
