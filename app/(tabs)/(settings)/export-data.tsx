
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

export default function ExportDataScreen() {
  const [exporting, setExporting] = useState(false);

  const handleExportAll = async () => {
    try {
      setExporting(true);

      // Get all data from AsyncStorage
      const userData = await AsyncStorage.getItem('user_data');
      const protectedItems = await AsyncStorage.getItem('protected_items');
      const settings = await AsyncStorage.getItem('app_settings');

      const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        userData: userData ? JSON.parse(userData) : null,
        protectedItems: protectedItems ? JSON.parse(protectedItems) : [],
        settings: settings ? JSON.parse(settings) : {},
      };

      // In a real app, you would save this to a file or share it
      console.log('Export data:', exportData);

      Alert.alert(
        'Export Complete',
        'Your data has been prepared for export. In the full version, this will be saved as a file.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    {
      title: 'Export All Data',
      description: 'Export all your protected content, settings, and account data',
      icon: 'arrow.down.doc.fill',
      color: colors.primary,
      action: handleExportAll,
    },
    {
      title: 'Export Protected Content',
      description: 'Export only your protected photos and videos',
      icon: 'photo.stack.fill',
      color: colors.secondary,
      action: () => Alert.alert('Coming Soon', 'This feature will be available soon'),
    },
    {
      title: 'Export Settings',
      description: 'Export your app preferences and security settings',
      icon: 'gear',
      color: colors.accent,
      action: () => Alert.alert('Coming Soon', 'This feature will be available soon'),
    },
    {
      title: 'Export Access Logs',
      description: 'Export your complete access history',
      icon: 'list.bullet.clipboard.fill',
      color: colors.highlight,
      action: () => Alert.alert('Coming Soon', 'This feature will be available soon'),
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Export Data',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Export Your Data</Text>
            <Text style={styles.subtitle}>
              Download a copy of your data for backup or transfer
            </Text>
          </View>

          {exportOptions.map((option, index) => (
            <Pressable
              key={index}
              style={[styles.optionCard, { backgroundColor: colors.card }]}
              onPress={option.action}
              disabled={exporting}
            >
              <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                <IconSymbol name={option.icon} size={28} color="#ffffff" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}

          <View style={[styles.infoCard, { backgroundColor: colors.warning }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#ffffff" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Important Notice</Text>
              <Text style={styles.infoText}>
                Exported data will be encrypted. Keep your export files secure and never share them with untrusted parties.
              </Text>
            </View>
          </View>

          <View style={[styles.gdprCard, { backgroundColor: colors.primary }]}>
            <IconSymbol name="checkmark.shield.fill" size={24} color="#ffffff" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>GDPR Compliant</Text>
              <Text style={styles.infoText}>
                You have the right to access, export, and delete your personal data at any time.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  gdprCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#ffffff',
    lineHeight: 18,
    opacity: 0.95,
  },
});
