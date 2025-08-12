import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './translations/en';
import es from './translations/es';
import fr from './translations/fr';

// Create i18n instance
const i18n = new I18n({
  en,
  es,
  fr,
});

// Set the locale once at the beginning of your app
export async function setupI18n() {
  try {
    // Try to get saved language
    const savedLanguage = await AsyncStorage.getItem('language');
    
    if (savedLanguage) {
      i18n.locale = savedLanguage;
    } else {
      // Use device locale if no saved language
      i18n.locale = Localization.locale.split('-')[0];
      
      // Default to English if the locale isn't available
      if (!i18n.translations[i18n.locale]) {
        i18n.locale = 'en';
      }
      
      // Save the initial language
      await AsyncStorage.setItem('language', i18n.locale);
    }
  } catch (error) {
    console.log('Failed to load language:', error);
    i18n.locale = 'en';
  }
  
  // Set fallback locale
  i18n.defaultLocale = 'en';
  i18n.enableFallback = true;
}

// Function to change language
export async function changeLanguage(locale: string) {
  try {
    i18n.locale = locale;
    await AsyncStorage.setItem('language', locale);
    return true;
  } catch (error) {
    console.log('Failed to save language:', error);
    return false;
  }
}

export default i18n;