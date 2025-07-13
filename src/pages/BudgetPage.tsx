// Add comment indicating changes made to the file
// Combined budget management features with Want to Buy and Pinjaman features from the old BudgetPage.tsx.
// Improved UI organization and made the page mobile responsive.
// Reorganized layout to show Budget Categories after Overview and Spending sections.
// Redesigned header to match other pages and removed scrollbar.
// Fixed container layout issues that caused double scrollbars.

import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import i18next from 'i18next';
import AnimatedText from '@/components/ui/animated-text';

const BudgetPage: React.FC = () => {
  const { t, i18n } = useTranslation();
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

  // Categories state
  const [categories, setCategories] = useState<Array<{
    id: string;
    category_id?: number;
    category_key?: string;
    en_name: string;
    id_name: string;
    type?: string;
    icon?: string;
    created_at?: string;
  }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Want to Buy state
  const [isWantToBuyFormOpen, setIsWantToBuyFormOpen] = useState(false);
  const [editingWantToBuyItem, setEditingWantToBuyItem] = useState<WantToBuyItem | null>(null);

  // Pinjaman state
  const [isPinjamanFormOpen, setIsPinjamanFormOpen] = useState(false);
  const [editingPinjamanItem, setEditingPinjamanItem] = useState<PinjamanItem | null>(null);

  // Add a language change watcher to ensure the component refreshes when language changes
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  useEffect(() => {
    // Update current language when it changes
    const handleLanguageChange = () => {
      setCurrentLanguage(i18n.language);
      
      // Re-fetch categories when language changes to update translations
      fetchCategories();
    };
    
    // Subscribe to language changes
    i18n.on('languageChanged', handleLanguageChange);
    
    // Cleanup
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);
  
  // Call fetchCategories on component mount
  useEffect(() => {
    fetchCategories();
  }, [toast, t]);
  
  // Load categories from Supabase
  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('type')
        .order('en_name');
      
      if (error) throw error;
      setCategories((data || []).map(cat => ({
        id: cat.category_id.toString(),
        category_id: cat.category_id,
        category_key: cat.category_key,
        en_name: cat.en_name,
        id_name: cat.id_name,
        type: cat.type,
        icon: cat.icon,
        created_at: cat.created_at
      })));
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: t('common.error'),
        description: t('categories.error.load', 'Failed to load categories'),
        variant: 'destructive'
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

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

  // Get expense categories for budget creation
  const expenseCategories = categories
    .filter(cat => cat.type === 'expense')
    .map(cat => ({
      key: cat.category_id ? cat.category_id.toString() : cat.id,
      label: i18next.language === 'id' ? cat.id_name : cat.en_name
    }));

  // Budget form handlers
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

    // Find the corresponding category from our fetched categories
    const categoryId = Number(newBudget.category);
    const selectedCategory = categories.find(cat => {
      // Check if category has a category_id property that matches
      if (cat.category_id !== undefined) {
        return cat.category_id === categoryId;
      }
      // Fallback to using the id property directly
      return cat.id === newBudget.category || Number(cat.id) === categoryId;
    });
    
    if (!selectedCategory) {
      toast({
        title: t('common.error'),
        description: t('budgets.errors.invalid_category'),
        variant: "destructive"
      });
      return;
    }
    
    // Use the display name based on current language
    const displayCategoryName = i18next.language === 'id' 
      ? selectedCategory.id_name 
      : selectedCategory.en_name;

    // Add the new budget with the correct category ID
    addBudget({
      category: displayCategoryName, // Use the correct display name for the category
      categoryId: selectedCategory.category_id || Number(selectedCategory.id),  // Use the numeric ID
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
            <h1 className="text-xl font-bold">
              <AnimatedText 
                text={t('budgets.title')} 
                animationType="slide" 
                duration={0.3}
              />
            </h1>
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
                  <AnimatedText 
                    text={t('budgets.create_new_budget')}
                    animationType="fade"
                  />
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-[#868686]">
                    <AnimatedText text={t('transactions.category')} />
                  </Label>
                  <Select
                    value={newBudget.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger className="bg-[#242425] border-0 text-white">
                      <SelectValue>
                        <AnimatedText 
                          text={newBudget.category ? 
                            expenseCategories.find(c => c.key === newBudget.category)?.label || 
                            t('budgets.select_category') : 
                            t('budgets.select_category')
                          }
                        />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#242425] border-0 text-white">
                      {isLoadingCategories ? (
                        <SelectItem value="loading" disabled>
                          <AnimatedText text="Loading categories..." />
                        </SelectItem>
                      ) : (
                        expenseCategories.map((option) => (
                          <SelectItem key={option.key} value={option.key} className="hover:bg-[#333] focus:bg-[#333]">
                            <AnimatedText text={option.label} animationType="fade" />
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="amount" className="text-[#868686]">
                    <AnimatedText text={t('transactions.amount')} />
                  </Label>
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
                  <Label htmlFor="period" className="text-[#868686]">
                    <AnimatedText text={t('budgets.period')} />
                  </Label>
                  <Select
                    value={newBudget.period}
                    onValueChange={(value) => handleSelectChange('period', value as 'monthly' | 'weekly' | 'yearly')}
                  >
                    <SelectTrigger className="bg-[#242425] border-0 text-white">
                      <SelectValue>
                        <AnimatedText 
                          text={
                            newBudget.period === 'weekly' ? t('budgets.weekly') :
                            newBudget.period === 'monthly' ? t('budgets.monthly') :
                            newBudget.period === 'yearly' ? t('budgets.yearly') :
                            t('budgets.select_period')
                          }
                        />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#242425] border-0 text-white">
                      <SelectItem value="weekly" className="hover:bg-[#333] focus:bg-[#333]">
                        <AnimatedText text={t('budgets.weekly')} />
                      </SelectItem>
                      <SelectItem value="monthly" className="hover:bg-[#333] focus:bg-[#333]">
                        <AnimatedText text={t('budgets.monthly')} />
                      </SelectItem>
                      <SelectItem value="yearly" className="hover:bg-[#333] focus:bg-[#333]">
                        <AnimatedText text={t('budgets.yearly')} />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full border-[#333] hover:bg-[#333] text-white">
                  <AnimatedText text={t('buttons.cancel')} />
                </Button>
                <Button onClick={handleCreateBudget} className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">
                  <AnimatedText text={t('buttons.create')} />
                </Button>
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
            <h2 className="text-lg font-semibold text-white">
              <AnimatedText 
                text={t('budget.wantToBuyTitle')}
                animationType="fade"
              />
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#C6FE1E] hover:bg-gray-700/50"
              onClick={() => handleOpenWantToBuyForm()}
            >
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">
                <AnimatedText text={t('budget.addWantToBuy')} />
              </span>
            </Button>
          </div>
          <WantToBuyList onEditItem={handleOpenWantToBuyForm} />
        </motion.div>

        {/* Pinjaman Section */}
        <motion.div variants={itemVariants} className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              <AnimatedText 
                text={t('budget.pinjamanTitle')}
                animationType="fade"
              />
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#C6FE1E] hover:bg-gray-700/50"
              onClick={() => handleOpenPinjamanForm()}
            >
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">
                <AnimatedText text={t('budget.addPinjaman')} />
              </span>
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
