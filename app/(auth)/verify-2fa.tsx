
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export default function Verify2FAScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'email' | 'authenticator'>('email');
  const [sentCode, setSentCode] = useState('');
  const [maskedContact, setMaskedContact] = useState('');

  useEffect(() => {
    load2FASettings();
  }, []);

  const load2FASettings = async () => {
    try {
      const settingsJson = await SecureStore.getItemAsync('2fa_settings');
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        setTwoFactorMethod(settings.method);

        // Send verification code if not using authenticator
        if (settings.method !== 'authenticator') {
          await sendVerificationCode(settings);
        }

        // Set masked contact info
        if (settings.method === 'sms' && settings.phoneNumber) {
          const masked = settings.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
          setMaskedContact(masked);
        } else if (settings.method === 'email' && settings.email) {
          const [username, domain] = settings.email.split('@');
          const masked = `${username.substring(0, 2)}***@${domain}`;
          setMaskedContact(masked);
        }
      }
    } catch (error) {
      console.error('Error loading 2FA settings:', error);
    }
  };

  const sendVerificationCode = async (settings: any) => {
    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);

      // Store temporarily for verification
      await AsyncStorage.setItem('temp_2fa_code', code);

      // In a real app, send via SMS/Email service
      console.log(`2FA code sent to ${settings.method}: ${code}`);

      // For demo purposes, show the code in console
      console.log(`Verification code: ${code}`);
    } catch (error) {
      console.error('Error sending verification code:', error);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Verification code must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      let isValid = false;

      if (twoFactorMethod === 'authenticator') {
        // For authenticator, simulate TOTP verification
        // In production, use a library like 'otplib' to verify TOTP codes
        const settingsJson = await SecureStore.getItemAsync('2fa_settings');
        if (settingsJson) {
          const settings = JSON.parse(settingsJson);
          // Simplified validation - in production, verify against TOTP algorithm
          isValid = verificationCode.length === 6 && /^\d+$/.test(verificationCode);
        }
      } else {
        // For SMS/Email, verify against the sent code
        const storedCode = await AsyncStorage.getItem('temp_2fa_code');
        isValid = verificationCode === storedCode;
      }

      if (isValid) {
        // Clear temporary code
        await AsyncStorage.removeItem('temp_2fa_code');

        // Mark as authenticated
        await AsyncStorage.setItem('is_authenticated', 'true');
        
        // Navigate to home
        router.replace('/(tabs)/(home)/');
      } else {
        Alert.alert('Error', 'Invalid verification code. Please try again.');
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      Alert.alert('Error', 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (twoFactorMethod === 'authenticator') {
      Alert.alert('Info', 'Authenticator codes are time-based and refresh automatically.');
      return;
    }

    setLoading(true);
    try {
      const settingsJson = await SecureStore.getItemAsync('2fa_settings');
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        await sendVerificationCode(settings);
        Alert.alert('Success', 'A new verification code has been sent.');
      }
    } catch (error) {
      console.error('Error resending code:', error);
      Alert.alert('Error', 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = () => {
    switch (twoFactorMethod) {
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

  const getMethodTitle = () => {
    switch (twoFactorMethod) {
      case 'sms':
        return 'SMS Verification';
      case 'email':
        return 'Email Verification';
      case 'authenticator':
        return 'Authenticator Code';
      default:
        return 'Two-Factor Authentication';
    }
  };

  const getMethodDescription = () => {
    switch (twoFactorMethod) {
      case 'sms':
        return `Enter the 6-digit code sent to ${maskedContact}`;
      case 'email':
        return `Enter the 6-digit code sent to ${maskedContact}`;
      case 'authenticator':
        return 'Enter the 6-digit code from your authenticator app';
      default:
        return 'Enter your verification code';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <IconSymbol name={getMethodIcon()} size={60} color="#ffffff" />
          </View>
          <Text style={styles.title}>{getMethodTitle()}</Text>
          <Text style={styles.subtitle}>{getMethodDescription()}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#999999"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </Pressable>

          {twoFactorMethod !== 'authenticator' && (
            <Pressable
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={loading}
            >
              <Text style={styles.resendButtonText}>Resend Code</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <IconSymbol name="checkmark.shield.fill" size={24} color={colors.primary} />
          <Text style={styles.footerText}>
            Your account is protected with two-factor authentication
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 24,
    color: colors.text,
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
});
