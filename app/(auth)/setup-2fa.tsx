
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
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { generate2FASecret, generateQRCodeData } from '@/utils/twoFactorAuth';

export default function Setup2FAScreen() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'email' | 'authenticator' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'select' | 'input' | 'verify'>('select');
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [secret, setSecret] = useState('');
  const [sentCode, setSentCode] = useState('');

  useEffect(() => {
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('user_email');
      if (userEmail) {
        setEmail(userEmail);
      }
    } catch (error) {
      console.error('Error loading user email:', error);
    }
  };

  const handleMethodSelect = (method: 'sms' | 'email' | 'authenticator') => {
    setSelectedMethod(method);
    
    if (method === 'authenticator') {
      setupAuthenticator();
    } else {
      setStep('input');
    }
  };

  const setupAuthenticator = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('user_email');
      const userName = await AsyncStorage.getItem('user_name') || 'User';
      
      const secretKey = generate2FASecret();
      const qrData = generateQRCodeData(secretKey, userEmail || 'user@saveme.app', 'Save Me');
      
      setSecret(secretKey);
      setQrCodeData(qrData);
      setStep('verify');
    } catch (error) {
      console.error('Error setting up authenticator:', error);
      Alert.alert('Error', 'Failed to setup authenticator');
    }
  };

  const sendVerificationCode = async () => {
    if (selectedMethod === 'sms' && !phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (selectedMethod === 'email' && !email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentCode(code);

      // Simulate sending code
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, you would send this via SMS/Email service
      console.log(`Verification code sent to ${selectedMethod}: ${code}`);
      
      // For demo purposes, show the code in an alert
      Alert.alert(
        'Verification Code Sent',
        `Your code is: ${code}\n\n(In production, this would be sent via ${selectedMethod === 'sms' ? 'SMS' : 'email'})`,
        [{ text: 'OK' }]
      );

      setStep('verify');
    } catch (error) {
      console.error('Error sending verification code:', error);
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);

    try {
      let isValid = false;

      if (selectedMethod === 'authenticator') {
        // For authenticator, we'll simulate TOTP verification
        // In production, use a library like 'otplib' to verify TOTP codes
        isValid = verificationCode.length === 6 && /^\d+$/.test(verificationCode);
      } else {
        // For SMS/Email, verify against the sent code
        isValid = verificationCode === sentCode;
      }

      if (isValid) {
        // Save 2FA settings
        const twoFactorSettings = {
          enabled: true,
          method: selectedMethod,
          phoneNumber: selectedMethod === 'sms' ? phoneNumber : undefined,
          email: selectedMethod === 'email' ? email : undefined,
          secret: selectedMethod === 'authenticator' ? secret : undefined,
          setupDate: new Date().toISOString(),
        };

        await SecureStore.setItemAsync('2fa_settings', JSON.stringify(twoFactorSettings));
        await AsyncStorage.setItem('2fa_enabled', 'true');

        Alert.alert(
          'Success',
          'Two-factor authentication has been enabled successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Invalid verification code. Please try again.');
        setVerificationCode('');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      Alert.alert('Error', 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.methodsContainer}>
      <Text style={styles.sectionTitle}>Choose Your 2FA Method</Text>
      <Text style={styles.sectionSubtitle}>
        Select how you want to receive verification codes
      </Text>

      <Pressable
        style={styles.methodCard}
        onPress={() => handleMethodSelect('sms')}
      >
        <View style={[styles.methodIcon, { backgroundColor: colors.primary }]}>
          <IconSymbol name="message.fill" size={32} color="#ffffff" />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>SMS Verification</Text>
          <Text style={styles.methodDescription}>
            Receive codes via text message
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
      </Pressable>

      <Pressable
        style={styles.methodCard}
        onPress={() => handleMethodSelect('email')}
      >
        <View style={[styles.methodIcon, { backgroundColor: colors.accent }]}>
          <IconSymbol name="envelope.fill" size={32} color="#ffffff" />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>Email Verification</Text>
          <Text style={styles.methodDescription}>
            Receive codes via email
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
      </Pressable>

      <Pressable
        style={styles.methodCard}
        onPress={() => handleMethodSelect('authenticator')}
      >
        <View style={[styles.methodIcon, { backgroundColor: colors.secondary }]}>
          <IconSymbol name="lock.shield.fill" size={32} color="#ffffff" />
        </View>
        <View style={styles.methodContent}>
          <Text style={styles.methodTitle}>Authenticator App</Text>
          <Text style={styles.methodDescription}>
            Use Google Authenticator or similar
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );

  const renderInputStep = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.sectionTitle}>
        {selectedMethod === 'sms' ? 'Enter Phone Number' : 'Confirm Email'}
      </Text>
      <Text style={styles.sectionSubtitle}>
        {selectedMethod === 'sms'
          ? 'We\'ll send a verification code to this number'
          : 'We\'ll send a verification code to this email'}
      </Text>

      {selectedMethod === 'sms' ? (
        <View style={styles.inputWrapper}>
          <IconSymbol name="phone.fill" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 123-4567"
            placeholderTextColor="#999999"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoFocus
          />
        </View>
      ) : (
        <View style={styles.inputWrapper}>
          <IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#999999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
        </View>
      )}

      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={sendVerificationCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Send Code</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.backButton}
        onPress={() => {
          setStep('select');
          setSelectedMethod(null);
        }}
      >
        <Text style={styles.backButtonText}>Choose Different Method</Text>
      </Pressable>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.verifyContainer}>
      {selectedMethod === 'authenticator' ? (
        <>
          <Text style={styles.sectionTitle}>Scan QR Code</Text>
          <Text style={styles.sectionSubtitle}>
            Use your authenticator app to scan this code
          </Text>

          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <IconSymbol name="qrcode" size={120} color={colors.primary} />
              <Text style={styles.qrNote}>
                QR Code would appear here
              </Text>
            </View>
          </View>

          <View style={styles.secretContainer}>
            <Text style={styles.secretLabel}>Manual Entry Key:</Text>
            <Text style={styles.secretText}>{secret}</Text>
            <Text style={styles.secretNote}>
              Enter this key manually if you can&apos;t scan the QR code
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Enter Verification Code</Text>
          <Text style={styles.sectionSubtitle}>
            Enter the 6-digit code sent to your {selectedMethod === 'sms' ? 'phone' : 'email'}
          </Text>
        </>
      )}

      <View style={styles.codeInputWrapper}>
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
        onPress={verifyCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Verify & Enable</Text>
        )}
      </Pressable>

      {selectedMethod !== 'authenticator' && (
        <Pressable
          style={styles.resendButton}
          onPress={sendVerificationCode}
          disabled={loading}
        >
          <Text style={styles.resendButtonText}>Resend Code</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.backButton}
        onPress={() => {
          setStep('select');
          setSelectedMethod(null);
          setVerificationCode('');
        }}
      >
        <Text style={styles.backButtonText}>Start Over</Text>
      </Pressable>
    </View>
  );

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
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <IconSymbol name="xmark" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
            <IconSymbol name="lock.shield.fill" size={60} color="#ffffff" />
          </View>
          <Text style={styles.title}>Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>
            Add an extra layer of security to your account
          </Text>
        </View>

        {step === 'select' && renderMethodSelection()}
        {step === 'input' && renderInputStep()}
        {step === 'verify' && renderVerifyStep()}
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
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  methodsContainer: {
    marginBottom: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  methodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
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
    fontSize: 16,
    color: colors.text,
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
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  verifyContainer: {
    marginBottom: 24,
  },
  codeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
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
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  qrNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  secretContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  secretLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  secretText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  secretNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
