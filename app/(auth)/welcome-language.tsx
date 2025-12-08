
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAvailableLocales } from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeLanguageScreen() {
  const router = useRouter();
  const { locale, setLocale } = useLanguage();
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const availableLocales = getAvailableLocales();

  const handleContinue = async () => {
    await setLocale(selectedLocale);
    await AsyncStorage.setItem('language_selected', 'true');
    
    console.log('Language selected, navigating to setup-pin');
    
    // Navigate to PIN setup
    router.replace('/(auth)/setup-pin');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.success }]}>
            <IconSymbol name="checkmark.circle.fill" size={60} color="#ffffff" />
          </View>
          <Text style={styles.title}>Welcome to SaveMe!</Text>
          <Text style={styles.subtitle}>
            Select your preferred language to continue
          </Text>
        </View>

        <View style={styles.languagesContainer}>
          {availableLocales.map((lang) => (
            <Pressable
              key={lang.code}
              style={[
                styles.languageCard,
                selectedLocale === lang.code && [
                  styles.languageCardSelected,
                  { borderColor: colors.success }
                ]
              ]}
              onPress={() => setSelectedLocale(lang.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>{lang.nativeName}</Text>
                <Text style={styles.languageNameEnglish}>{lang.name}</Text>
              </View>
              {selectedLocale === lang.code && (
                <View style={[styles.checkmark, { backgroundColor: colors.success }]}>
                  <IconSymbol name="checkmark" color="#ffffff" size={16} />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.continueButton, { backgroundColor: colors.success }]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <IconSymbol name="arrow.right" size={20} color="#ffffff" />
        </Pressable>

        <View style={[styles.infoCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.accent} />
          <Text style={styles.infoText}>
            You can change the language anytime in Settings
          </Text>
        </View>
      </ScrollView>
    </View>
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
  languagesContainer: {
    marginBottom: 24,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  languageNameEnglish: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 4,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});
