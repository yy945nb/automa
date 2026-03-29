import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const supportedLocales = ['en', 'zh', 'zh-tw', 'fr', 'it', 'uk', 'tr', 'es', 'pt'];

export async function loadLocaleMessages(locale: string, page?: string): Promise<void> {
  try {
    const baseMessages = await import(
      /* webpackChunkName: "locales/locale-[request]" */ `../locales/${locale}/common.json`
    );
    i18n.addResourceBundle(locale, 'translation', baseMessages.default, true, true);

    if (page) {
      try {
        const pageMessages = await import(
          /* webpackChunkName: "locales/locale-[request]" */ `../locales/${locale}/${page}.json`
        );
        i18n.addResourceBundle(locale, 'translation', pageMessages.default, true, true);
      } catch {
        // page-specific file may not exist
      }
    }
  } catch (error) {
    console.error(`Failed to load locale ${locale}:`, error);
  }
}

export async function setI18nLanguage(locale: string): Promise<void> {
  const validLocale = supportedLocales.includes(locale) ? locale : 'en';
  await i18n.changeLanguage(validLocale);
}

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {},
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
