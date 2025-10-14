import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/currency/CurrencyInput';
import { SupportedCurrency } from '@/utils/currency';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { FormattedInput } from '@/components/ui/formatted-input';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { DatePicker } from '@/components/ui/date-picker';
import { motion } from 'framer-motion';
import { ArrowRightLeft } from 'lucide-react';
import AnimatedText from '@/components/ui/animated-text';

interface TransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ open, onOpenChange }) => {
  const { wallets, addTransaction } = useFinance();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    amount: 0,
    fromWalletId: '',
    toWalletId: '',
    description: '',
    fee: 0
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleAmountChange = (amount: number) => {
    setFormData({ ...formData, amount });
  };
  
  const handleFeeChange = (fee: number) => {
    setFormData({ ...formData, fee });
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
    if (formData.amount <= 0 || !formData.fromWalletId || !formData.toWalletId) {
      toast({
        title: t('common.error'),
        description: t('transactions.errors.fill_all_fields'),
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.fromWalletId === formData.toWalletId) {
      toast({
        title: t('common.error'),
        description: t('transactions.errors.same_wallet'),
        variant: 'destructive',
      });
      return;
    }
    
    // Use the system transfer category (ID 18)
    const transferCategoryId = 18;
    
    // Format date to ISO string
    const dateString = selectedDate.toISOString();
    
    // Add transaction
    addTransaction({
      amount: formData.amount,
      date: dateString,
      description: formData.description || t('transactions.transfer'),
      type: 'transfer',
      walletId: formData.fromWalletId,
      destinationWalletId: formData.toWalletId,
      fee: formData.fee,
      categoryId: transferCategoryId
    });
    
    // Reset form
    setFormData({
      amount: 0,
      fromWalletId: '',
      toWalletId: '',
      description: '',
      fee: 0
    });
    setSelectedDate(new Date());
    
    // Show success message
    toast({
      title: t('common.success'),
      description: t('transactions.transfer_completed'),
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
              <ArrowRightLeft className="h-6 w-6 text-[#C6FE1E]" />
            </div>
            <AnimatedText 
              text={t('transactions.transfer')}
              animationType="fade"
            />
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-6 py-0">
          <div className="space-y-3">
            <Label htmlFor="fromWalletId" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
              <AnimatedText text={t('transactions.from_account')} />
            </Label>
            <Select
              value={formData.fromWalletId}
              onValueChange={(value) => setFormData({ ...formData, fromWalletId: value })}
            >
              <SelectTrigger className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50">
                <SelectValue>
                  <AnimatedText 
                    text={formData.fromWalletId ? 
                      wallets.find(w => w.id === formData.fromWalletId)?.name || t('transactions.select_source') :
                      t('transactions.select_source')
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
            <Label htmlFor="toWalletId" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
              <AnimatedText text={t('transactions.to_account')} />
            </Label>
            <Select
              value={formData.toWalletId}
              onValueChange={(value) => setFormData({ ...formData, toWalletId: value })}
            >
              <SelectTrigger className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50">
                <SelectValue>
                  <AnimatedText 
                    text={formData.toWalletId ? 
                      wallets.find(w => w.id === formData.toWalletId)?.name || t('transactions.select_destination') :
                      t('transactions.select_destination')
                    }
                  />
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border border-white/10 text-white backdrop-blur-xl">
                {wallets.map((wallet) => (
                  <SelectItem 
                    key={wallet.id} 
                    value={wallet.id}
                    disabled={wallet.id === formData.fromWalletId}
                    className="hover:bg-[#333]/80 focus:bg-[#333]/80 hover:text-white focus:text-white transition-colors duration-200 disabled:opacity-50"
                  >
                    <AnimatedText text={wallet.name} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
              <AnimatedText text={t('transactions.amount')} />
            </Label>
            <CurrencyInput
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              required
              className="[&>div>input]:bg-[#242425]/80 [&>div>input]:border-white/10 [&>div>input]:text-white [&>div>input]:h-12 [&>div>input]:rounded-xl [&>div>input]:hover:bg-[#242425] [&>div>input]:focus:ring-2 [&>div>input]:focus:ring-[#C6FE1E]/50"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="fee" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
              <AnimatedText text={t('transactions.fee')} />
            </Label>
            <Input
              id="fee"
              name="fee"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.fee}
              onChange={(e) => handleFeeChange(parseFloat(e.target.value) || 0)}
              className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50"
            />
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
              <AnimatedText text={t('transactions.transfer')} />
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransferForm;