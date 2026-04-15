// Migrated from vue-i18n to react-i18next
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { supportLocales } from '@/utils/shared';
import dayjs from './dayjs';

// Initialize i18next (replaces vue-i18n)
i18next.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {},
  interpolation: { escapeValue: false },
});

export function setI18nLanguage(locale: string) {
  i18next.changeLanguage(locale);
  document.querySelector('html')?.setAttribute('lang', locale);
}

export async function loadLocaleMessages(locale: string, location = 'newtab') {
  const isLocaleSupported = supportLocales?.includes(locale);
  if (!isLocaleSupported) return;

  try {
    const messages = await import(`@/locales/${location}/${locale}.json`);
    i18next.addResourceBundle(locale, 'translation', messages.default || messages, true, true);
    setI18nLanguage(locale);
    dayjs.locale(locale);
  } catch (e) {
    console.warn(`Failed to load locale: ${locale}/${location}`, e);
  }
}

// For backward compat with code doing `import vueI18n from '@/lib/vueI18n'`
export default {
  global: {
    locale: { value: i18next.language || 'en' },
    t: (key: string, ...args: any[]) => i18next.t(key, ...args),
  },
};
