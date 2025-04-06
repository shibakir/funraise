import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'cs', 'ru'],
    backend: {
      loadPath: path.join(__dirname, '@/locales/{{lng}}/{{ns}}.json'),
    },
    detection: {
      // order and from where user language should be detected
      order: ['querystring', 'cookie', 'header'],
      // keys or params to lookup language from
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupHeader: 'accept-language',
      // cache user language
      caches: ['cookie'],
    },
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // not needed for server-side
    },
  });

export default i18next; 