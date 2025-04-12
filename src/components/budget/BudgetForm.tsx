import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CategoryPicker from '@/components/shared/CategoryPicker';
import { useCategories } from '@/hooks/useCategories';

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ open, onOpenChange }) => {
  const { addBudget, budgets } = useFinance();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { categories } = useCategories('expense');
  const currentLanguage = i18n.language;
  
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
  });
  
  // Reset form when dialog opens or closes
  useEffect(() => {
    if (open) {
      setFormData({
        categoryId: '',
        amount: '',
        period: 'monthly',
      });
    }
  }, [open]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.amount) {
      toast({
        title: t('common.error'),
        description: t('budgets.errors.fill_all_fields'),
        variant: 'destructive',
      });
      return;
    }
    
    // Check if budget for this category already exists
    const existingBudget = budgets.find(b => 
      b.category_id === formData.categoryId && b.period === formData.period
    );
    
    if (existingBudget) {
      toast({
        title: t('common.error'),
        description: t('budgets.already_exists'),
        variant: 'destructive',
      });
      return;
    }
    
    // Get the selected category for display
    const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
    if (!selectedCategory) {
      toast({
        title: t('common.error'),
        description: t('budgets.errors.invalid_category'),
        variant: 'destructive',
      });
      return;
    }
    
    // Add budget
    await addBudget({
      category_id: formData.categoryId,
      // We keep category for backward compatibility, but it's no longer the primary identifier
      category: currentLanguage === 'id' ? selectedCategory.id_name : selectedCategory.en_name,
      amount: parseFloat(formData.amount),
      period: formData.period,
    });
    
    // Show success message
    toast({
      title: t('common.success'),
      description: t('budgets.added'),
    });
    
    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-0 text-white">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold">{t('budgets.create')}</DialogTitle>
          <DialogClose className="rounded-full hover:bg-[#333] text-[#868686] hover:text-white">
            <X size={16} />
          </DialogClose>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <CategoryPicker
            type="expense"
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            label={t('budgets.category')}
            placeholder={t('budgets.select_category')}
          />
          
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[#868686]">{t('budgets.amount')}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              required
              className="bg-[#242425] border-0 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="period" className="text-[#868686]">{t('budgets.period')}</Label>
            <Select
              value={formData.period}
              onValueChange={(value) => setFormData({ ...formData, period: value })}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue placeholder={t('budgets.select_period')} />
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border-0 text-white">
                <SelectItem value="monthly" className="hover:bg-[#333] focus:bg-[#333]">{t('budgets.monthly')}</SelectItem>
                <SelectItem value="weekly" className="hover:bg-[#333] focus:bg-[#333]">{t('budgets.weekly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">
            {t('budgets.create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetForm;
