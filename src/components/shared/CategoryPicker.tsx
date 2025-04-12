
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useTranslation } from 'react-i18next';

interface CategoryPickerProps {
  type: 'income' | 'expense';
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  type,
  value,
  onValueChange,
  label,
  placeholder,
  className = '',
}) => {
  const { categories, isLoading } = useCategories(type);
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label className="text-[#868686]">{label}</Label>}
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={isLoading}
      >
        <SelectTrigger className="bg-[#242425] border-0 text-white">
          <SelectValue placeholder={placeholder || t('common.select_category')} />
        </SelectTrigger>
        <SelectContent className="bg-[#242425] border-0 text-white">
          {isLoading ? (
            <SelectItem value="loading" disabled className="hover:bg-[#333] focus:bg-[#333]">
              {t('common.loading')}
            </SelectItem>
          ) : (
            categories.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.id}
                className="hover:bg-[#333] focus:bg-[#333]"
              >
                {currentLanguage === 'id' ? category.id_name : category.en_name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryPicker;
