import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslation } from 'react-i18next';
import { getLocalizedCategoriesByType } from '@/utils/categoryUtils';
import i18next from 'i18next';
import CategoryIcon from '@/components/shared/CategoryIcon';

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, onOpenChange }) => {
  const { wallets, addTransaction } = useFinance();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    description: '',
    walletId: '',
  });
  
  const [categories, setCategories] = useState<{id: string | number; name: string}[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // Load expense categories
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const fetchedCategories = await getLocalizedCategoriesByType('expense', i18next);
        
        // Sort categories by ID to maintain consistent order
        const sortedCategories = [...fetchedCategories].sort((a, b) => {
          const idA = typeof a.id === 'number' ? a.id : Number(a.id);
          const idB = typeof b.id === 'number' ? b.id : Number(b.id);
          return idA - idB;
        });
        
        setCategories(sortedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast({
          title: t('common.error'),
          description: t('categories.error.load'),
          variant: 'destructive'
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, [t]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast({
        title: t('common.error'),
        description: t('transactions.errors.select_date'),
        variant: 'destructive',
      });
      return;
    }
    
    // Validation
    if (!formData.amount || !formData.categoryId || !formData.description || !formData.walletId) {
      toast({
        title: t('common.error'),
        description: t('transactions.errors.fill_all_fields'),
        variant: 'destructive',
      });
      return;
    }
    
    // Format date to ISO string
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Add transaction with required parameters
    addTransaction({
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId,
      description: formData.description,
      date: dateString,
      type: 'expense',
      walletId: formData.walletId,
    });
    
    // Reset form
    setFormData({
      amount: '',
      categoryId: '',
      description: '',
      walletId: '',
    });
    setSelectedDate(new Date());
    
    // Show success message
    toast({
      title: t('common.success'),
      description: t('transactions.expense_added'),
    });
    
    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-none text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t('transactions.add_expense')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[#868686]">{t('transactions.amount')}</Label>
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
            <Label htmlFor="categoryId" className="text-[#868686]">{t('transactions.category')}</Label>
            <Select
              value={formData.categoryId ? String(formData.categoryId) : ""}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              disabled={isLoadingCategories}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue placeholder={
                  isLoadingCategories ? t('common.loading') : t('transactions.categoryform')
                } />
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border-0 text-white max-h-[300px]">
                {categories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={String(category.id)}
                    className="hover:bg-[#333] focus:bg-[#333]"
                  >
                    <div className="flex items-center">
                      <CategoryIcon category={String(category.id)} size="sm" />
                      <span className="ml-2">{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="walletId" className="text-[#868686]">{t('transactions.wallet')}</Label>
            <Select
              value={formData.walletId}
              onValueChange={(value) => setFormData({ ...formData, walletId: value })}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue placeholder={t('wallets.select_wallet')} />
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border-0 text-white">
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id} className="hover:bg-[#333] focus:bg-[#333]">
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#868686]">{t('transactions.description')}</Label>
            <Input
              id="description"
              name="description"
              placeholder={t('transactions.enter_description')}
              value={formData.description}
              onChange={handleChange}
              required
              className="bg-[#242425] border-0 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[#868686]">{t('transactions.date')}</Label>
            <div className="bg-[#242425] rounded-md border-0 light:bg-gray-200 light:text-black">
              <DatePicker 
                date={selectedDate}
                setDate={setSelectedDate}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">
            {t('transactions.add_expense')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm; 