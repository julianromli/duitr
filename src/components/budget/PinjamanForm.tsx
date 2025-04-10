// Add comment indicating changes made to the file
// Created PinjamanForm component for adding/editing debt/credit items.

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinance } from '@/context/FinanceContext';
import { PinjamanItem } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

// Zod schema for validation
const pinjamanSchema = z.object({
  name: z.string().min(1, { message: 'Transaction name is required' }),
  category: z.enum(['Utang', 'Piutang'], { required_error: 'Category is required' }),
  due_date: z.date({ required_error: 'Due date is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  icon: z.string().optional().nullable(),
});

type PinjamanFormData = z.infer<typeof pinjamanSchema>;

interface PinjamanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: PinjamanItem | null;
}

const PinjamanForm: React.FC<PinjamanFormProps> = ({ open, onOpenChange, itemToEdit }) => {
  const { addPinjamanItem, updatePinjamanItem } = useFinance();
  const { t } = useTranslation();

  const { control, handleSubmit, register, reset, formState: { errors } } = useForm<PinjamanFormData>({
    resolver: zodResolver(pinjamanSchema),
    defaultValues: {
      name: '',
      category: 'Utang',
      due_date: new Date(),
      amount: 0,
      icon: null,
    }
  });

  const isEditing = !!itemToEdit;

  useEffect(() => {
    if (itemToEdit) {
      reset({
        name: itemToEdit.name,
        category: itemToEdit.category,
        due_date: new Date(itemToEdit.due_date),
        amount: itemToEdit.amount,
        icon: itemToEdit.icon,
      });
    } else {
      reset({
        name: '',
        category: 'Utang',
        due_date: new Date(),
        amount: 0,
        icon: null,
      });
    }
  }, [itemToEdit, reset, open]);

  const onSubmit = (data: PinjamanFormData) => {
    const itemPayload = {
      name: data.name,
      category: data.category,
      due_date: data.due_date.toISOString().split('T')[0],
      amount: data.amount,
      icon: data.icon,
    };

    try {
      if (isEditing && itemToEdit) {
        updatePinjamanItem({
          ...itemToEdit,
          ...itemPayload,
        });
      } else {
        addPinjamanItem(itemPayload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-none text-white dark:bg-gray-800 dark:text-gray-200">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('budget.editPinjaman') : t('budget.addPinjaman')}</DialogTitle>
           <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Transaction Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#868686] dark:text-gray-400">{t('budget.pinjamanName')}</Label>
            <Input
              id="name"
              {...register('name')}
              className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200"
              placeholder={t('budget.pinjamanNamePlaceholder')}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t('budget.pinjamanAmount')}</Label>
            <Input
              id="amount"
              type="number"
              {...register('amount')}
              placeholder="0"
            />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

           {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-[#868686] dark:text-gray-400">{t('budget.pinjamanCategory')}</Label>
             <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200">
                        <SelectValue placeholder={t('budget.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200">
                        <SelectItem value="Utang" className="hover:bg-[#333] focus:bg-[#333] dark:hover:bg-gray-600 dark:focus:bg-gray-600">{t('budget.utang')}</SelectItem>
                        <SelectItem value="Piutang" className="hover:bg-[#333] focus:bg-[#333] dark:hover:bg-gray-600 dark:focus:bg-gray-600">{t('budget.piutang')}</SelectItem>
                      </SelectContent>
                    </Select>
                )}
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>

           {/* Due Date */}
          <div className="space-y-2">
             <Label htmlFor="due_date" className="text-[#868686] dark:text-gray-400">{t('budget.dueDate')}</Label>
             <Controller
                name="due_date"
                control={control}
                render={({ field }) => (
                    <div className="bg-[#242425] rounded-md border-0 text-white dark:bg-gray-700 dark:text-gray-200">
                        <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                         />
                     </div>
                )}
            />
            {errors.due_date && <p className="text-xs text-red-500">{errors.due_date.message}</p>}
          </div>

          {/* Optional Icon */}
          {/* <div className="space-y-2">
            <Label htmlFor="icon" className="text-[#868686] dark:text-gray-400">{t('budget.itemIcon')} (Optional)</Label>
            <Input
              id="icon"
              {...register('icon')}
              className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200"
              placeholder={t('budget.iconPlaceholder')}
            />
             {errors.icon && <p className="text-xs text-red-500">{errors.icon.message}</p>}
          </div> */}

          <DialogFooter>
            <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
              {isEditing ? t('common.saveChanges') : t('common.addItem')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PinjamanForm; 