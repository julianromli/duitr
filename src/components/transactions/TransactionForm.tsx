import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslation } from 'react-i18next';
import Transactions from '@/pages/Transactions';

const TransactionForm: React.FC = () => {
  const { wallets, addTransaction, addTransfer } = useFinance();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    walletId: '',
    destinationWalletId: '',
    fee: '0',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast({
        title: 'Error',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }
    
    // Common validation
    if (!formData.amount) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    // Format date to ISO string
    const dateString = selectedDate.toISOString().split('T')[0];
    
    if (formData.type === 'transfer') {
      // Transfer validation
      if (!formData.walletId || !formData.destinationWalletId) {
        toast({
          title: 'Error',
          description: 'Please select both origin and destination accounts',
          variant: 'destructive',
        });
        return;
      }
      
      if (formData.walletId === formData.destinationWalletId) {
        toast({
          title: 'Error',
          description: 'Origin and destination accounts cannot be the same',
          variant: 'destructive',
        });
        return;
      }
      
      // Add transfer
      addTransfer({
        amount: parseFloat(formData.amount),
        description: formData.description || 'Transfer',
        date: dateString,
        fromWalletId: formData.walletId,
        toWalletId: formData.destinationWalletId,
        fee: parseFloat(formData.fee) || 0,
      });
    } else {
      // Income/Expense validation
      if (!formData.category || !formData.description || !formData.walletId) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      // Add transaction
      addTransaction({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: dateString,
        type: formData.type,
        walletId: formData.walletId,
      });
    }
    
    // Reset form
    setFormData({
      amount: '',
      category: '',
      description: '',
      type: 'expense',
      walletId: '',
      destinationWalletId: '',
      fee: '0',
    });
    setSelectedDate(new Date());
    
    // Show success message
    toast({
      title: 'Success',
      description: `${formData.type === 'transfer' ? 'Transfer' : 'Transaction'} added successfully`,
    });
    
    // Close dialog
    setOpen(false);
  };
  
  const categories = [
    'Groceries',
    'Dining',
    'Transportation',
    'Utilities',
    'Rent',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Salary',
    'Freelance',
    'Investment',
    'Gift',
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button 
          className="p-2 bg-[#1364FF] rounded-full flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="bg-[#1A1A1A] border-0 text-white">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-bold">
            {formData.type === 'transfer' ? t('transactions.transfer') : t('transactions.add_transaction')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-[#C6FE1E] mb-2 block">{t('transactions.transaction_type')}</Label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                className={`py-2 px-4 rounded-full text-center ${formData.type === 'income' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'bg-[#242425] text-white'}`}
                onClick={() => setFormData({ ...formData, type: 'income' })}
              >
                {t('transactions.income')}
              </button>
              <button 
                type="button"
                className={`py-2 px-4 rounded-full text-center ${formData.type === 'expense' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'bg-[#242425] text-white'}`}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
              >
                {t('transactions.expense')}
              </button>
              <button 
                type="button"
                className={`py-2 px-4 rounded-full text-center ${formData.type === 'transfer' ? 'bg-[#C6FE1E] text-[#0D0D0D] font-medium' : 'bg-[#242425] text-white'}`}
                onClick={() => setFormData({ ...formData, type: 'transfer', category: '' })}
              >
                {t('transactions.transfer')}
              </button>
            </div>
          </div>
          
          {formData.type === 'transfer' ? (
            // Transfer form fields
            <>
              <div className="space-y-2">
                <Label htmlFor="walletId" className="text-[#868686]">{t('transactions.from_account')}</Label>
                <Select
                  value={formData.walletId}
                  onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                >
                  <SelectTrigger className="bg-[#242425] border-0 text-white">
                    <SelectValue placeholder={t('transactions.from_account')} />
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
                <Label htmlFor="destinationWalletId" className="text-[#868686]">{t('transactions.to_account')}</Label>
                <Select
                  value={formData.destinationWalletId}
                  onValueChange={(value) => setFormData({ ...formData, destinationWalletId: value })}
                >
                  <SelectTrigger className="bg-[#242425] border-0 text-white">
                    <SelectValue placeholder={t('transactions.to_account')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242425] border-0 text-white">
                    {wallets.map((wallet) => (
                      <SelectItem 
                        key={wallet.id} 
                        value={wallet.id}
                        disabled={wallet.id === formData.walletId}
                        className="hover:bg-[#333] focus:bg-[#333]"
                      >
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
                <Label htmlFor="fee" className="text-[#868686]">{t('transactions.fee')}</Label>
                <Input
                  id="fee"
                  name="fee"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.fee}
                  onChange={handleChange}
                  className="bg-[#242425] border-0 text-white"
                />
              </div>
            </>
          ) : (
            // Regular transaction fields
            <>
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
                    <SelectValue placeholder={t('transactions.category')} />
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
                <Label htmlFor="walletId" className="text-[#868686]">{t('transactions.account')}</Label>
                <Select
                  value={formData.walletId}
                  onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                >
                  <SelectTrigger className="bg-[#242425] border-0 text-white">
                    <SelectValue placeholder={t('transactions.account')} />
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
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#868686]">{t('transactions.description')}</Label>
            <Input
              id="description"
              name="description"
              placeholder={t('transactions.enter_description')}
              value={formData.description}
              onChange={handleChange}
              required={formData.type !== 'transfer'}
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
          
          <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#A6DD00] font-semibold border-0">
            {formData.type === 'transfer' ? t('transactions.add_transfer') : t('transactions.add_transaction')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
