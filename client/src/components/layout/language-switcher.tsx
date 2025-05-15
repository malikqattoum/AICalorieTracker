
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { useCallback } from 'react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback((lng: string) => {
    i18n.changeLanguage(lng);
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
  }, [i18n]);

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => changeLanguage('en')}>EN</Button>
      <Button variant="outline" size="sm" onClick={() => changeLanguage('ar')}>عربي</Button>
      <Button variant="outline" size="sm" onClick={() => changeLanguage('es')}>ES</Button>
      <Button variant="outline" size="sm" onClick={() => changeLanguage('fr')}>FR</Button>
      <Button variant="outline" size="sm" onClick={() => changeLanguage('pt')}>PT</Button>
    </div>
  );
}
