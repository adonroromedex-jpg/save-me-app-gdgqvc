
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAvailableLocales, detectDeviceLanguage } from '@/i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const availableLocales = getAvailableLocales();

  useEffect(() => {
    setSelectedLocale(locale);
  }, [locale]);

  const handleSelectLanguage = async (localeCode: string) => {
    setSelectedLocale(localeCode);
    await setLocale(localeCode);
    
    Alert.alert(
      t('common.success'),
      'Language updated successfully! All screens will update instantly.',
      [{ text: t('common.ok') }]
    );
  };

  const handleAutoDetect = () => {
    const detectedLocale = detectDeviceLanguage();
    handleSelectLanguage(detectedLocale);
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
            title: t('profile.language'),
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="globe" color={colors.card} size={32} />
            </View>
            <Text style={styles.title}>{t('profile.language')}</Text>
            <Text style={styles.subtitle}>
              Select your preferred language. Changes apply instantly without restarting the app.
            </Text>
          </View>

          <Pressable
            style={[styles.autoDetectButton, { backgroundColor: colors.accent }]}
            onPress={handleAutoDetect}
          >
            <IconSymbol name="wand.and.stars" color={colors.card} size={20} />
            <Text style={styles.autoDetectText}>Auto-Detect Device Language</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Available Languages</Text>

          {availableLocales.map((lang) => (
            <Pressable
              key={lang.code}
              style={[
                styles.languageCard,
                { backgroundColor: colors.card },
                selectedLocale === lang.code && [styles.languageCardSelected, { borderColor: colors.primary }]
              ]}
              onPress={() => handleSelectLanguage(lang.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>{lang.nativeName}</Text>
                <Text style={styles.languageNameEnglish}>{lang.name}</Text>
              </View>
              {selectedLocale === lang.code && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <IconSymbol name="checkmark" color={colors.card} size={16} />
                </View>
              )}
            </Pressable>
          ))}

          <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
            <IconSymbol name="info.circle.fill" color={colors.card} size={24} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Instant Language Updates</Text>
              <Text style={styles.infoText}>
                • All screens update immediately{'\n'}
                • No app restart required{'\n'}
                • Automatic device language detection{'\n'}
                • Supports 4 languages
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
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
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  headerButtonContainer: {
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  autoDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  autoDetectText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  languageCardSelected: {
    borderWidth: 2,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  languageNameEnglish: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.card,
    lineHeight: 20,
  },
});
