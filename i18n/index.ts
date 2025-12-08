
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import { EventEmitter } from 'events';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import ht from './locales/ht.json';

// Create event emitter for language changes
export const languageEmitter = new EventEmitter();

const i18n = new I18n({
  en,
  fr,
  es,
  ht,
});

// Enable fallback to English if translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Detect and set initial locale automatically
const detectAndSetLocale = () => {
  const deviceLocales = Localization.getLocales();
  const deviceLanguage = deviceLocales[0]?.languageCode ?? 'en';
  
  // Check if we support the device language
  const supportedLanguages = ['en', 'fr', 'es', 'ht'];
  const locale = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
  
  i18n.locale = locale;
  console.log('Auto-detected locale:', locale);
  
  return locale;
};

// Initialize with auto-detected locale
detectAndSetLocale();

// Function to change language and notify listeners
export const changeLanguage = (locale: string) => {
  i18n.locale = locale;
  console.log('Language changed to:', locale);
  
  // Emit language change event
  languageEmitter.emit('languageChanged', locale);
};

// Function to get current locale
export const getCurrentLocale = (): string => {
  return i18n.locale;
};

// Function to get available locales
export const getAvailableLocales = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen' },
  ];
};

// Function to detect device language
export const detectDeviceLanguage = (): string => {
  return detectAndSetLocale();
};

// Listen for system locale changes (Android)
if (Platform.OS === 'android') {
  // On Android, we can listen for locale changes
  // This would require native module implementation for full support
  console.log('Locale change detection enabled for Android');
}

export default i18n;

// Re-export Platform for use in this file
import { Platform } from 'react-native';
