
import React, { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Platform, KeyboardAvoidingView } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles } from "@/styles/commonStyles";

export default function OpenShareScreen() {
  const router = useRouter();
  const [shareId, setShareId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenShare = async () => {
    if (!shareId.trim()) {
      Alert.alert('Error', 'Please enter a Share ID');
      return;
    }

    try {
      setLoading(true);
      
      // Navigate to secure viewer with share ID and OTP
      router.push({
        pathname: '/(tabs)/(home)/secure-viewer',
        params: {
          shareId: shareId.trim(),
          otp: otp.trim() || undefined,
        },
      });
    } catch (error) {
      console.error('Error opening share:', error);
      Alert.alert('Error', 'Failed to open share');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    Alert.alert('QR Scanner', 'QR code scanning feature coming soon!');
  };

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
            title: "Open Secure Share",
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
              <IconSymbol name="lock.open.fill" color={colors.card} size={32} />
            </View>
            <Text style={commonStyles.title}>Open Secure Share</Text>
            <Text style={commonStyles.subtitle}>
              Enter the Share ID and OTP (if required) to view the shared content
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Share ID</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter Share ID"
              placeholderTextColor={colors.textSecondary}
              value={shareId}
              onChangeText={setShareId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>OTP (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={colors.textSecondary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
            />

            <Pressable
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleOpenShare}
              disabled={loading}
            >
              <IconSymbol name="lock.open.fill" color={colors.card} size={20} />
              <Text style={styles.buttonText}>
                {loading ? 'Opening...' : 'Open Share'}
              </Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Pressable
              style={[styles.button, styles.outlineButton, { borderColor: colors.primary }]}
              onPress={handleScanQR}
            >
              <IconSymbol name="qrcode.viewfinder" color={colors.primary} size={20} />
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Scan QR Code
              </Text>
            </Pressable>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="info.circle.fill" color={colors.accent} size={24} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How to Access</Text>
              <Text style={styles.infoText}>
                - Get the Share ID from the sender{'\n'}
                - Enter the OTP if the share is protected{'\n'}
                - Or scan the QR code provided by the sender
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
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
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
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
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
