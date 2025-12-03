
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HelpScreen() {
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@saveme.app?subject=Save Me Support Request');
  };

  const handleOpenFAQ = () => {
    Alert.alert('FAQ', 'Frequently Asked Questions will open in the browser');
  };

  const handleOpenPrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy Policy will open in the browser');
  };

  const handleOpenTerms = () => {
    Alert.alert('Terms of Service', 'Terms of Service will open in the browser');
  };

  const helpSections = [
    {
      title: 'Support',
      items: [
        {
          icon: 'envelope.fill',
          label: 'Contact Support',
          description: 'Get help from our support team',
          color: colors.primary,
          action: handleContactSupport,
        },
        {
          icon: 'questionmark.circle.fill',
          label: 'FAQ',
          description: 'Find answers to common questions',
          color: colors.secondary,
          action: handleOpenFAQ,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          icon: 'doc.text.fill',
          label: 'Privacy Policy',
          description: 'How we protect your data',
          color: colors.accent,
          action: handleOpenPrivacyPolicy,
        },
        {
          icon: 'doc.plaintext.fill',
          label: 'Terms of Service',
          description: 'Terms and conditions',
          color: colors.highlight,
          action: handleOpenTerms,
        },
      ],
    },
  ];

  const features = [
    { icon: 'lock.shield.fill', text: 'AES-256 Encryption' },
    { icon: 'faceid', text: 'Biometric Auth' },
    { icon: 'eye.slash.fill', text: 'Anti-Screenshot' },
    { icon: 'timer', text: 'Auto-Delete 24h' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Help & Support',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="questionmark.circle.fill" size={48} color="#ffffff" />
            </View>
            <Text style={styles.title}>How can we help?</Text>
            <Text style={styles.subtitle}>
              Get support and learn more about Save Me
            </Text>
          </View>

          {helpSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                {section.items.map((item, itemIndex) => (
                  <React.Fragment key={itemIndex}>
                    <Pressable
                      style={styles.helpItem}
                      onPress={item.action}
                    >
                      <View style={[styles.helpIcon, { backgroundColor: item.color }]}>
                        <IconSymbol name={item.icon} size={24} color="#ffffff" />
                      </View>
                      <View style={styles.helpContent}>
                        <Text style={styles.helpLabel}>{item.label}</Text>
                        <Text style={styles.helpDescription}>{item.description}</Text>
                      </View>
                      <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                    </Pressable>
                    {itemIndex < section.items.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={[styles.featuresCard, { backgroundColor: colors.card }]}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <IconSymbol name={feature.icon} size={20} color={colors.primary} />
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
            <IconSymbol name="checkmark.shield.fill" size={28} color="#ffffff" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Your Privacy Matters</Text>
              <Text style={styles.infoText}>
                Save Me is committed to protecting your privacy with military-grade encryption and zero-knowledge architecture.
              </Text>
            </View>
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Save Me v1.0.0</Text>
            <Text style={styles.copyrightText}>© 2024 Save Me. All rights reserved.</Text>
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
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    textAlign: 'center',
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
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  helpContent: {
    flex: 1,
  },
  helpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  helpDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 80,
  },
  featuresCard: {
    padding: 16,
    borderRadius: 16,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    opacity: 0.95,
  },
  versionContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
