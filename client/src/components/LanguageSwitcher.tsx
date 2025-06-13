import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { i18n, type Language } from './i18n';

interface LanguageSwitcherProps {
  onLanguageChange?: () => void;
}

export function LanguageSwitcher({ onLanguageChange }: LanguageSwitcherProps) {
  const [currentLang, setCurrentLang] = useState<Language>(i18n.getCurrentLanguage());

  const changeLanguage = (lang: Language) => {
    i18n.changeLanguage(lang);
    setCurrentLang(lang);
    if (onLanguageChange) {
      onLanguageChange();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground/70">{i18n.t('language')}:</span>
      <Select value={currentLang} onValueChange={(value: Language) => changeLanguage(value)}>
        <SelectTrigger className="w-20 h-8 text-xs border-primary/20 bg-card/80">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en" className="text-xs">EN</SelectItem>
          <SelectItem value="es" className="text-xs">ES</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}