
// Component: ExpenseForm
// Description: Form for adding expense transactions
// Fixed category loading to include Investment category from Supabase database

import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { DEFAULT_CATEGORIES } from '@/utils/categoryUtils';
import { useCategories } from '@/hooks/useCategories';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import AnimatedText from '@/components/ui/animated-text';

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
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    description: '',
    walletId: '',
  });
  
  const { categories: allCategories, isLoading: isLoadingCategories } = useCategories();
  
  // Filter expense categories (both default and custom)
  const categories = useMemo(() => {
    return allCategories
      .filter(cat => cat.type === 'expense')
      .map(cat => ({
        id: cat.id || cat.category_id?.toString() || '',
        name: i18n.language === 'id' ? (cat.id_name || cat.en_name || 'Unknown') : (cat.en_name || cat.id_name || 'Unknown'),
        icon: cat.icon || 'circle',
        color: cat.color || '#6B7280'
      }));
  }, [allCategories, i18n.language]);
  
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
    const dateString = selectedDate.toISOString();
    
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
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-white/10 text-white backdrop-blur-xl shadow-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-[#C6FE1E]/10 rounded-full">
              <PlusCircle className="h-6 w-6 text-[#C6FE1E]" />
            </div>
            <AnimatedText 
              text={t('transactions.add_expense')}
              animationType="fade"
            />
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-6 py-0">
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
              <AnimatedText text={t('transactions.amount')} />
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              required
              className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="categoryId" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
              <AnimatedText text={t('transactions.category')} />
            </Label>
            <Select
              value={formData.categoryId ? String(formData.categoryId) : ""}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              disabled={isLoadingCategories}
            >
              <SelectTrigger className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50">
                <SelectValue>
                  <AnimatedText 
                    text={isLoadingCategories ? t('common.loading') : 
                      formData.categoryId ? 
                        categories.find(c => c.id === formData.categoryId)?.name || t('transactions.categoryform') :
                        t('transactions.categoryform')
                    }
                  />
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border border-white/10 text-white backdrop-blur-xl max-h-[300px]">
                {isLoadingCategories ? (
                  <SelectItem value="loading" disabled>
                    <AnimatedText text={t('common.loading')} />
                  </SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={String(category.id)}
                      className="hover:bg-[#333]/80 focus:bg-[#333]/80 hover:text-white focus:text-white transition-colors duration-200"
                    >
                      <div className="flex items-center">
                        <CategoryIcon 
                          category={category.id}
                          size="sm"
                          className="mr-2"
                        />
                        <span className="ml-2">
                          <AnimatedText text={category.name} animationType="fade" />
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="walletId" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
              <AnimatedText text={t('transactions.wallet')} />
            </Label>
            <Select
              value={formData.walletId}
              onValueChange={(value) => setFormData({ ...formData, walletId: value })}
            >
              <SelectTrigger className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50">
                <SelectValue>
                  <AnimatedText 
                    text={formData.walletId ? 
                      wallets.find(w => w.id === formData.walletId)?.name || t('wallets.select_wallet') :
                      t('wallets.select_wallet')
                    }
                  />
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border border-white/10 text-white backdrop-blur-xl">
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id} className="hover:bg-[#333]/80 focus:bg-[#333]/80 hover:text-white focus:text-white transition-colors duration-200">
                    <AnimatedText text={wallet.name} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
              <AnimatedText text={t('transactions.description')} />
            </Label>
            <Input
              id="description"
              name="description"
              placeholder={t('transactions.enter_description')}
              value={formData.description}
              onChange={handleChange}
              required
              className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50"
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
              <AnimatedText text={t('transactions.date')} />
            </Label>
            <div className="bg-[#242425]/80 border border-white/10 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus-within:ring-2 focus-within:ring-[#C6FE1E]/50">
              <DatePicker 
                date={selectedDate}
                setDate={setSelectedDate}
              />
            </div>
          </div>
          
        </form>
        
        <DialogFooter className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="w-full h-12 border border-white/20 hover:bg-white/5 text-white rounded-xl transition-all duration-200 font-medium"
            >
              <AnimatedText text={t('buttons.cancel')} />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button 
              type="submit"
              onClick={handleSubmit}
              className="w-full h-12 bg-gradient-to-r from-[#C6FE1E] to-[#A8E016] hover:from-[#B0E018] hover:to-[#98D014] text-[#0D0D0D] font-semibold border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <AnimatedText text={t('transactions.add_expense')} />
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
