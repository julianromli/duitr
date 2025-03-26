import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en.json';
import idTranslation from './locales/id.json';

// Valid languages - only English and Indonesian are supported
const VALID_LANGUAGES = ['en', 'id'];

/**
 * Set the application language
 * @param lang - The language code to set ('en' or 'id' only)
 * @throws Error if an unsupported language is provided
 */
export function setAppLanguage(lang: string): void {
  if (!VALID_LANGUAGES.includes(lang)) {
    throw new Error('Only English (en) and Indonesian (id) are supported.');
  }
  i18n.changeLanguage(lang);
  
  // Save language preference to localStorage
  localStorage.setItem('preferredLanguage', lang);
}

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      id: {
        translation: idTranslation
      }
    },
    fallbackLng: 'en',
    // Allow only supported languages
    supportedLngs: VALID_LANGUAGES,
    // If a language is detected that is not in supportedLngs, use fallbackLng
    nonExplicitSupportedLngs: false,
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator'],
      // Key to use in localStorage
      lookupLocalStorage: 'preferredLanguage',
      // Cache language detection
      caches: ['localStorage'],
    }
  });

export default i18n; 