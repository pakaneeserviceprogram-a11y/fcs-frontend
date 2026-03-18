import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './en.json';
import thTranslation from './th.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      th: { translation: thTranslation }
    },
    lng: 'th', // กำหนดภาษาเริ่มต้นเป็นภาษาไทย
    fallbackLng: 'en', // ถ้าหาคำแปลไม่เจอ ให้ถอยกลับไปใช้ภาษาอังกฤษ
    interpolation: {
      escapeValue: false // React จัดการเรื่องป้องกัน XSS ให้แล้ว
    }
  });

export default i18n;