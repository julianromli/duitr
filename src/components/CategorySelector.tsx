/**
 * CategorySelector Component
 * 
 * Simplified selector using integer IDs and translation helpers.
 * Provides quick category creation without leaving the form.
 * 
 * Key Features:
 * - Integer category IDs (no string conversion)
 * - Automatic language switching via getDisplayName
 * - Quick create dialog for custom categories
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Check, ChevronsUpDown, X, Circle, Square, Star, Heart, Home, Car, ShoppingCart, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/useCategories';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  value?: number | null;          // Integer category ID
  onValueChange: (value: number) => void;
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

// Quick icon options with Lucide components
const QUICK_ICONS = [
  { name: 'circle', icon: Circle, label: 'Circle' },
  { name: 'square', icon: Square, label: 'Square' },
  { name: 'star', icon: Star, label: 'Star' },
  { name: 'heart', icon: Heart, label: 'Heart' },
  { name: 'home', icon: Home, label: 'Home' },
  { name: 'car', icon: Car, label: 'Car' },
  { name: 'shopping-cart', icon: ShoppingCart, label: 'Shopping' },
  { name: 'coffee', icon: Coffee, label: 'Coffee' }
];

// Quick color options with names
const QUICK_COLORS = [
  { value: '#EF4444', name: 'Red' },
  { value: '#F97316', name: 'Orange' },
  { value: '#F59E0B', name: 'Amber' },
  { value: '#22C55E', name: 'Green' },
  { value: '#3B82F6', name: 'Blue' },
  { value: '#8B5CF6', name: 'Purple' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#6B7280', name: 'Gray' }
];

const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onValueChange,
  type,
  placeholder,
  disabled = false,
  className
}) => {
  const { t } = useTranslation();
  const {
    getByType,
    getDisplayName,
    findById,
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

  const availableCategories = getByType(type);
  const selectedCategory = value ? findById(value) : null;

  const resetQuickCreateForm = () => {
    setQuickCreateData({
      name: '',
      icon: 'circle',
      color: '#6B7280'
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickCreateData.name.trim() && !isCreating) {
      handleQuickCreate();
    }
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
      
      // The new category will be automatically selected after cache updates
      setTimeout(() => {
        const newCategory = getByType(type).find(
          cat => getDisplayName(cat).toLowerCase() === quickCreateData.name.toLowerCase().trim()
        );
        if (newCategory) {
          onValueChange(newCategory.category_id);
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
      <Popover open={open} onOpenChange={setOpen} modal={true}>
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
                  category={selectedCategory.category_id} 
                  size="sm" 
                />
                <span>{getDisplayName(selectedCategory)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t('categories.selectCategory')}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
          sideOffset={4}
          style={{ zIndex: 100 }}
          onInteractOutside={(e) => {
            // Prevent closing when clicking inside the popover
            if (e.target instanceof Element && e.target.closest('[role="dialog"]')) {
              e.preventDefault();
            }
          }}
        >
          <Command 
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <CommandInput 
              placeholder={t('categories.searchCategoriesPlaceholder')} 
              className="h-9"
              autoFocus
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
                    key={category.category_id}
                    value={getDisplayName(category)}
                    onSelect={() => {
                      onValueChange(category.category_id);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <CategoryIcon 
                        category={category.category_id} 
                        size="sm" 
                      />
                      <span>{getDisplayName(category)}</span>
                      {category.user_id && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          {t('categories.custom')}
                        </span>
                      )}
                    </div>
                    {value === category.category_id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Create Category Dialog - Enhanced UI */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md p-6">
          {/* Header Section */}
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-semibold">
              {t('categories.quickCreate', 'Quick Create Category')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t('categories.quickCreateDescriptionShort', 'Choose a name, icon, and color for your new category')}
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          {/* Form Section */}
          <div className="space-y-6">
            {/* Category Name Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="quick-category-name" className="text-sm font-medium">
                  {t('categories.name', 'Category Name')}
                </Label>
                <span className={cn(
                  "text-xs",
                  quickCreateData.name.length > 45 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {quickCreateData.name.length}/50
                </span>
              </div>
              <div className="relative">
                <Input
                  id="quick-category-name"
                  value={quickCreateData.name}
                  onChange={(e) => setQuickCreateData(prev => ({ ...prev, name: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder={t('categories.namePlaceholder', 'e.g., Groceries, Salary, Investment')}
                  maxLength={50}
                  autoFocus
                  className="pr-10"
                />
                {quickCreateData.name && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                    onClick={() => setQuickCreateData(prev => ({ ...prev, name: '' }))}
                    type="button"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                )}
              </div>
            </div>

            {/* Icon Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t('categories.icon', 'Icon')}
              </Label>
              <TooltipProvider delayDuration={300}>
                <div className="grid grid-cols-4 gap-3">
                  {QUICK_ICONS.map(({ name, icon: IconComponent, label }) => (
                    <Tooltip key={name}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickCreateData(prev => ({ ...prev, icon: name }))}
                          className={cn(
                            "h-14 w-14 p-0 rounded-xl transition-all duration-200",
                            "hover:scale-105 hover:ring-1 hover:ring-primary/50",
                            quickCreateData.icon === name && "ring-2 ring-primary scale-110 bg-primary/10"
                          )}
                          type="button"
                          aria-label={label}
                        >
                          <IconComponent className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {t('categories.color', 'Color')}
              </Label>
              <TooltipProvider delayDuration={300}>
                <div className="grid grid-cols-4 gap-3">
                  {QUICK_COLORS.map(({ value, name }) => (
                    <Tooltip key={value}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickCreateData(prev => ({ ...prev, color: value }))}
                          className={cn(
                            "h-14 w-14 p-0 rounded-xl transition-all duration-200 border-2",
                            "hover:scale-105 hover:ring-2 hover:ring-white/50",
                            quickCreateData.color === value && "ring-4 ring-white shadow-lg"
                          )}
                          style={{ backgroundColor: value }}
                          type="button"
                          aria-label={name}
                        >
                          {quickCreateData.color === value && (
                            <Check className="h-6 w-6 text-white drop-shadow-md" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Footer Actions */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetQuickCreateForm();
              }}
              disabled={isCreating}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleQuickCreate}
              disabled={!quickCreateData.name.trim() || isCreating}
              className="min-w-[100px]"
            >
              {isCreating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('common.creating', 'Creating...')}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t('common.create', 'Create')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategorySelector;