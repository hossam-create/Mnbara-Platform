import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';

export const initI18n = () => {
  i18next
    .use(Backend)
    .init({
      lng: process.env.DEFAULT_LANGUAGE || 'en',
      fallbackLng: 'en',
      supportedLngs: (process.env.SUPPORTED_LANGUAGES || 'en,ar').split(','),
      ns: ['common', 'auth', 'product', 'auction', 'payment'],
      defaultNS: 'common',
      backend: {
        loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
        addPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.missing.json')
      },
      interpolation: {
        escapeValue: false
      },
      saveMissing: true,
      missingKeyHandler: (lngs, ns, key) => {
        console.warn(`Missing translation: ${key} in ${ns} for ${lngs}`);
      }
    });

  return i18next;
};

export default i18next;
