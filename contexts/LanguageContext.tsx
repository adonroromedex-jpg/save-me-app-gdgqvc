
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import i18n, { changeLanguage, getCurrentLocale, languageEmitter } from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState(getCurrentLocale());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Load saved language preference
    loadSavedLanguage();

    // Listen for language changes
    const handleLanguageChange = (newLocale: string) => {
      setLocaleState(newLocale);
      forceUpdate(prev => prev + 1); // Force re-render
    };

    languageEmitter.on('languageChanged', handleLanguageChange);

    return () => {
      languageEmitter.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLocale = await AsyncStorage.getItem('app_language');
      if (savedLocale) {
        changeLanguage(savedLocale);
        setLocaleState(savedLocale);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    }
  };

  const setLocale = async (newLocale: string) => {
    try {
      await AsyncStorage.setItem('app_language', newLocale);
      changeLanguage(newLocale);
      setLocaleState(newLocale);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string, options?: any): string => {
    return i18n.t(key, options);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
