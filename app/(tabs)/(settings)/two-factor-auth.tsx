
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { maskPhoneNumber, maskEmail } from '@/utils/twoFactorAuth';

export default function TwoFactorAuthSettingsScreen() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const [method, setMethod] = useState<'sms' | 'email' | 'authenticator' | null>(null);
  const [maskedContact, setMaskedContact] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('2fa_enabled');
      setIsEnabled(enabled === 'true');

      if (enabled === 'true') {
        const settingsJson = await SecureStore.getItemAsync('2fa_settings');
        if (settingsJson) {
          const settings = JSON.parse(settingsJson);
          setMethod(settings.method);

          if (settings.method === 'sms' && settings.phoneNumber) {
            setMaskedContact(maskPhoneNumber(settings.phoneNumber));
          } else if (settings.method === 'email' && settings.email) {
            setMaskedContact(maskEmail(settings.email));
          } else if (settings.method === 'authenticator') {
            setMaskedContact('Authenticator App');
          }
        }
      }
    } catch (error) {
      console.error('Error loading 2FA settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (value: boolean) => {
    if (value) {
      // Enable 2FA - navigate to setup
      router.push('/(auth)/setup-2fa');
    } else {
      // Disable 2FA
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                await AsyncStorage.setItem('2fa_enabled', 'false');
                await SecureStore.deleteItemAsync('2fa_settings');
                setIsEnabled(false);
                setMethod(null);
                setMaskedContact('');
                Alert.alert('Success', 'Two-factor authentication has been disabled');
              } catch (error) {
                console.error('Error disabling 2FA:', error);
                Alert.alert('Error', 'Failed to disable two-factor authentication');
              }
            },
          },
        ]
      );
    }
  };

  const handleChangeMethod = () => {
    Alert.alert(
      'Change 2FA Method',
      'To change your two-factor authentication method, you need to disable it first and then set it up again with a new method.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disable & Setup Again',
          onPress: async () => {
            await AsyncStorage.setItem('2fa_enabled', 'false');
            await SecureStore.deleteItemAsync('2fa_settings');
            setIsEnabled(false);
            setMethod(null);
            setMaskedContact('');
            router.push('/(auth)/setup-2fa');
          },
        },
      ]
    );
  };

  const getMethodIcon = () => {
    switch (method) {
      case 'sms':
        return 'message.fill';
      case 'email':
        return 'envelope.fill';
      case 'authenticator':
        return 'lock.shield.fill';
      default:
        return 'lock.fill';
    }
  };

  const getMethodName = () => {
    switch (method) {
      case 'sms':
        return 'SMS Verification';
      case 'email':
        return 'Email Verification';
      case 'authenticator':
        return 'Authenticator App';
      default:
        return 'Not Set';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <IconSymbol name="arrow.left" size={24} color={colors.text} />
      </Pressable>

      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <IconSymbol name="lock.shield.fill" size={48} color="#ffffff" />
        </View>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          Add an extra layer of security to your account
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <IconSymbol name="checkmark.shield.fill" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>2FA Status</Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle2FA}
            trackColor={{ false: '#e0e0e0', true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
        <Text style={styles.cardDescription}>
          {isEnabled
            ? 'Two-factor authentication is enabled'
            : 'Enable two-factor authentication for enhanced security'}
        </Text>
      </View>

      {isEnabled && method && (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <IconSymbol name={getMethodIcon()} size={24} color={colors.accent} />
                <Text style={styles.cardTitle}>Current Method</Text>
              </View>
            </View>
            <Text style={styles.methodName}>{getMethodName()}</Text>
            <Text style={styles.methodContact}>{maskedContact}</Text>
            <Pressable
              style={[styles.changeButton, { backgroundColor: colors.accent }]}
              onPress={handleChangeMethod}
            >
              <Text style={styles.changeButtonText}>Change Method</Text>
            </Pressable>
          </View>

          <View style={styles.infoCard}>
            <IconSymbol name="info.circle.fill" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                When you sign in, you&apos;ll need to enter a verification code in addition to your password. This ensures that only you can access your account, even if someone knows your password.
              </Text>
            </View>
          </View>
        </>
      )}

      {!isEnabled && (
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits of 2FA</Text>
          
          <View style={styles.benefitItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <Text style={styles.benefitText}>
              Enhanced account security
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <Text style={styles.benefitText}>
              Protection against unauthorized access
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <Text style={styles.benefitText}>
              Peace of mind for your sensitive data
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
            <Text style={styles.benefitText}>
              Multiple verification methods available
            </Text>
          </View>

          <Pressable
            style={[styles.setupButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/setup-2fa')}
          >
            <Text style={styles.setupButtonText}>Setup Two-Factor Authentication</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  methodContact: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  changeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  setupButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  setupButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
