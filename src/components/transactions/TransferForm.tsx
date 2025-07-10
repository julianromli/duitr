import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { FormattedInput } from '@/components/ui/formatted-input';
import { getLocalizedCategoriesByType, DEFAULT_CATEGORIES } from '@/utils/categoryUtils';
import { useAuth } from '@/context/AuthContext';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { DatePicker } from '@/components/ui/date-picker';

interface TransferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ open, onOpenChange }) => {
  const { wallets, addTransaction } = useFinance();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    amount: '',
    fromWalletId: '',
    toWalletId: '',
    description: '',
    fee: '0'
  });
  
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleFormattedChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };
  
  const handleFormattedValueChange = (name: string, numericValue: number) => {
    setFormData({ ...formData, [name]: String(numericValue) });
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
    if (!formData.amount || !formData.fromWalletId || !formData.toWalletId) {
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
    
    // Use the system transfer category from DEFAULT_CATEGORIES
    const transferCategory = DEFAULT_CATEGORIES.system[0];
    
    // Format date to ISO string
    const dateString = selectedDate.toISOString();
    
    // Add transaction
    addTransaction({
      amount: parseFloat(formData.amount),
      date: dateString,
      description: formData.description || t('transactions.transfer'),
      type: 'transfer',
      walletId: formData.fromWalletId,
      destinationWalletId: formData.toWalletId,
      fee: parseFloat(formData.fee || '0'),
      categoryId: transferCategory.id
    });
    
    // Reset form
    setFormData({
      amount: '',
      fromWalletId: '',
      toWalletId: '',
      description: '',
      fee: '0'
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

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const fetchedCategories = await getLocalizedCategoriesByType('system', user?.id);
        
        // Sort categories by ID to maintain consistent order
        const sortedCategories = [...fetchedCategories].sort((a, b) => {
          const idA = typeof a.id === 'number' ? a.id : Number(a.id);
          const idB = typeof b.id === 'number' ? b.id : Number(b.id);
          return idA - idB;
        });
        
        setCategories(sortedCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
        
        // Use default categories as fallback
        const defaultCategories = DEFAULT_CATEGORIES.system.map(cat => ({
          id: cat.id,
          name: cat.name
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
  }, [t, user?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-none text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t('transactions.transfer')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="fromWalletId" className="text-[#868686]">{t('transactions.from_account')}</Label>
            <Select
              value={formData.fromWalletId}
              onValueChange={(value) => setFormData({ ...formData, fromWalletId: value })}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue placeholder={t('transactions.select_source')} />
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
            <Label htmlFor="toWalletId" className="text-[#868686]">{t('transactions.to_account')}</Label>
            <Select
              value={formData.toWalletId}
              onValueChange={(value) => setFormData({ ...formData, toWalletId: value })}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue placeholder={t('transactions.select_destination')} />
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border-0 text-white">
                {wallets.map((wallet) => (
                  <SelectItem 
                    key={wallet.id} 
                    value={wallet.id}
                    disabled={wallet.id === formData.fromWalletId}
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
            <FormattedInput
              id="amount"
              name="amount"
              placeholder="0"
              value={formData.amount}
              onChange={(value) => handleFormattedChange('amount', value)}
              onValueChange={(numericValue) => handleFormattedValueChange('amount', numericValue)}
              required
              className="bg-[#242425] border-0 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fee" className="text-[#868686]">{t('transactions.fee')}</Label>
            <FormattedInput
              id="fee"
              name="fee"
              placeholder="0"
              value={formData.fee}
              onChange={(value) => handleFormattedChange('fee', value)}
              onValueChange={(numericValue) => handleFormattedValueChange('fee', numericValue)}
              className="bg-[#242425] border-0 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[#868686]">{t('transactions.description')}</Label>
            <Input
              id="description"
              name="description"
              placeholder={t('transactions.enter_description')}
              value={formData.description}
              onChange={handleChange}
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
            {t('transactions.transfer')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferForm;