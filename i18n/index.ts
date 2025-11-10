
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import fr from './locales/fr.json';

const i18n = new I18n({
  en,
  fr,
});

// Set the locale once at the beginning of your app
i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'en';

// Enable fallback to English if translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
