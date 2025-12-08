
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert, AppState } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAppLockEnabled } from "@/utils/biometricAuth";
import { checkAndExecuteSelfDestructs } from "@/utils/selfDestructTimer";
import * as ScreenCapture from 'expo-screen-capture';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(auth)/onboarding",
};

function useProtectedRoute(
  onboardingComplete: boolean | null,
  phoneVerified: boolean | null,
  languageSelected: boolean | null,
  pinSetupComplete: boolean | null,
  needsAppLock: boolean
) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until all states are loaded
    if (
      onboardingComplete === null ||
      phoneVerified === null ||
      languageSelected === null ||
      pinSetupComplete === null
    ) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const currentScreen = segments[segments.length - 1];

    console.log('Navigation check:', {
      onboardingComplete,
      phoneVerified,
      languageSelected,
      pinSetupComplete,
      needsAppLock,
      currentScreen,
      segments
    });

    // Step 1: If onboarding not complete, go to onboarding
    if (!onboardingComplete && currentScreen !== 'onboarding') {
      console.log('→ Redirecting to onboarding');
      router.replace('/(auth)/onboarding');
      return;
    }

    // Step 2: If phone not verified, go to phone verification
    if (onboardingComplete && !phoneVerified && currentScreen !== 'phone-verification') {
      console.log('→ Redirecting to phone-verification');
      router.replace('/(auth)/phone-verification');
      return;
    }

    // Step 3: If language not selected, go to welcome-language
    if (onboardingComplete && phoneVerified && !languageSelected && currentScreen !== 'welcome-language') {
      console.log('→ Redirecting to welcome-language');
      router.replace('/(auth)/welcome-language');
      return;
    }

    // Step 4: If PIN not set up, go to setup-pin
    if (onboardingComplete && phoneVerified && languageSelected && !pinSetupComplete && currentScreen !== 'setup-pin') {
      console.log('→ Redirecting to setup-pin');
      router.replace('/(auth)/setup-pin');
      return;
    }

    // Step 5: If everything is complete but needs app lock, go to app-lock
    if (onboardingComplete && phoneVerified && languageSelected && pinSetupComplete && needsAppLock && currentScreen !== 'app-lock') {
      console.log('→ Redirecting to app-lock');
      router.replace('/(auth)/app-lock');
      return;
    }

    // Step 6: If everything is complete and unlocked, go to home
    if (onboardingComplete && phoneVerified && languageSelected && pinSetupComplete && !needsAppLock && inAuthGroup) {
      console.log('→ Redirecting to home');
      router.replace('/(tabs)/(home)/');
      return;
    }
  }, [onboardingComplete, phoneVerified, languageSelected, pinSetupComplete, needsAppLock, segments, router]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null);
  const [languageSelected, setLanguageSelected] = useState<boolean | null>(null);
  const [pinSetupComplete, setPinSetupComplete] = useState<boolean | null>(null);
  const [needsAppLock, setNeedsAppLock] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useProtectedRoute(onboardingComplete, phoneVerified, languageSelected, pinSetupComplete, needsAppLock);

  // Enable global screenshot protection
  useEffect(() => {
    enableGlobalScreenshotProtection();
    
    return () => {
      disableGlobalScreenshotProtection();
    };
  }, []);

  const enableGlobalScreenshotProtection = async () => {
    try {
      await ScreenCapture.preventScreenCaptureAsync();
      console.log('Global screenshot protection enabled');
    } catch (error) {
      console.error('Error enabling global screenshot protection:', error);
    }
  };

  const disableGlobalScreenshotProtection = async () => {
    try {
      await ScreenCapture.allowScreenCaptureAsync();
      console.log('Global screenshot protection disabled');
    } catch (error) {
      console.error('Error disabling global screenshot protection:', error);
    }
  };

  // Check onboarding status
  const checkOnboardingStatus = async () => {
    try {
      const onboarding = await AsyncStorage.getItem('onboarding_complete');
      const phone = await AsyncStorage.getItem('phone_verified');
      const language = await AsyncStorage.getItem('language_selected');
      const pin = await AsyncStorage.getItem('pin_setup_complete');
      
      console.log('Onboarding status:', {
        onboarding: onboarding === 'true',
        phone: phone === 'true',
        language: language === 'true',
        pin: pin === 'true'
      });
      
      setOnboardingComplete(onboarding === 'true');
      setPhoneVerified(phone === 'true');
      setLanguageSelected(language === 'true');
      setPinSetupComplete(pin === 'true');

      // If all onboarding steps are complete, always require app lock on app open
      if (onboarding === 'true' && phone === 'true' && language === 'true' && pin === 'true') {
        const lockEnabled = await isAppLockEnabled();
        console.log('App lock enabled:', lockEnabled);
        // Always set needsAppLock to true to enforce passcode on every open
        setNeedsAppLock(true);
      } else {
        setNeedsAppLock(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setOnboardingComplete(false);
      setPhoneVerified(false);
      setLanguageSelected(false);
      setPinSetupComplete(false);
      setNeedsAppLock(false);
    }
  };

  // Initial check
  useEffect(() => {
    checkOnboardingStatus();
    
    // Run self-destruct cleanup on app start
    checkAndExecuteSelfDestructs().catch(error => {
      console.error('Error running self-destruct cleanup:', error);
    });
  }, []);

  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App became active, rechecking status and running cleanup');
        checkOnboardingStatus();
        
        // Run self-destruct cleanup when app becomes active
        checkAndExecuteSelfDestructs().catch(error => {
          console.error('Error running self-destruct cleanup:', error);
        });

        // Re-enable screenshot protection
        enableGlobalScreenshotProtection();
      } else if (nextAppState === 'background') {
        // When app goes to background, ALWAYS require app lock on next activation
        setNeedsAppLock(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Run self-destruct cleanup periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndExecuteSelfDestructs().catch(error => {
        console.error('Error running periodic self-destruct cleanup:', error);
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (
      loaded &&
      onboardingComplete !== null &&
      phoneVerified !== null &&
      languageSelected !== null &&
      pinSetupComplete !== null
    ) {
      SplashScreen.hideAsync();
    }
  }, [loaded, onboardingComplete, phoneVerified, languageSelected, pinSetupComplete]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (
    !loaded ||
    onboardingComplete === null ||
    phoneVerified === null ||
    languageSelected === null ||
    pinSetupComplete === null
  ) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)",
      background: "rgb(242, 242, 247)",
      card: "rgb(255, 255, 255)",
      text: "rgb(0, 0, 0)",
      border: "rgb(216, 216, 220)",
      notification: "rgb(255, 59, 48)",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)",
      background: "rgb(1, 1, 1)",
      card: "rgb(28, 28, 30)",
      text: "rgb(255, 255, 255)",
      border: "rgb(44, 44, 46)",
      notification: "rgb(255, 69, 58)",
    },
  };

  return (
    <>
      <StatusBar style="auto" animated />
      <ThemeProvider
        value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
      >
        <LanguageProvider>
          <WidgetProvider>
            <GestureHandlerRootView>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="modal"
                  options={{
                    presentation: "modal",
                    title: "Standard Modal",
                  }}
                />
                <Stack.Screen
                  name="formsheet"
                  options={{
                    presentation: "formSheet",
                    title: "Form Sheet Modal",
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.5, 0.8, 1.0],
                    sheetCornerRadius: 20,
                  }}
                />
                <Stack.Screen
                  name="transparent-modal"
                  options={{
                    presentation: "transparentModal",
                    headerShown: false,
                  }}
                />
              </Stack>
              <SystemBars style={"auto"} />
            </GestureHandlerRootView>
          </WidgetProvider>
        </LanguageProvider>
      </ThemeProvider>
    </>
  );
}
