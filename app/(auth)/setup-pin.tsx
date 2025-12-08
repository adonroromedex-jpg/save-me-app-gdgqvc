
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { setAppPIN } from '@/utils/biometricAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SetupPINScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);

  const handleCreatePin = () => {
    if (pin.length !== 6) {
      Alert.alert('Invalid PIN', 'Please enter a 6-digit PIN');
      return;
    }

    setStep('confirm');
  };

  const handleConfirmPin = async () => {
    if (confirmPin !== pin) {
      Alert.alert('PIN Mismatch', 'The PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }

    setLoading(true);
    const success = await setAppPIN(pin);
    setLoading(false);

    if (success) {
      // Mark all onboarding steps as complete
      await AsyncStorage.setItem('pin_setup_complete', 'true');
      await AsyncStorage.setItem('onboarding_complete', 'true');
      await AsyncStorage.setItem('is_authenticated', 'true');
      
      console.log('PIN setup complete, all onboarding finished');
      
      Alert.alert(
        'Success!',
        'Your PIN has been set successfully. Welcome to SaveMe!',
        [
          {
            text: 'Continue',
            onPress: () => {
              console.log('Navigating to home');
              // Navigate to home - the _layout will handle the app-lock requirement
              router.replace('/(tabs)/(home)/');
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Failed to set PIN. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={styles.stepIndicator}>Step 3 of 3</Text>
        </View>

        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <IconSymbol name="lock.fill" size={60} color="#ffffff" />
          </View>
          <Text style={styles.title}>
            {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'create'
              ? 'Enter a 6-digit PIN to secure your app'
              : 'Re-enter your PIN to confirm'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <IconSymbol name="lock.fill" size={20} color="rgba(255, 255, 255, 0.7)" />
            <TextInput
              style={styles.input}
              placeholder={step === 'create' ? 'Enter PIN' : 'Confirm PIN'}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={step === 'create' ? pin : confirmPin}
              onChangeText={step === 'create' ? setPin : setConfirmPin}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
              autoFocus
            />
          </View>

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={step === 'create' ? handleCreatePin : handleConfirmPin}
            disabled={loading || (step === 'create' ? pin.length !== 6 : confirmPin.length !== 6)}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Setting up...' : step === 'create' ? 'Continue' : 'Confirm PIN'}
            </Text>
          </Pressable>

          {step === 'confirm' && (
            <Pressable
              style={styles.backButton}
              onPress={() => {
                setStep('create');
                setConfirmPin('');
              }}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.securityInfo, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <IconSymbol name="shield.fill" size={24} color={colors.success} />
          <View style={styles.securityInfoContent}>
            <Text style={styles.securityInfoTitle}>Security Features</Text>
            <Text style={styles.securityInfoText}>
              • PIN required on every app open{'\n'}
              • No session caching{'\n'}
              • Biometric authentication available{'\n'}
              • Maximum security protection
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIndicator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 18,
    color: '#ffffff',
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
  },
  securityInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  securityInfoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});
