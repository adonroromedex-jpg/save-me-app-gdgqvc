
import React, { useState, useEffect, useCallback } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, Image, AppState } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { checkSessionTimeout, updateLastActivity, logAccess, checkAndExecuteAutoDeletes, preventScreenCapture } from "@/utils/securityUtils";
import i18n from "@/i18n";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasHardware, setHasHardware] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const checkBiometricSupport = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setHasHardware(compatible);
      
      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsEnrolled(enrolled);
      }
      
      console.log('Biometric hardware available:', compatible);
      console.log('Biometric enrolled:', isEnrolled);
    } catch (error) {
      console.error('Error checking biometric support:', error);
    }
  }, []);

  useEffect(() => {
    loadLanguagePreference();
    checkBiometricSupport();
    checkAndExecuteAutoDeletes();
    preventScreenCapture();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        const timedOut = await checkSessionTimeout();
        if (timedOut) {
          setIsAuthenticated(false);
          Alert.alert(
            i18n.t('auth.sessionExpired'),
            i18n.t('auth.sessionExpiredMessage'),
            [{ text: i18n.t('common.ok') }]
          );
        } else {
          await updateLastActivity();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkBiometricSupport, isAuthenticated]);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await SecureStore.getItemAsync('app_language');
      if (savedLanguage) {
        i18n.locale = savedLanguage;
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const handleAuthenticate = async () => {
    try {
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          i18n.t('auth.biometricNotAvailable'),
          i18n.t('auth.biometricNotAvailableMessage'),
          [{ text: i18n.t('common.ok') }]
        );
        setIsAuthenticated(true);
        await logAccess('login', 'Successful login without biometric');
        await updateLastActivity();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: i18n.t('auth.authenticate'),
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        await logAccess('login', 'Successful login with biometric authentication');
        await updateLastActivity();
        console.log('Authentication successful');
      } else {
        await logAccess('failed_auth', 'Failed biometric authentication attempt');
        Alert.alert(i18n.t('auth.authenticationFailed'), i18n.t('auth.authenticationFailedMessage'));
        console.log('Authentication failed:', result);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      await logAccess('failed_auth', 'Authentication error occurred');
      Alert.alert(i18n.t('common.error'), 'An error occurred during authentication.');
    }
  };

  const features = [
    {
      title: i18n.t('features.secureDrive.title'),
      description: i18n.t('features.secureDrive.description'),
      icon: "lock.shield.fill",
      color: colors.primary,
      route: "/secure-drive",
    },
    {
      title: i18n.t('features.privateCamera.title'),
      description: i18n.t('features.privateCamera.description'),
      icon: "camera.fill",
      color: colors.secondary,
      route: "/private-camera",
    },
    {
      title: i18n.t('features.sharedWithMe.title'),
      description: i18n.t('features.sharedWithMe.description'),
      icon: "tray.fill",
      color: colors.accent,
      route: "/shared-with-me",
    },
    {
      title: i18n.t('features.accessLog.title'),
      description: i18n.t('features.accessLog.description'),
      icon: "doc.text.fill",
      color: colors.highlight,
      route: "/access-log",
    },
  ];

  const securityFeatures = [
    { icon: "faceid", text: i18n.t('features.facialRecognition') },
    { icon: "timer", text: i18n.t('features.autoDelete') },
    { icon: "eye.slash.fill", text: i18n.t('features.antiScreenshot') },
    { icon: "bell.badge.fill", text: i18n.t('features.viewNotifications') },
  ];

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => Alert.alert(i18n.t('profile.settings'), i18n.t('profile.additionalSettings'))}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="gear" color={colors.primary} />
    </Pressable>
  );

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => Alert.alert("Panic Button", "This will delete all sensitive content. Are you sure?", [
        { text: i18n.t('common.cancel'), style: "cancel" },
        { 
          text: i18n.t('common.delete'), 
          style: "destructive", 
          onPress: async () => {
            await SecureStore.deleteItemAsync('secure_files');
            await SecureStore.deleteItemAsync('shared_content');
            await logAccess('file_delete', 'Panic delete executed from home screen');
            Alert.alert(i18n.t('profile.allDeleted'), i18n.t('profile.allDeletedMessage'));
            console.log("Panic delete triggered");
          }
        }
      ])}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="exclamationmark.triangle.fill" color={colors.danger} />
    </Pressable>
  );

  if (!isAuthenticated) {
    return (
      <>
        {Platform.OS === 'ios' && (
          <Stack.Screen
            options={{
              title: "Save Me",
              headerShown: false,
            }}
          />
        )}
        <View style={[commonStyles.container, commonStyles.centerContent]}>
          <Image 
            source={require('@/assets/images/58b243a3-a5cf-45d2-b7e2-b6b0d2c95648.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          <Text style={[commonStyles.title, { textAlign: 'center', marginTop: 24 }]}>{i18n.t('auth.welcome')}</Text>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', paddingHorizontal: 40 }]}>
            {i18n.t('auth.welcomeDescription')}
          </Text>
          
          <View style={styles.securityBadgesContainer}>
            {securityFeatures.map((feature, index) => (
              <View key={index} style={styles.securityBadge}>
                <IconSymbol name={feature.icon} color={colors.primary} size={20} />
                <Text style={styles.securityBadgeText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <Pressable 
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={handleAuthenticate}
          >
            <IconSymbol name="faceid" color={colors.card} size={24} />
            <Text style={styles.authButtonText}>{i18n.t('auth.authenticate')}</Text>
          </Pressable>

          <Text style={styles.privacyText}>
            {i18n.t('auth.privacyNote')}
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: "Save Me",
            headerRight: renderHeaderRight,
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
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/58b243a3-a5cf-45d2-b7e2-b6b0d2c95648.png')}
              style={styles.logoSmall}
              resizeMode="contain"
            />
          </View>

          <View style={styles.header}>
            <Text style={commonStyles.title}>{i18n.t('home.title')}</Text>
            <Text style={commonStyles.subtitle}>
              {i18n.t('home.subtitle')}
            </Text>
          </View>

          <View style={[styles.securityBanner, { backgroundColor: colors.success }]}>
            <IconSymbol name="checkmark.shield.fill" color={colors.card} size={24} />
            <View style={styles.securityBannerContent}>
              <Text style={styles.securityBannerTitle}>{i18n.t('home.maxSecurityActive')}</Text>
              <Text style={styles.securityBannerText}>
                {i18n.t('home.securityFeatures')}
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>{i18n.t('home.secureFiles')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>{i18n.t('home.sharedItems')}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>{i18n.t('home.accessLogs')}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{i18n.t('home.features')}</Text>
          
          {features.map((feature, index) => (
            <Pressable
              key={index}
              style={[styles.featureCard, { backgroundColor: colors.card }]}
              onPress={() => {
                if (feature.route === "/secure-drive") {
                  router.push("/(tabs)/(home)/secure-drive");
                } else if (feature.route === "/private-camera") {
                  router.push("/(tabs)/(home)/private-camera");
                } else if (feature.route === "/shared-with-me") {
                  router.push("/(tabs)/(home)/shared-with-me");
                } else if (feature.route === "/access-log") {
                  router.push("/(tabs)/(home)/access-log");
                } else {
                  Alert.alert("Coming Soon", `${feature.title} feature will be available soon!`);
                }
              }}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <IconSymbol name={feature.icon} color={colors.card} size={28} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <IconSymbol name="chevron.right" color={colors.textSecondary} size={20} />
            </Pressable>
          ))}

          <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
            <IconSymbol name="checkmark.shield.fill" color={colors.card} size={32} />
            <View style={styles.infoCardContent}>
              <Text style={styles.infoTitle}>{i18n.t('home.privacyMatters')}</Text>
              <Text style={styles.infoDescription}>
                {i18n.t('home.privacyDescription')}
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
  logo: {
    width: 180,
    height: 180,
    marginBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoSmall: {
    width: 100,
    height: 100,
  },
  header: {
    marginBottom: 16,
  },
  headerButtonContainer: {
    padding: 8,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  securityBannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginBottom: 4,
  },
  securityBannerText: {
    fontSize: 13,
    color: colors.card,
    opacity: 0.9,
  },
  lockIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  securityBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  securityBadgeText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
  },
  authButtonText: {
    color: colors.card,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  privacyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  infoCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.card,
    lineHeight: 20,
    opacity: 0.9,
  },
});
