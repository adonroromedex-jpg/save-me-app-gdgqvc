
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles } from "@/styles/commonStyles";
import { getRecentEvents, getEventStatistics, clearEvents, exportEvents, EventLog } from "@/utils/eventLogger";

export default function AccessLogScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const recentEvents = await getRecentEvents(50);
      const statistics = await getEventStatistics();
      
      setEvents(recentEvents);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const exported = await exportEvents();
      Alert.alert('Export Events', `${events.length} events exported to JSON`, [
        { text: 'OK' }
      ]);
      console.log('Exported events:', exported);
    } catch (error) {
      console.error('Error exporting events:', error);
      Alert.alert('Error', 'Failed to export events');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear All Logs',
      'Are you sure you want to clear all access logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearEvents();
              await loadEvents();
              Alert.alert('Success', 'All logs cleared');
            } catch (error) {
              console.error('Error clearing events:', error);
              Alert.alert('Error', 'Failed to clear logs');
            }
          }
        }
      ]
    );
  };

  const getEventIcon = (type: EventLog['type']): string => {
    switch (type) {
      case 'share.create': return 'square.and.arrow.up.fill';
      case 'share.open': return 'lock.open.fill';
      case 'share.revoke': return 'xmark.circle.fill';
      case 'screenshot.detected': return 'camera.fill';
      case 'access.denied': return 'exclamationmark.shield.fill';
      case 'otp.verified': return 'checkmark.shield.fill';
      case 'otp.failed': return 'xmark.shield.fill';
      default: return 'doc.text.fill';
    }
  };

  const getEventColor = (type: EventLog['type']): string => {
    switch (type) {
      case 'share.create': return colors.success;
      case 'share.open': return colors.accent;
      case 'share.revoke': return colors.warning;
      case 'screenshot.detected': return colors.danger;
      case 'access.denied': return colors.danger;
      case 'otp.verified': return colors.success;
      case 'otp.failed': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  const formatEventType = (type: EventLog['type']): string => {
    return type.split('.').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderHeaderRight = () => (
    <View style={styles.headerButtons}>
      <Pressable
        onPress={handleExport}
        style={styles.headerButtonContainer}
      >
        <IconSymbol name="square.and.arrow.up" color={colors.primary} />
      </Pressable>
      <Pressable
        onPress={handleClear}
        style={styles.headerButtonContainer}
      >
        <IconSymbol name="trash" color={colors.danger} />
      </Pressable>
    </View>
  );

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
            headerRight: renderHeaderRight,
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
            <View style={[styles.iconContainer, { backgroundColor: colors.highlight }]}>
              <IconSymbol name="doc.text.fill" color={colors.card} size={32} />
            </View>
            <Text style={commonStyles.title}>Access Log</Text>
            <Text style={commonStyles.subtitle}>
              Complete audit trail of all security events
            </Text>
          </View>

          {stats && (
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Events</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.byType['share.create'] || 0}</Text>
                <Text style={styles.statLabel}>Shares Created</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.byType['screenshot.detected'] || 0}</Text>
                <Text style={styles.statLabel}>Screenshots</Text>
              </View>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="doc.text" color={colors.textSecondary} size={64} />
              <Text style={styles.emptyTitle}>No Events Yet</Text>
              <Text style={styles.emptyDescription}>
                All security events will be logged here for audit purposes
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {events.map((event) => (
                <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.eventIcon, { backgroundColor: getEventColor(event.type) }]}>
                    <IconSymbol name={getEventIcon(event.type) as any} color={colors.card} size={20} />
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventType}>{formatEventType(event.type)}</Text>
                    <Text style={styles.eventDetails}>{event.details}</Text>
                    <View style={styles.eventMeta}>
                      <Text style={styles.eventTime}>{formatTimestamp(event.timestamp)}</Text>
                      {event.shareId && (
                        <Text style={styles.eventShareId}>• {event.shareId.substring(0, 12)}...</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={[styles.infoCard, { backgroundColor: colors.accent }]}>
            <IconSymbol name="shield.fill" color={colors.card} size={24} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Security Audit</Text>
              <Text style={styles.infoText}>
                All events are logged locally and encrypted. Export logs for external audit or compliance purposes.
              </Text>
            </View>
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
  headerButtons: {
    flexDirection: 'row',
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
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  eventDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  eventShareId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.card,
    lineHeight: 20,
  },
});
