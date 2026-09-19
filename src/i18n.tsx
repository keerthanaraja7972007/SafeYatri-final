import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'ta';

const translations = {
  en: {
    language: 'Language', english: 'English', tamil: 'Tamil',
    home: 'Home', features: 'Features', howItWorks: 'How It Works', exploreTamilNadu: 'Explore Tamil Nadu', safety: 'Safety', arSafety: 'AR Safety',
    getStarted: 'Get Started', toggleMenu: 'Toggle menu', openArSafety: 'Open AR Safety View',
    emergency: 'Emergency', safetyMap: 'Safety Map', enableLocation: 'Enable location', stopLocation: 'Stop location',
    womenSafetyMode: 'Women Safety Mode', enableCamera: 'Enable camera', stopCamera: 'Stop camera', useCurrentLocation: 'Use current location',
    activateSos: 'Activate SOS', returnToSafetyMap: 'Return to Safety Map', refresh: 'Refresh',
  },
  ta: {
    language: 'மொழி', english: 'ஆங்கிலம்', tamil: 'தமிழ்',
    home: 'முகப்பு', features: 'அம்சங்கள்', howItWorks: 'எப்படி செயல்படுகிறது', exploreTamilNadu: 'தமிழ்நாட்டை ஆராயுங்கள்', safety: 'பாதுகாப்பு', arSafety: 'AR பாதுகாப்பு',
    getStarted: 'தொடங்குங்கள்', toggleMenu: 'பட்டியை மாற்றுக', openArSafety: 'AR பாதுகாப்புக் காட்சியைத் திறக்கவும்',
    emergency: 'அவசரநிலை', safetyMap: 'பாதுகாப்பு வரைபடம்', enableLocation: 'இருப்பிடத்தை இயக்குக', stopLocation: 'இருப்பிடத்தை நிறுத்துக',
    womenSafetyMode: 'பெண்கள் பாதுகாப்பு முறை', enableCamera: 'கேமராவை இயக்குக', stopCamera: 'கேமராவை நிறுத்துக', useCurrentLocation: 'தற்போதைய இருப்பிடத்தைப் பயன்படுத்துக',
    activateSos: 'SOS-ஐ இயக்குக', returnToSafetyMap: 'பாதுகாப்பு வரைபடத்திற்குத் திரும்புக', refresh: 'புதுப்பிக்கவும்',
  },
} as const;

type TranslationKey = keyof typeof translations.en;
type I18nContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string };
const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('safeyatri-language') === 'ta' ? 'ta' : 'en');
  useEffect(() => { localStorage.setItem('safeyatri-language', language); document.documentElement.lang = language === 'ta' ? 'ta' : 'en'; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => translations[language][key] }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslation must be used inside LanguageProvider.');
  return context;
}
