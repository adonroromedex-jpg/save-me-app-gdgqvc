
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import {
  sendVerificationCode,
  verifyPhoneNumber,
  setCurrentUserPhone,
  resendVerificationCode,
} from '@/utils/phoneAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PhoneVerificationScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const countryCodes = [
    { code: '+1', country: 'US/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+509', country: 'Haiti', flag: '🇭🇹' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 7) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    const result = await sendVerificationCode(phoneNumber, countryCode);
    setLoading(false);

    if (result.success) {
      setGeneratedCode(result.code || '');
      setStep('code');
      setResendTimer(60);
      Alert.alert(
        'Code Sent',
        `A verification code has been sent to ${countryCode} ${phoneNumber}\n\nFor testing: ${result.code}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to send verification code');
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    const result = await verifyPhoneNumber(phoneNumber, verificationCode, countryCode);
    setLoading(false);

    if (result.success) {
      await setCurrentUserPhone(phoneNumber, countryCode);
      await AsyncStorage.setItem('phone_verified', 'true');
      
      console.log('Phone verified successfully, navigating to welcome-language');
      
      // Navigate to welcome screen - DO NOT check authentication here
      router.replace('/(auth)/welcome-language');
    } else {
      Alert.alert('Error', result.error || 'Verification failed');
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) {
      return;
    }

    setLoading(true);
    const result = await resendVerificationCode(phoneNumber, countryCode);
    setLoading(false);

    if (result.success) {
      setGeneratedCode(result.code || '');
      setResendTimer(60);
      Alert.alert(
        'Code Resent',
        `A new verification code has been sent to ${countryCode}${phoneNumber}\n\nFor testing: ${result.code}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to resend code');
    }
  };

  if (step === 'code') {
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
          <Pressable style={styles.backButton} onPress={() => setStep('phone')}>
            <IconSymbol name="arrow.left" size={24} color="#ffffff" />
          </Pressable>

          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.success }]}>
              <IconSymbol name="checkmark.shield.fill" size={60} color="#ffffff" />
            </View>
            <Text style={styles.title}>Enter Verification Code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              {countryCode}{phoneNumber}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <Pressable
              style={[styles.button, { backgroundColor: colors.success }]}
              onPress={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Verifying...' : 'Verify Phone Number'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={resendTimer > 0 || loading}
            >
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                {resendTimer > 0
                  ? `Resend code in ${resendTimer}s`
                  : 'Resend verification code'}
              </Text>
            </Pressable>
          </View>

          {generatedCode && (
            <View style={[styles.testCodeContainer, { backgroundColor: colors.warning }]}>
              <IconSymbol name="info.circle.fill" size={20} color="#ffffff" />
              <Text style={styles.testCodeText}>
                Test Code: {generatedCode}
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By verifying your phone number, you agree to receive SMS messages for authentication purposes.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color="#ffffff" />
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <IconSymbol name="phone.fill" size={60} color="#ffffff" />
          </View>
          <Text style={styles.title}>Verify Phone Number</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to receive a verification code
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.phoneInputRow}>
            <Pressable
              style={[styles.countryCodeContainer, styles.inputContainer]}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
            >
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <IconSymbol name="chevron.down" size={16} color="rgba(255, 255, 255, 0.7)" />
            </Pressable>

            <View style={[styles.phoneNumberContainer, styles.inputContainer]}>
              <IconSymbol name="phone.fill" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
          </View>

          {showCountryPicker && (
            <View style={styles.countryPickerContainer}>
              <ScrollView style={styles.countryPicker} nestedScrollEnabled>
                {countryCodes.map((country) => (
                  <Pressable
                    key={country.code}
                    style={[
                      styles.countryOption,
                      countryCode === country.code && styles.countryOptionSelected
                    ]}
                    onPress={() => {
                      setCountryCode(country.code);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryFlag}>{country.flag}</Text>
                    <Text style={styles.countryName}>{country.country}</Text>
                    <Text style={styles.countryCodeOption}>{country.code}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSendCode}
            disabled={loading || !phoneNumber}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.infoCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <IconSymbol name="shield.fill" size={24} color={colors.success} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Secure Authentication</Text>
            <Text style={styles.infoText}>
              • Phone verification ensures only verified users can access the app{'\n'}
              • Your number is encrypted and never shared{'\n'}
              • SMS codes expire after 10 minutes
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Standard SMS rates may apply. We will never share your phone number with third parties.
          </Text>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  phoneInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  countryCodeContainer: {
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 4,
  },
  phoneNumberContainer: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  countryCodeInput: {
    textAlign: 'center',
    paddingHorizontal: 4,
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
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  testCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  testCodeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  countryPickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  countryPicker: {
    maxHeight: 200,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  countryCodeOption: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
});
