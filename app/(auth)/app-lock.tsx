
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import {
  authenticateWithBiometrics,
  verifyAppPIN,
  isBiometricAvailable,
  getAuthMethodName,
} from '@/utils/biometricAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AppLockScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [authMethodName, setAuthMethodName] = useState('Biometric Authentication');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    attemptBiometricAuth();
  }, []);

  const checkBiometricAvailability = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    
    if (available) {
      const methodName = await getAuthMethodName();
      setAuthMethodName(methodName);
    }
  };

  const attemptBiometricAuth = async () => {
    if (await isBiometricAvailable()) {
      const success = await authenticateWithBiometrics({
        promptMessage: 'Unlock Save Me',
        cancelLabel: 'Use PIN',
      });

      if (success) {
        console.log('Biometric auth successful, navigating to home');
        router.replace('/(tabs)/(home)/');
      }
    }
  };

  const handlePINSubmit = async () => {
    if (pin.length !== 6) {
      Alert.alert('Invalid PIN', 'Please enter a 6-digit PIN');
      return;
    }

    setLoading(true);
    const isValid = await verifyAppPIN(pin);
    setLoading(false);

    if (isValid) {
      console.log('PIN verified successfully, navigating to home');
      router.replace('/(tabs)/(home)/');
    } else {
      Alert.alert('Invalid PIN', 'The PIN you entered is incorrect');
      setPin('');
    }
  };

  const handleBiometricAuth = async () => {
    const success = await authenticateWithBiometrics({
      promptMessage: 'Unlock Save Me',
    });

    if (success) {
      console.log('Biometric auth successful, navigating to home');
      router.replace('/(tabs)/(home)/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <IconSymbol name="lock.shield.fill" color={colors.card} size={48} />
        </View>

        <Text style={styles.title}>Unlock Save Me</Text>
        <Text style={styles.subtitle}>
          Enter your PIN or use {authMethodName} to continue
        </Text>

        <View style={styles.pinContainer}>
          <TextInput
            style={[styles.pinInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter 6-digit PIN"
            placeholderTextColor={colors.textSecondary}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            autoFocus
            onSubmitEditing={handlePINSubmit}
          />

          <Pressable
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handlePINSubmit}
            disabled={loading || pin.length !== 6}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Verifying...' : 'Unlock'}
            </Text>
          </Pressable>
        </View>

        {biometricAvailable && (
          <>
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Pressable
              style={[styles.biometricButton, { borderColor: colors.primary }]}
              onPress={handleBiometricAuth}
            >
              <IconSymbol 
                name={Platform.OS === 'ios' ? 'faceid' : 'fingerprint'} 
                color={colors.primary} 
                size={24} 
              />
              <Text style={[styles.biometricButtonText, { color: colors.primary }]}>
                Use {authMethodName}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={[styles.securityNotice, { backgroundColor: colors.accent }]}>
        <IconSymbol name="shield.fill" color={colors.card} size={20} />
        <Text style={styles.securityNoticeText}>
          Your data is protected with end-to-end encryption
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  pinContainer: {
    width: '100%',
    marginBottom: 24,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 16,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    width: '100%',
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  securityNoticeText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
});
