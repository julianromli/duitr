import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslation } from 'react-i18next';

interface IncomeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IncomeForm: React.FC<IncomeFormProps> = ({ open, onOpenChange }) => {
  const { wallets, addTransaction } = useFinance();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    walletId: '',
  });
  
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
    if (!formData.amount || !formData.category || !formData.description || !formData.walletId) {
      toast({
        title: t('common.error'),
        description: t('transactions.errors.fill_all_fields'),
        variant: 'destructive',
      });
      return;
    }
    
    // Format date to ISO string
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Add transaction
    addTransaction({
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: dateString,
      type: 'income',
      walletId: formData.walletId,
    });
    
    // Reset form
    setFormData({
      amount: '',
      category: '',
      description: '',
      walletId: '',
    });
    setSelectedDate(new Date());
    
    // Show success message
    toast({
      title: t('common.success'),
      description: t('transactions.income_added'),
    });
    
    // Close dialog
    onOpenChange(false);
  };
  
  const categories = [
    t('income.categories.salary'),
    t('income.categories.business'),
    t('income.categories.investment'),
    t('income.categories.gift'),
    t('income.categories.other')
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-0 text-white">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold">{t('transactions.add_income')}</DialogTitle>
          <DialogClose className="rounded-full hover:bg-[#333] text-[#868686] hover:text-white">
            <X size={16} />
          </DialogClose>
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
            <Label htmlFor="category" className="text-[#868686]">{t('transactions.category')}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue placeholder={t('income.select_category')} />
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border-0 text-white">
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="hover:bg-[#333] focus:bg-[#333]">
                    {category}
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
            <DatePicker 
              date={selectedDate}
              setDate={setSelectedDate}
            />
          </div>
          
          <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">
            {t('transactions.add_income')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncomeForm; 