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

// Get stored language or detect from browser
const getInitialLanguage = (): string => {
  try {
    // Check localStorage first
    const stored = localStorage.getItem('preferredLanguage');
    if (stored && VALID_LANGUAGES.includes(stored)) {
      return stored;
    }
    
    // Detect from browser navigator
    const browserLang = navigator.language.split('-')[0];
    if (VALID_LANGUAGES.includes(browserLang)) {
      return browserLang;
    }
  } catch (e) {
    console.warn('Error detecting language:', e);
  }
  
  // Default to Indonesian
  return 'id';
};

const initialLanguage = getInitialLanguage();

// Initialize i18next synchronously with bundled translations
const i18nInstance = i18n
  .use(LanguageDetector)
  .use(initReactI18next);

// Synchronous initialization to prevent loading errors
i18nInstance.init({
  resources: {
    en: {
      translation: enTranslation
    },
    id: {
      translation: idTranslation
    }
  },
  lng: initialLanguage,
  fallbackLng: 'id',
  supportedLngs: VALID_LANGUAGES,
  nonExplicitSupportedLngs: false,
  debug: false, // Disable debug to reduce console noise
  interpolation: {
    escapeValue: false
  },
  detection: {
    order: ['localStorage', 'navigator'],
    lookupLocalStorage: 'preferredLanguage',
    caches: ['localStorage'],
  },
  // Critical: ensure synchronous loading since resources are bundled
  initImmediate: false,
  react: {
    useSuspense: false,
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p']
  },
  // Reduce loading issues
  load: 'languageOnly',
  cleanCode: true,
  // Ensure translations are loaded immediately
  partialBundledLanguages: false
});

export default i18nInstance;