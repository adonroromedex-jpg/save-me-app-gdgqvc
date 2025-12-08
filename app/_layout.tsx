
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAppLockEnabled, authenticateUser } from "@/utils/biometricAuth";
import { checkAndExecuteSelfDestructs } from "@/utils/selfDestructTimer";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(auth)/onboarding",
};

function useProtectedRoute(isAuthenticated: boolean | null, needsAppLock: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === null) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const isAppLockScreen = segments[segments.length - 1] === 'app-lock';

    console.log('Protected route check:', { isAuthenticated, needsAppLock, inAuthGroup, isAppLockScreen, segments });

    // If app lock is needed and not on app-lock screen, redirect to app-lock
    if (isAuthenticated && needsAppLock && !isAppLockScreen) {
      console.log('Redirecting to app-lock - authentication required');
      router.replace('/(auth)/app-lock');
      return;
    }

    // If not authenticated and not in auth group, redirect to onboarding
    if (!isAuthenticated && !inAuthGroup) {
      console.log('Redirecting to onboarding - not authenticated');
      router.replace('/(auth)/onboarding');
      return;
    }

    // If authenticated, app lock passed, and in auth group, redirect to home
    if (isAuthenticated && !needsAppLock && inAuthGroup && !isAppLockScreen) {
      console.log('Redirecting to home - authenticated and unlocked');
      router.replace('/(tabs)/(home)/');
    }
  }, [isAuthenticated, needsAppLock, segments, router]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [needsAppLock, setNeedsAppLock] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useProtectedRoute(isAuthenticated, needsAppLock);

  // Check authentication status and app lock
  const checkAuth = async () => {
    try {
      const authStatus = await AsyncStorage.getItem('is_authenticated');
      console.log('Auth status from storage:', authStatus);
      const authenticated = authStatus === 'true';
      setIsAuthenticated(authenticated);

      // If authenticated, check if app lock is enabled
      if (authenticated) {
        const lockEnabled = await isAppLockEnabled();
        console.log('App lock enabled:', lockEnabled);
        setNeedsAppLock(lockEnabled);
      } else {
        setNeedsAppLock(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setNeedsAppLock(false);
    }
  };

  // Initial auth check
  useEffect(() => {
    checkAuth();
    
    // Run self-destruct cleanup on app start
    checkAndExecuteSelfDestructs().catch(error => {
      console.error('Error running self-destruct cleanup:', error);
    });
  }, []);

  // Listen for app state changes to re-check auth and run cleanup
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App became active, rechecking auth and running cleanup');
        checkAuth();
        
        // Run self-destruct cleanup when app becomes active
        checkAndExecuteSelfDestructs().catch(error => {
          console.error('Error running self-destruct cleanup:', error);
        });
      } else if (nextAppState === 'background') {
        // When app goes to background, require app lock on next activation
        isAppLockEnabled().then(enabled => {
          if (enabled) {
            setNeedsAppLock(true);
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Set up a periodic check for auth changes (every 2 seconds when app is active)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuth();
    }, 2000);

    return () => clearInterval(interval);
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
    if (loaded && isAuthenticated !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isAuthenticated]);

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

  if (!loaded || isAuthenticated === null) {
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
      </ThemeProvider>
    </>
  );
}
