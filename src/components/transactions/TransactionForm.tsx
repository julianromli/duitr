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

interface TransactionFormProps {
  // Assuming props like open, onOpenChange if it's a dialog, or maybe none if standalone
}

const TransactionForm: React.FC<TransactionFormProps> = (/* props */) => {
  const { wallets, addTransaction } = useFinance();
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
      addTransaction({
        amount: parseFloat(formData.amount),
        description: formData.description || 'Transfer',
        date: dateString,
        type: 'transfer',
        walletId: formData.walletId,
        destinationWalletId: formData.destinationWalletId,
        fee: parseFloat(formData.fee) || 0,
        category: 'Transfer'
      });
    } else if (formData.type === 'income' || formData.type === 'expense') {
      if (!formData.category || !formData.walletId) {
        toast({ title: t('common.error'), description: t('transactions.errors.fill_category_wallet'), variant: 'destructive' });
        return;
      }

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
        <Button>{t('transactions.add_transaction')}</Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1A1A1A] border-0 text-white dark:bg-gray-800 dark:text-gray-200">
        <DialogHeader className="flex flex-row justify-between items-center">
           <DialogTitle className="text-xl font-bold">{t(`transactions.add_${formData.type}`)}</DialogTitle>
           <DialogClose className="rounded-full hover:bg-[#333] text-[#868686] hover:text-white dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-100">
             <X size={16} />
           </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
           <div className="space-y-2">
              <Label className="text-[#868686] dark:text-gray-400">{t('transactions.transaction_type')}</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense' | 'transfer') => setFormData({ ...formData, type: value, category: '', destinationWalletId: '', fee: '0' })}
              >
                <SelectTrigger className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200">
                  <SelectValue placeholder={t('transactions.select_type')} />
                </SelectTrigger>
                <SelectContent className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200">
                   <SelectItem value="expense" className="hover:bg-[#333] focus:bg-[#333] dark:hover:bg-gray-600 dark:focus:bg-gray-600">{t('transactions.expense')}</SelectItem>
                   <SelectItem value="income" className="hover:bg-[#333] focus:bg-[#333] dark:hover:bg-gray-600 dark:focus:bg-gray-600">{t('transactions.income')}</SelectItem>
                   <SelectItem value="transfer" className="hover:bg-[#333] focus:bg-[#333] dark:hover:bg-gray-600 dark:focus:bg-gray-600">{t('transactions.transfer')}</SelectItem>
                </SelectContent>
              </Select>
           </div>

           <div className="space-y-2">
              <Label htmlFor="walletId" className="text-[#868686] dark:text-gray-400">
                {formData.type === 'transfer' ? t('transactions.from_account') : t('transactions.wallet')}
              </Label>
              <Select
                value={formData.walletId}
                onValueChange={(value) => setFormData({ ...formData, walletId: value })}
                required
              >
                <SelectTrigger className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200">
                  <SelectValue placeholder={t(formData.type === 'transfer' ? 'transactions.select_source' : 'transactions.select_wallet')} />
                </SelectTrigger>
                <SelectContent className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200">
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id} className="hover:bg-[#333] focus:bg-[#333] dark:hover:bg-gray-600 dark:focus:bg-gray-600">
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>

           {formData.type === 'transfer' && (
             <div className="space-y-2">
               <Label htmlFor="destinationWalletId" className="text-[#868686] dark:text-gray-400">{t('transactions.to_account')}</Label>
               <Select
                 value={formData.destinationWalletId}
                 onValueChange={(value) => setFormData({ ...formData, destinationWalletId: value })}
                 required
               >
                 <SelectTrigger className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200">
                   <SelectValue placeholder={t('transactions.select_destination')} />
                 </SelectTrigger>
                 <SelectContent className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200">
                   {wallets.map((wallet) => (
                     <SelectItem
                       key={wallet.id}
                       value={wallet.id}
                       disabled={wallet.id === formData.walletId}
                       className="hover:bg-[#333] focus:bg-[#333] dark:hover:bg-gray-600 dark:focus:bg-gray-600"
                     >
                       {wallet.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           )}

           <div className="space-y-2">
             <Label htmlFor="amount" className="text-[#868686] dark:text-gray-400">{t('transactions.amount')}</Label>
             <Input
               id="amount"
               name="amount"
               type="number"
               step="0.01"
               placeholder="0.00"
               value={formData.amount}
               onChange={handleChange}
               required
               className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200"
             />
           </div>

           {(formData.type === 'income' || formData.type === 'expense') && (
             <div className="space-y-2">
               <Label htmlFor="category" className="text-[#868686] dark:text-gray-400">{t('transactions.category')}</Label>
               <Input
                 id="category"
                 name="category"
                 placeholder={t('transactions.enter_category')}
                 value={formData.category}
                 onChange={handleChange}
                 required
                 className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200"
               />
             </div>
           )}

           {formData.type === 'transfer' && (
             <div className="space-y-2">
               <Label htmlFor="fee" className="text-[#868686] dark:text-gray-400">{t('transactions.fee')}</Label>
               <Input
                 id="fee"
                 name="fee"
                 type="number"
                 step="0.01"
                 placeholder="0"
                 value={formData.fee}
                 onChange={handleChange}
                 className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200"
               />
             </div>
           )}

           <div className="space-y-2">
             <Label htmlFor="description" className="text-[#868686] dark:text-gray-400">{t('transactions.description')}</Label>
             <Input
               id="description"
               name="description"
               placeholder={t('transactions.enter_description')}
               value={formData.description}
               onChange={handleChange}
               className="bg-[#242425] border-0 text-white dark:bg-gray-700 dark:text-gray-200"
             />
           </div>

           <div className="space-y-2">
             <Label className="text-[#868686] dark:text-gray-400">{t('transactions.date')}</Label>
             <div className="bg-[#242425] rounded-md border-0 text-white dark:bg-gray-700 dark:text-gray-200">
               <DatePicker
                 date={selectedDate}
                 setDate={setSelectedDate}
               />
             </div>
           </div>

           <Button type="submit" className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
             {t(`transactions.add_${formData.type}`)}
           </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
