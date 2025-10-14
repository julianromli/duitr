

// Add comment indicating changes made to the file
// Created PinjamanForm component for adding/editing debt/credit items.
// Updated UI styling to match ExpenseForm.
// Fixed date handling to prevent timezone shifts when saving dates.
// Fixed user_id field to match PinjamanItem type definition.

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { FormattedInput } from '@/components/ui/formatted-input';
import { supabase } from '@/integrations/supabase/client';

// Zod schema for validation
const pinjamanSchema = z.object({
  name: z.string().min(1, { message: 'Transaction name is required' }),
  category: z.enum(['Utang', 'Piutang'], { required_error: 'Category is required' }),
  due_date: z.date({ required_error: 'Due date is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  icon: z.string().optional().nullable(),
  description: z.string().optional().default(''),
  lender_name: z.string().optional().default(''),
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
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  const { control, handleSubmit, register, reset, formState: { errors } } = useForm<PinjamanFormData>({
    resolver: zodResolver(pinjamanSchema),
    defaultValues: {
      name: '',
      category: 'Utang',
      due_date: new Date(),
      amount: 0,
      icon: null,
      description: '',
      lender_name: '',
    }
  });

  const isEditing = !!itemToEdit;

  useEffect(() => {
    if (itemToEdit) {
      reset({
        name: itemToEdit.name,
        category: itemToEdit.category as 'Utang' | 'Piutang',
        due_date: new Date(itemToEdit.due_date || new Date()),
        amount: itemToEdit.amount,
        icon: itemToEdit.icon || null,
        description: itemToEdit.description || '',
        lender_name: itemToEdit.lender_name || '',
      });
    } else {
      reset({
        name: '',
        category: 'Utang',
        due_date: new Date(),
        amount: 0,
        icon: null,
        description: '',
        lender_name: '',
      });
    }
  }, [itemToEdit, reset, open]);

  const onSubmit = (data: PinjamanFormData) => {
    // Format date properly to avoid timezone shifts
    const selectedDate = data.due_date;
    // Create a date string in YYYY-MM-DD format that preserves the day regardless of timezone
    const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    console.log("Original selected date:", selectedDate);
    console.log("Formatted date to save:", formattedDate);
    
    const itemPayload = {
      name: data.name,
      category: data.category,
      due_date: formattedDate,
      amount: data.amount,
      icon: data.icon,
      description: data.description,
      lender_name: data.lender_name,
      user_id: currentUser?.id || '', // Add user_id field
    };

    try {
      if (isEditing && itemToEdit) {
        updatePinjamanItem({
          ...itemToEdit,
          ...itemPayload,
        });
        
        toast({
          title: t('common.success'),
          description: t('budget.pinjamanUpdated'),
        });
      } else {
        addPinjamanItem(itemPayload);
        
        toast({
          title: t('common.success'),
          description: t('budget.pinjamanAdded'),
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: t('common.error'),
        description: t('common.error_occurred'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-0 text-white">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold">{isEditing ? t('budget.editPinjaman') : t('budget.addPinjaman')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Transaction Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#868686]">{t('budget.pinjamanName')}</Label>
            <Input
              id="name"
              {...register('name')}
              className="bg-[#242425] border-0 text-white"
              placeholder={t('budget.pinjamanNamePlaceholder')}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[#868686]">{t('transactions.amount')}</Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <FormattedInput
                  id="amount"
                  value={field.value.toString()}
                  onChange={(value) => {
                    field.onChange(value ? parseFloat(value.replace(/\./g, '')) : 0);
                  }}
                  className="bg-[#242425] border-0 text-white"
                  placeholder="0"
                />
              )}
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
          </div>

           {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-[#868686]">{t('budget.pinjamanCategory')}</Label>
             <Controller
                name="category"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="bg-[#242425] border-0 text-white">
                        <SelectValue placeholder={t('budget.selectCategory')} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#242425] border-0 text-white">
                        <SelectItem value="Utang" className="hover:bg-[#333] focus:bg-[#333]">{t('budget.utang')}</SelectItem>
                        <SelectItem value="Piutang" className="hover:bg-[#333] focus:bg-[#333]">{t('budget.piutang')}</SelectItem>
                      </SelectContent>
                    </Select>
                )}
            />
            {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
          </div>

           {/* Due Date */}
          <div className="space-y-2">
             <Label htmlFor="due_date" className="text-[#868686]">{t('budget.dueDate')}</Label>
             <Controller
                name="due_date"
                control={control}
                render={({ field }) => (
                    <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                        className="[&>div>button]:bg-[#242425] [&>div>button]:rounded-md [&>div>button]:border-0"
                     />
                )}
            />
            {errors.due_date && <p className="text-xs text-red-500">{errors.due_date.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">
            {isEditing ? t('common.saveChanges') : t('common.addItem')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PinjamanForm;
