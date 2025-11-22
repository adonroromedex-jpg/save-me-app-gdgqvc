
import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, Switch } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as SecureStore from 'expo-secure-store';
import { logAccess } from "@/utils/securityUtils";
import i18n from "@/i18n";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);
  const [ghostModeEnabled, setGhostModeEnabled] = useState(false);
  const [screenshotProtection, setScreenshotProtection] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.locale);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await SecureStore.getItemAsync('app_language');
      if (savedLanguage) {
        i18n.locale = savedLanguage;
        setCurrentLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      i18n.locale = languageCode;
      setCurrentLanguage(languageCode);
      await SecureStore.setItemAsync('app_language', languageCode);
      await logAccess('login', `Language changed to ${languageCode}`);
      forceUpdate({});
      Alert.alert(i18n.t('common.success'), `${i18n.t('profile.language')}: ${i18n.t(`languages.${languageCode}`)}`);
    } catch (error) {
      console.error('Error saving language preference:', error);
      Alert.alert(i18n.t('common.error'), 'Failed to save language preference');
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await logAccess('login', `Notifications ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleBiometric = async (value: boolean) => {
    setBiometricEnabled(value);
    await logAccess('login', `Biometric authentication ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleAutoDelete = async (value: boolean) => {
    setAutoDeleteEnabled(value);
    await logAccess('login', `Auto-delete ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleGhostMode = async (value: boolean) => {
    setGhostModeEnabled(value);
    if (value) {
      Alert.alert(
        i18n.t('profile.ghostModeActivated'),
        i18n.t('profile.ghostModeMessage'),
        [{ text: i18n.t('common.ok') }]
      );
    }
    await logAccess('login', `Ghost mode ${value ? 'enabled' : 'disabled'}`);
  };

  const handleToggleScreenshotProtection = async (value: boolean) => {
    setScreenshotProtection(value);
    await logAccess('login', `Screenshot protection ${value ? 'enabled' : 'disabled'}`);
  };

  const settingsSections = [
    {
      title: i18n.t('profile.security'),
      items: [
        {
          icon: "faceid",
          label: i18n.t('profile.biometricAuth'),
          value: biometricEnabled,
          onToggle: handleToggleBiometric,
          color: colors.primary,
        },
        {
          icon: "eye.slash.fill",
          label: i18n.t('profile.screenshotProtection'),
          value: screenshotProtection,
          onToggle: handleToggleScreenshotProtection,
          color: colors.danger,
        },
        {
          icon: "timer",
          label: i18n.t('profile.autoDelete24h'),
          value: autoDeleteEnabled,
          onToggle: handleToggleAutoDelete,
          color: colors.accent,
        },
        {
          icon: "eye.slash.fill",
          label: i18n.t('profile.ghostMode'),
          value: ghostModeEnabled,
          onToggle: handleToggleGhostMode,
          color: colors.secondary,
        },
      ],
    },
    {
      title: i18n.t('profile.notifications'),
      items: [
        {
          icon: "bell.fill",
          label: i18n.t('profile.viewNotifications'),
          value: notificationsEnabled,
          onToggle: handleToggleNotifications,
          color: colors.highlight,
        },
      ],
    },
  ];

  const accountActions = [
    {
      icon: "person.2.fill",
      label: i18n.t('profile.manageUsers'),
      color: colors.highlight,
      action: () => router.push("/(tabs)/(home)/manage-users"),
    },
    {
      icon: "doc.text.fill",
      label: i18n.t('profile.accessLog'),
      color: colors.primary,
      action: () => router.push("/(tabs)/(home)/access-log"),
    },
    {
      icon: "key.fill",
      label: i18n.t('profile.changePassword'),
      color: colors.accent,
      action: () => Alert.alert(i18n.t('profile.changePassword'), i18n.t('profile.changePasswordSoon')),
    },
    {
      icon: "shield.checkered",
      label: i18n.t('profile.twoFactorAuth'),
      color: colors.secondary,
      action: () => Alert.alert(i18n.t('profile.twoFactorAuth'), i18n.t('profile.twoFactorSoon')),
    },
    {
      icon: "questionmark.circle.fill",
      label: i18n.t('profile.helpSupport'),
      color: colors.textSecondary,
      action: () => Alert.alert(i18n.t('profile.helpSupport'), i18n.t('profile.helpContact')),
    },
  ];

  const languages = [
    { code: 'en', name: i18n.t('languages.en'), flag: '🇬🇧' },
    { code: 'fr', name: i18n.t('languages.fr'), flag: '🇫🇷' },
    { code: 'es', name: i18n.t('languages.es'), flag: '🇪🇸' },
    { code: 'ht', name: i18n.t('languages.ht'), flag: '🇭🇹' },
  ];

  const handlePanicDelete = async () => {
    Alert.alert(
      i18n.t('profile.panicDeleteTitle'),
      i18n.t('profile.panicDeleteMessage'),
      [
        { text: i18n.t('common.cancel'), style: "cancel" },
        {
          text: i18n.t('profile.deleteEverything'),
          style: "destructive",
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('secure_files');
              await SecureStore.deleteItemAsync('shared_content');
              await logAccess('file_delete', 'Panic delete executed - all files deleted');
              Alert.alert(i18n.t('profile.allDeleted'), i18n.t('profile.allDeletedMessage'));
              console.log("Panic delete executed");
            } catch (error) {
              console.error('Error during panic delete:', error);
              Alert.alert(i18n.t('common.error'), "Failed to delete all files");
            }
          }
        }
      ]
    );
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => Alert.alert(i18n.t('profile.settings'), i18n.t('profile.additionalSettings'))}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="gear" color={colors.primary} />
    </Pressable>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: i18n.t('profile.title'),
            headerRight: renderHeaderRight,
          }}
        />
      )}
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="person.fill" color={colors.card} size={48} />
            </View>
            <Text style={styles.userName}>{i18n.t('profile.secureUser')}</Text>
            <Text style={styles.userEmail}>user@saveme.app</Text>
            <View style={[styles.premiumBadge, { backgroundColor: colors.highlight }]}>
              <IconSymbol name="star.fill" color={colors.card} size={14} />
              <Text style={styles.premiumText}>{i18n.t('profile.premium')}</Text>
            </View>
          </View>

          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>{i18n.t('profile.filesProtected')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>{i18n.t('profile.shares')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>{i18n.t('profile.secure')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('profile.language')}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              {languages.map((language, index) => (
                <View key={language.code}>
                  <Pressable
                    style={styles.languageItem}
                    onPress={() => handleLanguageChange(language.code)}
                  >
                    <View style={styles.settingLeft}>
                      <Text style={styles.languageFlag}>{language.flag}</Text>
                      <Text style={styles.settingLabel}>{language.name}</Text>
                    </View>
                    {currentLanguage === language.code && (
                      <IconSymbol name="checkmark.circle.fill" color={colors.primary} size={24} />
                    )}
                  </Pressable>
                  {index < languages.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>

          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex}>
                    <View style={styles.settingItem}>
                      <View style={styles.settingLeft}>
                        <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                          <IconSymbol name={item.icon} color={colors.card} size={20} />
                        </View>
                        <Text style={styles.settingLabel}>{item.label}</Text>
                      </View>
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: colors.border, true: item.color }}
                        thumbColor={colors.card}
                      />
                    </View>
                    {itemIndex < section.items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('profile.account')}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
              {accountActions.map((action, index) => (
                <View key={index}>
                  <Pressable
                    style={styles.actionItem}
                    onPress={action.action}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: action.color }]}>
                        <IconSymbol name={action.icon} color={colors.card} size={20} />
                      </View>
                      <Text style={styles.settingLabel}>{action.label}</Text>
                    </View>
                    <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
                  </Pressable>
                  {index < accountActions.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>

          <Pressable
            style={[styles.dangerButton, { backgroundColor: colors.danger }]}
            onPress={handlePanicDelete}
          >
            <IconSymbol name="exclamationmark.triangle.fill" color={colors.card} size={20} />
            <Text style={styles.dangerButtonText}>{i18n.t('profile.panicDelete')}</Text>
          </Pressable>

          <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
            <IconSymbol name="checkmark.shield.fill" color={colors.card} size={28} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{i18n.t('profile.privacyProtected')}</Text>
              <Text style={styles.infoDescription}>
                {i18n.t('profile.privacyFeatures')}
              </Text>
            </View>
          </View>

          <Text style={styles.versionText}>{i18n.t('profile.version')}</Text>
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
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  headerButtonContainer: {
    padding: 8,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumText: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 68,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dangerButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    color: colors.card,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 13,
    color: colors.card,
    lineHeight: 20,
    opacity: 0.9,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});
