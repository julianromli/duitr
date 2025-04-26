// Add comment indicating changes made to the file
// Combined budget management features with Want to Buy and Pinjaman features from the old BudgetPage.tsx.
// Improved UI organization and made the page mobile responsive.
// Reorganized layout to show Budget Categories after Overview and Spending sections.
// Redesigned header to match other pages and removed scrollbar.
// Fixed container layout issues that caused double scrollbars.

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BudgetProgress from '@/components/budget/BudgetProgress';
import BudgetList from '@/components/budget/BudgetList';
import WantToBuyList from '@/components/budget/WantToBuyList';
import WantToBuyForm from '@/components/budget/WantToBuyForm';
import PinjamanList from '@/components/budget/PinjamanList';
import PinjamanForm from '@/components/budget/PinjamanForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { WantToBuyItem, PinjamanItem } from '@/types/finance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FormattedInput } from '@/components/ui/formatted-input';

const BudgetPage: React.FC = () => {
  const { t } = useTranslation();
  const { addBudget } = useFinance();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Budget state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    spent: 0
  });

  // Want to Buy state
  const [isWantToBuyFormOpen, setIsWantToBuyFormOpen] = useState(false);
  const [editingWantToBuyItem, setEditingWantToBuyItem] = useState<WantToBuyItem | null>(null);

  // Pinjaman state
  const [isPinjamanFormOpen, setIsPinjamanFormOpen] = useState(false);
  const [editingPinjamanItem, setEditingPinjamanItem] = useState<PinjamanItem | null>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  // Budget form handlers
  // These are the internal category names (English) for mapping to IDs
  const categoryKeys = [
    'Groceries',
    'Dining',
    'Transportation',
    'Entertainment',
    'Utilities',
    'Housing',
    'Healthcare',
    'Education',
    'Shopping',
    'Personal Care',
    'Travel',
    'Gifts',
    'Other'
  ];
  
  // These are the translated category names to display in the UI
  const categoryOptions = categoryKeys.map(key => {
    // Map the English key to the corresponding translation key
    const translationMap: Record<string, string> = {
      'Groceries': 'budgets.categories.groceries',
      'Dining': 'budgets.categories.dining',
      'Transportation': 'budgets.categories.transportation',
      'Entertainment': 'budgets.categories.entertainment',
      'Utilities': 'budgets.categories.utilities',
      'Housing': 'budgets.categories.housing',
      'Healthcare': 'budgets.categories.healthcare',
      'Education': 'budgets.categories.education',
      'Shopping': 'budgets.categories.shopping',
      'Personal Care': 'budgets.categories.personal_care',
      'Travel': 'budgets.categories.travel',
      'Gifts': 'budgets.categories.gifts',
      'Other': 'budgets.categories.other'
    };
    
    // Return the translated value for display
    return {
      key: key,
      label: t(translationMap[key])
    };
  });
  
  // Mapping of category names to IDs
  const categoryNameToId: Record<string, number> = {
    'Groceries': 1,
    'Dining': 2,
    'Transportation': 3,
    'Entertainment': 6,
    'Utilities': 4,
    'Housing': 5,
    'Healthcare': 8,
    'Education': 9,
    'Shopping': 7,
    'Personal Care': 11,
    'Travel': 10,
    'Gifts': 16,
    'Other': 12
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBudget({ ...newBudget, [name]: value });
  };

  const handleAmountChange = (value: string) => {
    setNewBudget({ ...newBudget, amount: value });
  };

  const handleAmountValueChange = (numericValue: number) => {
    setNewBudget({ ...newBudget, amount: String(numericValue) });
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewBudget({
      ...newBudget,
      [name]: value
    });
  };

  const handleCreateBudget = () => {
    // Validate inputs
    if (!newBudget.category) {
      toast({
        title: t('common.error'),
        description: t('budgets.errors.select_category'),
        variant: "destructive"
      });
      return;
    }

    if (!newBudget.amount || isNaN(Number(newBudget.amount)) || Number(newBudget.amount) <= 0) {
      toast({
        title: t('common.error'),
        description: t('budgets.errors.valid_amount'),
        variant: "destructive"
      });
      return;
    }

    // Get the corresponding numeric category ID
    const categoryId = categoryNameToId[newBudget.category] || 12; // Default to "Other" (12) if not found
    
    // Find the translated display name for the category
    const categoryOption = categoryOptions.find(option => option.key === newBudget.category);
    const displayCategoryName = categoryOption ? categoryOption.label : newBudget.category;

    // Add the new budget
    addBudget({
      category: displayCategoryName, // Use the translated category name for display
      categoryId: categoryId,  // Use the mapped numeric ID
      amount: Number(newBudget.amount),
      period: newBudget.period,
      spent: 0
    });

    // Reset form and close dialog
    setNewBudget({
      category: '',
      amount: '',
      period: 'monthly',
      spent: 0
    });
    setIsDialogOpen(false);

    toast({
      title: t('common.success'),
      description: t('budgets.success.created')
    });
  };

  // Want to Buy handlers
  const handleOpenWantToBuyForm = (item: WantToBuyItem | null = null) => {
    setEditingWantToBuyItem(item);
    setIsWantToBuyFormOpen(true);
  };

  // Pinjaman handlers
  const handleOpenPinjamanForm = (item: PinjamanItem | null = null) => {
    setEditingPinjamanItem(item);
    setIsPinjamanFormOpen(true);
  };

  return (
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6 pt-12">
        {/* Header with back button */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold">{t('budgets.title')}</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#C6FE1E] hover:bg-[#B0E018] text-[#0D0D0D] rounded-full h-10 w-10 p-0 flex items-center justify-center">
                <PlusCircle size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-none text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">
                  {t('budgets.create_new_budget')}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-[#868686]">{t('transactions.category')}</Label>
                  <Select
                    value={newBudget.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger className="bg-[#242425] border-0 text-white">
                      <SelectValue placeholder={t('budgets.select_category')} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242425] border-0 text-white">
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key} className="hover:bg-[#333] focus:bg-[#333]">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="amount" className="text-[#868686]">{t('transactions.amount')}</Label>
                  <FormattedInput
                    id="amount"
                    name="amount"
                    placeholder={t('budgets.enter_amount')}
                    value={newBudget.amount}
                    onChange={handleAmountChange}
                    onValueChange={handleAmountValueChange}
                    className="bg-[#242425] border-0 text-white"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="period" className="text-[#868686]">{t('budgets.period')}</Label>
                  <Select
                    value={newBudget.period}
                    onValueChange={(value) => handleSelectChange('period', value as 'monthly' | 'weekly' | 'yearly')}
                  >
                    <SelectTrigger className="bg-[#242425] border-0 text-white">
                      <SelectValue placeholder={t('budgets.select_period')} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#242425] border-0 text-white">
                      <SelectItem value="weekly" className="hover:bg-[#333] focus:bg-[#333]">{t('budgets.weekly')}</SelectItem>
                      <SelectItem value="monthly" className="hover:bg-[#333] focus:bg-[#333]">{t('budgets.monthly')}</SelectItem>
                      <SelectItem value="yearly" className="hover:bg-[#333] focus:bg-[#333]">{t('budgets.yearly')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[#333] hover:bg-[#333] text-white">{t('buttons.cancel')}</Button>
                <Button onClick={handleCreateBudget} className="bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">{t('buttons.create')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
        
        {/* Budget Sections */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Budget Overview */}
          <BudgetProgress />
          
          {/* Budget Categories List */}
          <BudgetList />
        </motion.div>
        
        {/* Want to Buy Section */}
        <motion.div variants={itemVariants} className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">{t('budget.wantToBuyTitle')}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#C6FE1E] hover:bg-gray-700/50"
              onClick={() => handleOpenWantToBuyForm()}
            >
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">{t('budget.addWantToBuy')}</span>
            </Button>
          </div>
          <WantToBuyList onEditItem={handleOpenWantToBuyForm} />
        </motion.div>

        {/* Pinjaman Section */}
        <motion.div variants={itemVariants} className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">{t('budget.pinjamanTitle')}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#C6FE1E] hover:bg-gray-700/50"
              onClick={() => handleOpenPinjamanForm()}
            >
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">{t('budget.addPinjaman')}</span>
            </Button>
          </div>
          <PinjamanList onEditItem={handleOpenPinjamanForm} />
        </motion.div>

        {/* Want to Buy Form Dialog */}
        <WantToBuyForm
          open={isWantToBuyFormOpen}
          onOpenChange={setIsWantToBuyFormOpen}
          itemToEdit={editingWantToBuyItem}
        />

        {/* Pinjaman Form Dialog */}
        <PinjamanForm
          open={isPinjamanFormOpen}
          onOpenChange={setIsPinjamanFormOpen}
          itemToEdit={editingPinjamanItem}
        />
      </div>
    </motion.div>
  );
};

export default BudgetPage;
