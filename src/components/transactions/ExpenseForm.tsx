import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { getLocalizedCategoriesByType, DEFAULT_CATEGORIES } from '@/utils/categoryUtils';
import i18next from 'i18next';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { createClient } from '@supabase/supabase-js';
import { DatePicker } from '@/components/ui/date-picker';

// Create a local Supabase client for this component
const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://cxqluedeykgqmthzveiw.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cWx1ZWRleWtncW10aHp2ZWl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDQxNjcsImV4cCI6MjA1ODU4MDE2N30.Lh08kodIf9QzggcjUP4mTc2axGFEtW8o9efDXRVNQ_E"
);

// Define the category type from Supabase
interface SupabaseCategory {
  id: string;
  category_key: string;
  id_name: string;
  en_name: string;
  icon?: string;
  created_at: string;
  type?: string;
}

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, onOpenChange }) => {
  const { wallets, addTransaction } = useFinance();
  const { toast } = useToast();
  const { t } = useTranslation();
  
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
        // Use the utility function for loading categories that has better error handling
        const loadedCategories = await getLocalizedCategoriesByType('expense', i18next);
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        // Use default categories as fallback
        const defaultCategories = DEFAULT_CATEGORIES.expense.map(cat => ({
          id: cat.id,
          name: i18next.language === 'id' ? 
            // Translate to Indonesian if needed
            cat.name === 'Groceries' ? 'Belanjaan' :
            cat.name === 'Dining' ? 'Makanan' :
            cat.name === 'Transportation' ? 'Transportasi' :
            cat.name === 'Subscription' ? 'Langganan' :
            cat.name === 'Housing' ? 'Perumahan' :
            cat.name === 'Entertainment' ? 'Hiburan' :
            cat.name === 'Shopping' ? 'Belanja' :
            cat.name === 'Health' ? 'Kesehatan' :
            cat.name === 'Education' ? 'Pendidikan' :
            cat.name === 'Travel' ? 'Perjalanan' :
            cat.name === 'Personal' ? 'Pribadi' :
            cat.name === 'Donate' ? 'Sedekah' :
            cat.name === 'Other' ? 'Lainnya' : cat.name
            : cat.name
        }));
        
        setCategories(defaultCategories);
        
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
  }, [t, i18next.language]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.amount || !formData.categoryId || !formData.description || !formData.walletId) {
      toast({
        title: t('common.error'),
        description: t('transactions.errors.fill_all_fields'),
        variant: 'destructive',
      });
      return;
    }
    
    // Add transaction with required parameters
    addTransaction({
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId,
      description: formData.description,
      date: new Date().toISOString(),
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
                      <div className="bg-[#C6FE1E] w-8 h-8 flex items-center justify-center rounded-full mr-2">
                        <CategoryIcon category={category.id} size="sm" />
                      </div>
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
          
          <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">
            {t('transactions.add_expense')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm; 