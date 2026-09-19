import { Languages } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function LanguageSelector({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useTranslation();
  return <label className={`inline-flex items-center gap-2 text-sm font-medium text-saf-muted ${className}`}>
    <Languages className="h-4 w-4" aria-hidden="true" />
    <span className="sr-only">{t('language')}</span>
    <select value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'ta')} aria-label={t('language')} className="rounded-lg border border-saf-border bg-saf-white px-2 py-1.5 text-saf-text focus:outline-none focus:ring-2 focus:ring-saf-blue">
      <option value="en">{t('english')}</option>
      <option value="ta">{t('tamil')}</option>
    </select>
  </label>;
}
