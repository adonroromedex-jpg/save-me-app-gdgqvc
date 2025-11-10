
import React, { useState, useEffect, useCallback } from "react";
import { Stack, useRouter } from "expo-router";
import { ScrollView, Pressable, StyleSheet, View, Text, Alert, Platform, Image } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

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
    checkBiometricSupport();
  }, [checkBiometricSupport]);

  const handleAuthenticate = async () => {
    try {
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Biometric Not Available",
          "Please set up biometric authentication on your device for enhanced security.",
          [{ text: "OK" }]
        );
        setIsAuthenticated(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Save Me',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
        console.log('Authentication successful');
      } else {
        Alert.alert('Authentication Failed', 'Please try again.');
        console.log('Authentication failed:', result);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'An error occurred during authentication.');
    }
  };

  const features = [
    {
      title: "Secure Drive",
      description: "AES-256 encrypted storage for your private media",
      icon: "lock.shield.fill",
      color: colors.primary,
      route: "/secure-drive",
    },
    {
      title: "Private Camera",
      description: "Take photos directly in the app with no external storage",
      icon: "camera.fill",
      color: colors.secondary,
      route: "/private-camera",
    },
    {
      title: "Controlled Sharing",
      description: "Share with unique codes and time-limited access",
      icon: "square.and.arrow.up.fill",
      color: colors.accent,
      route: "/controlled-sharing",
    },
    {
      title: "Access Log",
      description: "Track all access to your private content",
      icon: "list.bullet.clipboard.fill",
      color: colors.highlight,
      route: "/access-log",
    },
  ];

  const securityFeatures = [
    { icon: "faceid", text: "Facial Recognition" },
    { icon: "timer", text: "Auto-Delete 24h" },
    { icon: "eye.slash.fill", text: "Anti-Screenshot" },
    { icon: "bell.badge.fill", text: "View Notifications" },
  ];

  const renderHeaderRight = () => (
    <Pressable
      onPress={() => Alert.alert("Settings", "Settings feature coming soon")}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="gear" color={colors.primary} />
    </Pressable>
  );

  const renderHeaderLeft = () => (
    <Pressable
      onPress={() => Alert.alert("Panic Button", "This will delete all sensitive content. Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete All", style: "destructive", onPress: () => console.log("Panic delete triggered") }
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
          
          <Text style={[commonStyles.title, { textAlign: 'center', marginTop: 24 }]}>Welcome to Save Me</Text>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', paddingHorizontal: 40 }]}>
            Your privacy is our priority. Authenticate to access your secure content.
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
            <Text style={styles.authButtonText}>Authenticate</Text>
          </Pressable>

          <Text style={styles.privacyText}>
            🔐 End-to-end encrypted • Zero-knowledge storage
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
            <Text style={commonStyles.title}>Your Secure Vault</Text>
            <Text style={commonStyles.subtitle}>
              All your private content is protected with military-grade encryption
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Secure Files</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Shared Items</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Access Logs</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Features</Text>
          
          {features.map((feature, index) => (
            <Pressable
              key={index}
              style={[styles.featureCard, { backgroundColor: colors.card }]}
              onPress={() => {
                if (feature.route === "/secure-drive") {
                  router.push("/(tabs)/(home)/secure-drive");
                } else if (feature.route === "/private-camera") {
                  router.push("/(tabs)/(home)/private-camera");
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
            <Text style={styles.infoTitle}>Your Privacy Matters</Text>
            <Text style={styles.infoDescription}>
              Save Me uses AES-256 encryption, the same standard used by governments and banks worldwide.
              Your data never leaves your device unencrypted.
            </Text>
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
    marginBottom: 24,
  },
  headerButtonContainer: {
    padding: 8,
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
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.card,
    marginTop: 12,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.card,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
});
