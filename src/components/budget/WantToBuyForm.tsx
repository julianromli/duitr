// Add comment indicating changes made to the file
// Created WantToBuyForm component for adding/editing wishlist items.
// Updated UI styling to match ExpenseForm.

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinance } from '@/context/FinanceContext';
import { WantToBuyItem } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Calendar, Tag, AlertTriangle } from 'lucide-react'; // Removed X icon
import { FormattedInput } from '@/components/ui/formatted-input';

// Zod schema for validation
const wantToBuySchema = z.object({
  name: z.string().min(1, { message: 'Item name is required' }),
  price: z.coerce.number().positive({ message: 'Price must be positive' }),
  category: z.enum(['Keinginan', 'Kebutuhan'], { required_error: 'Category is required' }),
  priority: z.enum(['Tinggi', 'Sedang', 'Rendah'], { required_error: 'Priority is required' }),
  estimated_date: z.date({ required_error: 'Estimated date is required' }),
  icon: z.string().optional().nullable(),
});

type WantToBuyFormData = z.infer<typeof wantToBuySchema>;

interface WantToBuyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: WantToBuyItem | null; // Pass item for editing
}

const WantToBuyForm: React.FC<WantToBuyFormProps> = ({ open, onOpenChange, itemToEdit }) => {
  const { addWantToBuyItem, updateWantToBuyItem } = useFinance();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { control, handleSubmit, register, reset, setValue, formState: { errors } } = useForm<WantToBuyFormData>({
    resolver: zodResolver(wantToBuySchema),
    defaultValues: {
      name: '',
      price: 0,
      category: 'Keinginan',
      priority: 'Sedang',
      estimated_date: new Date(),
      icon: null,
    }
  });

  const isEditing = !!itemToEdit;

  useEffect(() => {
    if (itemToEdit) {
      // Pre-fill form if editing
      reset({
        name: itemToEdit.name,
        price: itemToEdit.price,
        category: itemToEdit.category,
        priority: itemToEdit.priority,
        estimated_date: new Date(itemToEdit.estimated_date), // Convert string back to Date
        icon: itemToEdit.icon,
      });
    } else {
      // Reset to defaults when adding or dialog closes
      reset({
        name: '',
        price: 0,
        category: 'Keinginan',
        priority: 'Sedang',
        estimated_date: new Date(),
        icon: null,
      });
    }
  }, [itemToEdit, reset, open]); // Reset when itemToEdit changes or dialog opens/closes

  const onSubmit = (data: WantToBuyFormData) => {
    // Construct payload explicitly for add operation
    const addItemPayload = {
      name: data.name,
      price: data.price,
      category: data.category,
      priority: data.priority,
      estimated_date: data.estimated_date.toISOString().split('T')[0],
      icon: data.icon, // icon is optional
    };

    // Construct payload for update operation (includes all editable fields)
    const updateItemPayload = {
      ...addItemPayload, // Reuse common fields
      // is_purchased is handled separately or in the updateWantToBuyItem function
    };

    try {
      if (isEditing && itemToEdit) {
        updateWantToBuyItem({
          ...itemToEdit, // Include id, userId, created_at, is_purchased from original item
          ...updateItemPayload, // Apply validated & formatted changes
        });
        
        toast({
          title: t('common.success'),
          description: t('budget.wantToBuyUpdated')
        });
      } else {
        // Ensure addItemPayload matches the expected type for addWantToBuyItem
        addWantToBuyItem(addItemPayload);
        
        toast({
          title: t('common.success'),
          description: t('budget.wantToBuyAdded')
        });
      }
      onOpenChange(false); // Close dialog on success
    } catch (error) {
      // Errors are handled within the context functions with toasts
      console.error("Form submission error:", error);
      
      toast({
        title: t('common.error'),
        description: t('common.error_occurred'),
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-0 text-white">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold">{isEditing ? t('budget.editWantToBuy') : t('budget.addWantToBuy')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#868686]">{t('budget.itemName')}</Label>
            <Input
              id="name"
              {...register('name')}
              className="bg-[#242425] border-0 text-white"
              placeholder={t('budget.itemNamePlaceholder')}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Price */}
           <div className="space-y-2">
            <Label htmlFor="price" className="text-[#868686]">{t('budget.itemPrice')}</Label>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <FormattedInput
                  id="price"
                  value={field.value.toString()}
                  onChange={(value) => {
                    field.onChange(value ? parseFloat(value.replace(/\./g, '')) : 0);
                  }}
                  className="bg-[#242425] border-0 text-white"
                  placeholder="0"
                />
              )}
            />
             {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
          </div>

           {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-[#868686]">{t('budget.itemCategory')}</Label>
             <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-[#242425] border-0 text-white">
                        <SelectValue placeholder={t('budget.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#242425] border-0 text-white">
                        <SelectItem value="Keinginan" className="hover:bg-[#333] focus:bg-[#333]">{t('budget.keinginan')}</SelectItem>
                        <SelectItem value="Kebutuhan" className="hover:bg-[#333] focus:bg-[#333]">{t('budget.kebutuhan')}</SelectItem>
                      </SelectContent>
                    </Select>
                )}
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>

          {/* Priority */}
           <div className="space-y-2">
            <Label htmlFor="priority" className="text-[#868686]">{t('budget.itemPriority')}</Label>
             <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-[#242425] border-0 text-white">
                        <SelectValue placeholder={t('budget.selectPriority')} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#242425] border-0 text-white">
                        <SelectItem value="Tinggi" className="hover:bg-[#333] focus:bg-[#333]">{t('budget.priorityHigh')}</SelectItem>
                        <SelectItem value="Sedang" className="hover:bg-[#333] focus:bg-[#333]">{t('budget.priorityMedium')}</SelectItem>
                        <SelectItem value="Rendah" className="hover:bg-[#333] focus:bg-[#333]">{t('budget.priorityLow')}</SelectItem>
                      </SelectContent>
                    </Select>
                )}
             />
             {errors.priority && <p className="text-xs text-red-500">{errors.priority.message}</p>}
          </div>

           {/* Estimated Date */}
          <div className="space-y-2">
             <Label htmlFor="estimated_date" className="text-[#868686]">{t('budget.estimatedDate')}</Label>
             <Controller
                name="estimated_date"
                control={control}
                render={({ field }) => (
                    <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        className="[&>div>button]:bg-[#242425] [&>div>button]:rounded-md [&>div>button]:border-0"
                     />
                )}
            />
            {errors.estimated_date && <p className="text-xs text-red-500">{errors.estimated_date.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">
            {isEditing ? t('common.saveChanges') : t('common.addItem')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WantToBuyForm; 