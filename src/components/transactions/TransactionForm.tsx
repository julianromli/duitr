import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinance } from '@/context/FinanceContext';
import { ArrowDown, ArrowRight, ArrowUp, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { getLocalizedCategoriesByType } from '@/utils/categoryUtils';
import i18next from 'i18next';

interface TransactionFormProps {
  // Props if needed
}

const TransactionForm: React.FC<TransactionFormProps> = (/* props */) => {
  const { wallets, addTransaction } = useFinance();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    description: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    walletId: '',
    destinationWalletId: '',
    fee: '0',
  });
  
  const [categories, setCategories] = useState<{id: string | number; name: string}[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  
  // Get categories for the current transaction type
  useEffect(() => {
    const loadCategories = async () => {
      if (formData.type === 'transfer') {
        setCategories([]);
        return;
      }
      
      setIsLoadingCategories(true);
      try {
        const type = formData.type === 'expense' ? 'expense' : 'income';
        const fetchedCategories = await getLocalizedCategoriesByType(type, i18next);
        
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
  }, [formData.type, t]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };
  
  const handleTypeChange = (value: 'income' | 'expense' | 'transfer') => {
    setFormData({ 
      ...formData, 
      type: value,
      categoryId: '' // Reset category when type changes
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.walletId) {
      toast({
        title: t('common.error'),
        description: t('transactions.validation.requiredFields'),
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.type === 'transfer' && !formData.destinationWalletId) {
      toast({
        title: t('common.error'),
        description: t('transactions.validation.destinationWalletRequired'),
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.type === 'transfer' && formData.walletId === formData.destinationWalletId) {
      toast({
        title: t('common.error'),
        description: t('transactions.validation.sameWallet'),
        variant: 'destructive'
      });
      return;
    }
    
    // For transfer, use system_transfer category
    const categoryId = formData.type === 'transfer' 
      ? 'system_transfer' 
      : formData.categoryId;
      
    if (!categoryId && formData.type !== 'transfer') {
      toast({
        title: t('common.error'),
        description: t('transactions.validation.categoryRequired'),
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await addTransaction({
        amount: parseFloat(formData.amount),
        categoryId: categoryId,
        description: formData.description,
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        type: formData.type,
        walletId: formData.walletId,
        destinationWalletId: formData.type === 'transfer' ? formData.destinationWalletId : undefined,
        fee: formData.type === 'transfer' && formData.fee ? parseFloat(formData.fee) : undefined
      });
      
      setFormData({
        amount: '',
        categoryId: '',
        description: '',
        type: 'expense',
        walletId: '',
        destinationWalletId: '',
        fee: '0',
      });
      
      setSelectedDate(new Date());
      setOpen(false);
      
      toast({
        title: t('common.success'),
        description: t('transactions.successMessage')
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: t('common.error'),
        description: t('common.errorMessage'),
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed z-10 bottom-24 right-4 md:right-8 w-14 h-14 rounded-full bg-[#C6FE1E] flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold leading-none">+</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#1A1A1A] border-none text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {formData.type === 'income' 
              ? t('transactions.addIncome') 
              : formData.type === 'expense' 
                ? t('transactions.addExpense') 
                : t('transactions.addTransfer')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Transaction Type */}
          <div className="mb-4">
            <label className="text-[#868686] mb-1 block">
              {t('transactions.type')}
            </label>
            <RadioGroup 
              className="flex justify-between"
              value={formData.type}
              onValueChange={(value) => handleTypeChange(value as 'income' | 'expense' | 'transfer')}
            >
              <div className="flex items-center">
                <RadioGroupItem value="expense" id="expense" className="hidden" />
                <Label 
                  htmlFor="expense"
                  className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                    formData.type === 'expense' ? 'bg-[#FF6B6B] text-white' : 'bg-[#242425] text-[#868686]'
                  }`}
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  {t('transactions.expense')}
                </Label>
              </div>
              
              <div className="flex items-center">
                <RadioGroupItem value="income" id="income" className="hidden" />
                <Label 
                  htmlFor="income"
                  className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                    formData.type === 'income' ? 'bg-green-500 text-white' : 'bg-[#242425] text-[#868686]'
                  }`}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  {t('transactions.income')}
                </Label>
              </div>
              
              <div className="flex items-center">
                <RadioGroupItem value="transfer" id="transfer" className="hidden" />
                <Label 
                  htmlFor="transfer"
                  className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                    formData.type === 'transfer' ? 'bg-blue-500 text-white' : 'bg-[#242425] text-[#868686]'
                  }`}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {t('transactions.transfer')}
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Amount */}
          <div className="mb-4">
            <Label htmlFor="amount" className="text-[#868686] mb-1 block">
              {t('transactions.amount')}
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={handleChange}
              className="bg-[#242425] border-0 text-white"
            />
          </div>
          
          {/* Date */}
          <div className="mb-4">
            <Label className="text-[#868686] mb-1 block">
              {t('transactions.date')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full bg-[#242425] border-0 text-white flex justify-start"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>{t('transactions.selectDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-[#242425] border-0 text-white">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="bg-[#242425] text-white rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Category - Not for transfers */}
          {formData.type !== 'transfer' && (
            <div className="mb-4">
              <Label htmlFor="categoryId" className="text-[#868686] mb-1 block">
                {t('transactions.category')}
              </Label>
              <Select
                value={formData.categoryId ? String(formData.categoryId) : ""}
                onValueChange={(value) => handleSelectChange('categoryId', value)}
                disabled={isLoadingCategories}
              >
                <SelectTrigger className="bg-[#242425] border-0 text-white">
                  <SelectValue placeholder={
                    isLoadingCategories ? t('common.loading') : 
                    formData.type === 'income' ? t('transactions.selectIncomeCategory') : t('transactions.selectExpenseCategory')
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
          )}
          
          {/* Wallet */}
          <div className="mb-4">
            <Label htmlFor="walletId" className="text-[#868686] mb-1 block">
              {formData.type === 'transfer' ? t('transactions.sourceWallet') : t('transactions.wallet')}
            </Label>
            <Select
              value={formData.walletId}
              onValueChange={(value) => handleSelectChange('walletId', value)}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue placeholder={t('transactions.selectWallet')} />
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border-0">
                {wallets.map((wallet) => (
                  <SelectItem 
                    key={wallet.id} 
                    value={wallet.id}
                    className="focus:bg-[#333] hover:bg-[#333]"
                  >
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Destination Wallet - only for transfers */}
          {formData.type === 'transfer' && (
            <div className="mb-4">
              <Label htmlFor="destinationWalletId" className="text-[#868686] mb-1 block">
                {t('transactions.destinationWallet')}
              </Label>
              <Select
                value={formData.destinationWalletId}
                onValueChange={(value) => handleSelectChange('destinationWalletId', value)}
              >
                <SelectTrigger className="bg-[#242425] border-0 text-white">
                  <SelectValue placeholder={t('transactions.selectWallet')} />
                </SelectTrigger>
                <SelectContent className="bg-[#242425] border-0">
                  {wallets.map((wallet) => (
                    <SelectItem 
                      key={wallet.id} 
                      value={wallet.id}
                      className="focus:bg-[#333] hover:bg-[#333]"
                      disabled={wallet.id === formData.walletId}
                    >
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Transfer Fee - only for transfers */}
          {formData.type === 'transfer' && (
            <div className="mb-4">
              <Label htmlFor="fee" className="text-[#868686] mb-1 block">
                {t('transactions.fee')}
              </Label>
              <Input
                id="fee"
                name="fee"
                type="number"
                placeholder="0"
                value={formData.fee}
                onChange={handleChange}
                className="bg-[#242425] border-0 text-white"
              />
            </div>
          )}
          
          {/* Description */}
          <div className="mb-6">
            <Label htmlFor="description" className="text-[#868686] mb-1 block">
              {t('transactions.description')}
            </Label>
            <Input
              id="description"
              name="description"
              placeholder={t('transactions.descriptionPlaceholder')}
              value={formData.description}
              onChange={handleChange}
              className="bg-[#242425] border-0 text-white"
            />
          </div>
          
          <Button type="submit" className="w-full bg-[#C6FE1E] text-black hover:bg-[#B3EA0F]">
            {formData.type === 'income' 
              ? t('transactions.addIncome') 
              : formData.type === 'expense' 
                ? t('transactions.addExpense') 
                : t('transactions.addTransfer')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
