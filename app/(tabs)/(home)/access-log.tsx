
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as SecureStore from 'expo-secure-store';

interface AccessLogEntry {
  id: string;
  type: 'login' | 'file_view' | 'file_share' | 'file_delete' | 'failed_auth';
  timestamp: number;
  details: string;
  userId?: string;
  fileId?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

export default function AccessLogScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [logs, setLogs] = useState<AccessLogEntry[]>([]);

  useEffect(() => {
    loadAccessLogs();
  }, []);

  const loadAccessLogs = async () => {
    try {
      const logsJson = await SecureStore.getItemAsync('access_logs');
      if (logsJson) {
        const allLogs: AccessLogEntry[] = JSON.parse(logsJson);
        // Sort by most recent first
        allLogs.sort((a, b) => b.timestamp - a.timestamp);
        setLogs(allLogs);
        console.log('Loaded access logs:', allLogs.length);
      } else {
        // Create demo logs for testing
        const demoLogs: AccessLogEntry[] = [
          {
            id: '1',
            type: 'login',
            timestamp: Date.now() - 3600000,
            details: 'Successful login with biometric authentication',
            deviceInfo: 'iPhone 14 Pro',
          },
          {
            id: '2',
            type: 'file_view',
            timestamp: Date.now() - 7200000,
            details: 'Viewed shared photo from alice_secure',
            fileId: 'file_123',
          },
          {
            id: '3',
            type: 'file_share',
            timestamp: Date.now() - 86400000,
            details: 'Shared video with bob_private',
            fileId: 'file_456',
          },
        ];
        await SecureStore.setItemAsync('access_logs', JSON.stringify(demoLogs));
        setLogs(demoLogs);
      }
    } catch (error) {
      console.error('Error loading access logs:', error);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'login':
        return 'person.fill.checkmark';
      case 'file_view':
        return 'eye.fill';
      case 'file_share':
        return 'paperplane.fill';
      case 'file_delete':
        return 'trash.fill';
      case 'failed_auth':
        return 'exclamationmark.triangle.fill';
      default:
        return 'info.circle.fill';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'login':
        return colors.success;
      case 'file_view':
        return colors.primary;
      case 'file_share':
        return colors.accent;
      case 'file_delete':
        return colors.danger;
      case 'failed_auth':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getLogTypeLabel = (type: string) => {
    switch (type) {
      case 'login':
        return 'Login';
      case 'file_view':
        return 'File Viewed';
      case 'file_share':
        return 'File Shared';
      case 'file_delete':
        return 'File Deleted';
      case 'failed_auth':
        return 'Failed Auth';
      default:
        return 'Activity';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => router.back()}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="chevron.left" color={colors.primary} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Access Log",
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="doc.text.fill" color={colors.card} size={32} />
            </View>
            <Text style={commonStyles.title}>Access Log</Text>
            <Text style={commonStyles.subtitle}>
              Complete history of all access attempts and activities
            </Text>
          </View>

          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{logs.length}</Text>
              <Text style={styles.statLabel}>Total Events</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {logs.filter(l => l.type === 'login').length}
              </Text>
              <Text style={styles.statLabel}>Logins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {logs.filter(l => l.type === 'failed_auth').length}
              </Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>

          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="doc.text.fill" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyTitle}>No Activity Yet</Text>
              <Text style={styles.emptyDescription}>
                Your access log will appear here as you use the app
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {logs.map((log) => (
                <View
                  key={log.id}
                  style={[styles.logCard, { backgroundColor: colors.card }]}
                >
                  <View style={[styles.logIcon, { backgroundColor: getLogColor(log.type) }]}>
                    <IconSymbol name={getLogIcon(log.type)} color={colors.card} size={20} />
                  </View>
                  <View style={styles.logContent}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logType}>{getLogTypeLabel(log.type)}</Text>
                      <Text style={styles.logTime}>{formatTimestamp(log.timestamp)}</Text>
                    </View>
                    <Text style={styles.logDetails}>{log.details}</Text>
                    {log.deviceInfo && (
                      <View style={styles.logMeta}>
                        <IconSymbol name="iphone" color={colors.textSecondary} size={12} />
                        <Text style={styles.logMetaText}>{log.deviceInfo}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={[styles.infoCard, { backgroundColor: colors.accent }]}>
            <IconSymbol name="info.circle.fill" color={colors.card} size={24} />
            <Text style={styles.infoText}>
              Access logs are stored securely and encrypted. They help you monitor all activity on your account.
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerButtonContainer: {
    padding: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  logCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  logTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  logDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  logMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.card,
    marginLeft: 12,
    lineHeight: 20,
  },
});
