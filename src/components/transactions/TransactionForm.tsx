import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinance } from '@/context/FinanceContext';
import { ArrowDown, ArrowRight, ArrowUp, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
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
  
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  
  // Get categories for the current transaction type
  useEffect(() => {
    const loadCategories = async () => {
      const type = formData.type === 'expense' ? 'expense' : 'income';
      const fetchedCategories = await getLocalizedCategoriesByType(
        formData.type === 'income' ? 'income' : 'expense', 
        i18next
      );
      setCategories(fetchedCategories);
    };
    
    loadCategories();
  }, [formData.type]);
  
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
    
    try {
      await addTransaction({
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId,
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
        <Button className="fixed bottom-20 right-4 rounded-full h-14 w-14 shadow-lg">
          <span className="text-2xl font-bold">+</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 gap-0 bg-[#18181B]">
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{t('transactions.newTransaction')}</h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-4 pb-4">
          {/* Transaction Type */}
          <div className="mb-4">
            <RadioGroup 
              value={formData.type} 
              onValueChange={(value) => handleTypeChange(value as 'income' | 'expense' | 'transfer')}
              className="flex justify-between"
            >
              <div className="flex items-center">
                <RadioGroupItem value="expense" id="expense" className="hidden" />
                <Label 
                  htmlFor="expense"
                  className={`flex items-center justify-center px-4 py-2 rounded-lg ${
                    formData.type === 'expense' ? 'bg-red-500 text-white' : 'bg-[#242425] text-[#868686]'
                  }`}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
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
                  <ArrowDown className="mr-2 h-4 w-4" />
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
            <Label htmlFor="date" className="text-[#868686] mb-1 block">
              {t('transactions.date')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-[#242425] border-0 text-white"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#242425]">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Category - not shown for transfers */}
          {formData.type !== 'transfer' && (
            <div className="mb-4">
              <Label htmlFor="categoryId" className="text-[#868686] mb-1 block">
                {t('transactions.category')}
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleSelectChange('categoryId', value)}
              >
                <SelectTrigger className="bg-[#242425] border-0 text-white">
                  <SelectValue placeholder={t('transactions.selectCategory')} />
                </SelectTrigger>
                <SelectContent className="bg-[#242425] border-0 max-h-80">
                  {categories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id}
                      className="focus:bg-[#333] hover:bg-[#333]"
                    >
                      <div className="flex items-center">
                        <CategoryIcon category={category.id} size="sm" animate={false} />
                        <span className="ml-2">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Source Wallet */}
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
          
          <Button type="submit" className="w-full">
            {t('common.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
