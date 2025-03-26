import React from 'react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '@/i18n';
import { Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

/**
 * LanguageSwitcher component
 * Allows users to toggle between English and Indonesian languages
 */
const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  const handleLanguageChange = (value: string) => {
    try {
      setAppLanguage(value);
    } catch (error) {
      console.error('Language change error:', error);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="language-select">{t('settings.language')}</Label>
      <div id="language-select">
        <Select
          value={i18n.language}
          onValueChange={handleLanguageChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('settings.language')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">
              <div className="flex items-center justify-between w-full">
                <span>{t('settings.english')}</span>
                {i18n.language === 'en' && <Check className="w-4 h-4 ml-2" />}
              </div>
            </SelectItem>
            <SelectItem value="id">
              <div className="flex items-center justify-between w-full">
                <span>{t('settings.indonesian')}</span>
                {i18n.language === 'id' && <Check className="w-4 h-4 ml-2" />}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LanguageSwitcher; 