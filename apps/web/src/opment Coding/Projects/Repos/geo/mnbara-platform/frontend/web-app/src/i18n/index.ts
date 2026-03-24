import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import arCommon from './ar/common.json';
import enCommon from './en/common.json';

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'ar',
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    resources: {
      ar: { common: arCommon },
      en: { common: enCommon }
    }
  });

export default i18n;
