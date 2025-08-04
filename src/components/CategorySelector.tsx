// Component: CategorySelector
// Description: Enhanced category selector with "Add New Category" option for transaction forms
// Provides quick category creation without leaving the transaction form

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCategories } from '@/hooks/useCategories';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Category } from '@/types/categories';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  type: 'income' | 'expense';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface QuickCreateFormData {
  name: string;
  icon: string;
  color: string;
}

const QUICK_ICONS = ['circle', 'square', 'star', 'heart', 'home', 'car', 'shopping-cart', 'coffee'];
const QUICK_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onValueChange,
  type,
  placeholder,
  disabled = false,
  className
}) => {
  const { t, i18n } = useTranslation();
  const {
    categories,
    getCategoriesByType,
    createCategory,
    isCreating
  } = useCategories();

  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState<QuickCreateFormData>({
    name: '',
    icon: 'circle',
    color: '#6B7280'
  });

  const availableCategories = getCategoriesByType(type);
  const selectedCategory = categories.find(cat => cat.id === value);

  const resetQuickCreateForm = () => {
    setQuickCreateData({
      name: '',
      icon: 'circle',
      color: '#6B7280'
    });
  };

  const handleQuickCreate = async () => {
    if (!quickCreateData.name.trim()) return;

    try {
      await createCategory({
        name: quickCreateData.name.trim(),
        type,
        icon: quickCreateData.icon,
        color: quickCreateData.color
      });
      
      setShowCreateDialog(false);
      resetQuickCreateForm();
      
      // The new category will be automatically selected via the mutation's onSuccess callback
      // We need to wait a bit for the cache to update
      setTimeout(() => {
        const newCategory = getCategoriesByType(type).find(
          cat => (i18n.language === 'id' ? cat.id_name : cat.en_name).toLowerCase() === quickCreateData.name.toLowerCase().trim()
        );
        if (newCategory) {
          onValueChange(newCategory.id);
        }
      }, 100);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleOpenCreateDialog = () => {
    setOpen(false);
    setShowCreateDialog(true);
    resetQuickCreateForm();
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            {selectedCategory ? (
              <div className="flex items-center space-x-2">
                <CategoryIcon 
                  category={selectedCategory.id} 
                  size="sm" 
                />
                <span>{i18n.language === 'id' ? selectedCategory.id_name : selectedCategory.en_name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t('categories.selectCategory')}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={t('categories.searchCategories')} 
              className="h-9" 
            />
            <CommandList>
              <CommandEmpty>{t('categories.noResults')}</CommandEmpty>
              
              {/* Add New Category Option */}
              <CommandGroup>
                <CommandItem
                  onSelect={handleOpenCreateDialog}
                  className="flex items-center space-x-2 text-blue-600 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('categories.addNew')}</span>
                </CommandItem>
              </CommandGroup>
              
              <CommandSeparator />
              
              {/* Existing Categories */}
              <CommandGroup heading={t(`categories.${type}Categories`)}>
                {availableCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={i18n.language === 'id' ? category.id_name : category.en_name}
                    onSelect={() => {
                      onValueChange(category.id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <CategoryIcon 
                        category={category.id} 
                        size="sm" 
                      />
                      <span>{i18n.language === 'id' ? category.id_name : category.en_name}</span>
                      {category.user_id && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          {t('categories.custom')}
                        </span>
                      )}
                    </div>
                    {value === category.id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Create Category Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('categories.quickCreate')}</DialogTitle>
            <DialogDescription>
              {t('categories.quickCreateDescription', { type: t(`categories.${type}`) })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="quick-category-name">{t('categories.name')}</Label>
              <Input
                id="quick-category-name"
                value={quickCreateData.name}
                onChange={(e) => setQuickCreateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('categories.namePlaceholder')}
                maxLength={50}
                autoFocus
              />
            </div>

            <div>
              <Label>{t('categories.icon')}</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {QUICK_ICONS.map((icon) => (
                  <Button
                    key={icon}
                    variant={quickCreateData.icon === icon ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuickCreateData(prev => ({ ...prev, icon }))}
                    className="h-10 w-10 p-0"
                    type="button"
                  >
                    <span className="text-lg">{icon}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t('categories.color')}</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {QUICK_COLORS.map((color) => (
                  <Button
                    key={color}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickCreateData(prev => ({ ...prev, color }))}
                    className="h-10 w-10 p-0 border-2"
                    style={{ 
                      backgroundColor: quickCreateData.color === color ? color : 'transparent',
                      borderColor: quickCreateData.color === color ? color : '#e5e7eb'
                    }}
                    type="button"
                  >
                    <div 
                      className="h-6 w-6 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetQuickCreateForm();
              }}
              disabled={isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleQuickCreate}
              disabled={!quickCreateData.name.trim() || isCreating}
            >
              {isCreating ? t('common.creating') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategorySelector;