
import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateVerificationCode } from '@/utils/twoFactorAuth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [sentCode, setSentCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendResetCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Check if user exists
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (!storedUser) {
        Alert.alert('Error', 'No account found with this email address');
        setLoading(false);
        return;
      }

      const userData = JSON.parse(storedUser);
      
      if (userData.email !== email) {
        Alert.alert('Error', 'No account found with this email address');
        setLoading(false);
        return;
      }

      // Generate verification code
      const code = generateVerificationCode();
      setSentCode(code);

      // Store code temporarily
      await AsyncStorage.setItem('temp_reset_code', code);
      await AsyncStorage.setItem('temp_reset_email', email);

      // Simulate sending email
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log(`Password reset code sent to ${email}: ${code}`);

      // Show code in alert for demo purposes
      Alert.alert(
        'Reset Code Sent',
        `Your reset code is: ${code}\n\n(In production, this would be sent via email)`,
        [{ text: 'OK', onPress: () => setStep('verify') }]
      );
    } catch (error) {
      console.error('Error sending reset code:', error);
      Alert.alert('Error', 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);

    try {
      const storedCode = await AsyncStorage.getItem('temp_reset_code');
      
      if (verificationCode === storedCode) {
        setStep('reset');
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

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.password = newPassword;
        
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        
        // Clear temporary data
        await AsyncStorage.removeItem('temp_reset_code');
        await AsyncStorage.removeItem('temp_reset_email');

        Alert.alert(
          'Success',
          'Your password has been reset successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
          <IconSymbol name="key.fill" size={60} color="#ffffff" />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we&apos;ll send you a verification code
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={handleSendResetCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Code</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.backToLoginButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="arrow.left" size={16} color={colors.primary} />
          <Text style={styles.backToLoginText}>Back to Sign In</Text>
        </Pressable>
      </View>
    </>
  );

  const renderVerifyStep = () => (
    <>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          <IconSymbol name="checkmark.shield.fill" size={60} color="#ffffff" />
        </View>
        <Text style={styles.title}>Verify Code</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {email}
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
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleVerifyCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.resendButton}
          onPress={handleSendResetCode}
          disabled={loading}
        >
          <Text style={styles.resendButtonText}>Resend Code</Text>
        </Pressable>

        <Pressable
          style={styles.backToLoginButton}
          onPress={() => setStep('email')}
        >
          <IconSymbol name="arrow.left" size={16} color={colors.primary} />
          <Text style={styles.backToLoginText}>Change Email</Text>
        </Pressable>
      </View>
    </>
  );

  const renderResetStep = () => (
    <>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
          <IconSymbol name="lock.rotation" size={60} color="#ffffff" />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your new password
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <IconSymbol
              name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.inputContainer}>
          <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <IconSymbol
              name={showConfirmPassword ? 'eye.slash.fill' : 'eye.fill'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.success }]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </Pressable>
      </View>
    </>
  );

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

        {step === 'email' && renderEmailStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'reset' && renderResetStep()}
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
    marginBottom: 40,
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
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
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
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  resendButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  backToLoginText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
