
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const themes: ThemeOption[] = [
  {
    id: 'light',
    name: 'Light Mode',
    description: 'Bright and clean interface',
    icon: 'sun.max.fill',
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Easy on the eyes in low light',
    icon: 'moon.fill',
  },
  {
    id: 'auto',
    name: 'Automatic',
    description: 'Follows system settings',
    icon: 'circle.lefthalf.filled',
  },
];

export default function ThemeScreen() {
  const [selectedTheme, setSelectedTheme] = useState('auto');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const theme = await AsyncStorage.getItem('app_theme');
      if (theme) {
        setSelectedTheme(theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const handleSelectTheme = async (themeId: string) => {
    try {
      await AsyncStorage.setItem('app_theme', themeId);
      setSelectedTheme(themeId);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Theme',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Choose Theme</Text>
            <Text style={styles.subtitle}>
              Select your preferred color scheme
            </Text>
          </View>

          <View style={[styles.themeList, { backgroundColor: colors.card }]}>
            {themes.map((theme, index) => (
              <React.Fragment key={theme.id}>
                <Pressable
                  style={styles.themeItem}
                  onPress={() => handleSelectTheme(theme.id)}
                >
                  <View style={styles.themeLeft}>
                    <View style={[styles.themeIcon, { backgroundColor: colors.primary }]}>
                      <IconSymbol name={theme.icon} size={24} color="#ffffff" />
                    </View>
                    <View style={styles.themeInfo}>
                      <Text style={styles.themeName}>{theme.name}</Text>
                      <Text style={styles.themeDescription}>{theme.description}</Text>
                    </View>
                  </View>
                  {selectedTheme === theme.id && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                  )}
                </Pressable>
                {index < themes.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.primary }]}>
            <IconSymbol name="paintbrush.fill" size={24} color="#ffffff" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Theme Settings</Text>
              <Text style={styles.infoText}>
                The app will update immediately when you change the theme
              </Text>
            </View>
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
    marginBottom: 24,
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
  },
  themeList: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  themeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 80,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    opacity: 0.9,
  },
});
