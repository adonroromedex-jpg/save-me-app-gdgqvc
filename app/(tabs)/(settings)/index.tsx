
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);
  const [screenshotProtection, setScreenshotProtection] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotificationsEnabled(parsed.notifications ?? true);
        setBiometricEnabled(parsed.biometric ?? true);
        setAutoDeleteEnabled(parsed.autoDelete ?? true);
        setScreenshotProtection(parsed.screenshotProtection ?? true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key: string, value: boolean) => {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed[key] = value;
      await AsyncStorage.setItem('app_settings', JSON.stringify(parsed));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.setItem('is_authenticated', 'false');
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/(auth)/onboarding');
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: 'Security',
      items: [
        {
          icon: 'faceid',
          label: 'Biometric Authentication',
          value: biometricEnabled,
          onToggle: (value: boolean) => {
            setBiometricEnabled(value);
            saveSettings('biometric', value);
          },
          color: colors.primary,
        },
        {
          icon: 'timer',
          label: 'Auto-Delete (24h)',
          value: autoDeleteEnabled,
          onToggle: (value: boolean) => {
            setAutoDeleteEnabled(value);
            saveSettings('autoDelete', value);
          },
          color: colors.accent,
        },
        {
          icon: 'eye.slash.fill',
          label: 'Screenshot Protection',
          value: screenshotProtection,
          onToggle: (value: boolean) => {
            setScreenshotProtection(value);
            saveSettings('screenshotProtection', value);
          },
          color: colors.secondary,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'bell.fill',
          label: 'Enable Notifications',
          value: notificationsEnabled,
          onToggle: (value: boolean) => {
            setNotificationsEnabled(value);
            saveSettings('notifications', value);
          },
          color: colors.highlight,
        },
      ],
    },
  ];

  const menuItems = [
    {
      icon: 'globe',
      label: 'Language',
      route: '/(tabs)/(settings)/language',
      color: colors.primary,
    },
    {
      icon: 'paintbrush.fill',
      label: 'Theme',
      route: '/(tabs)/(settings)/theme',
      color: colors.secondary,
    },
    {
      icon: 'arrow.down.doc.fill',
      label: 'Export Data',
      route: '/(tabs)/(settings)/export-data',
      color: colors.accent,
    },
    {
      icon: 'questionmark.circle.fill',
      label: 'Help & Support',
      route: '/(tabs)/(settings)/help',
      color: colors.textSecondary,
    },
  ];

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Settings',
          }}
        />
      )}
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your app preferences and security</Text>
          </View>

          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                {section.items.map((item, itemIndex) => (
                  <React.Fragment key={itemIndex}>
                    <View style={styles.settingItem}>
                      <View style={styles.settingLeft}>
                        <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                          <IconSymbol name={item.icon} color="#ffffff" size={20} />
                        </View>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                      </View>
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: colors.border, true: item.color }}
                        thumbColor="#ffffff"
                      />
                    </View>
                    {itemIndex < section.items.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                        <IconSymbol name={item.icon} color="#ffffff" size={20} />
                      </View>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                    </View>
                    <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
                  </Pressable>
                  {index < menuItems.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <Pressable
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleLogout}
            >
              <IconSymbol name="arrow.right.square.fill" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Logout</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.dangerButton, { backgroundColor: colors.danger }]}
              onPress={handleDeleteAccount}
            >
              <IconSymbol name="trash.fill" size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Delete Account</Text>
            </Pressable>
          </View>

          <Text style={styles.versionText}>Save Me v1.0.0</Text>
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
  scrollContentWithTabBar: {
    paddingBottom: 100,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  dangerButton: {
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
