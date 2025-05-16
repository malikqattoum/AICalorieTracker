import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
  }, [i18n]);

  return (
    <select
      className="border border-neutral-300 rounded-md px-2 py-1 text-sm bg-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
      value={i18n.language}
      onChange={changeLanguage}
      aria-label="Select language"
    >
      <option value="en">English</option>
      <option value="ar">عربي</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
      <option value="pt">Português</option>
    </select>
  );
}
