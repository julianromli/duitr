// Add comment indicating changes made to the file
// Combined budget management features with Want to Buy and Pinjaman features from the old BudgetPage.tsx.
// Improved UI organization and made the page mobile responsive.
// Reorganized layout to show Budget Categories after Overview and Spending sections.
// Redesigned header to match other pages and removed scrollbar.
// Fixed container layout issues that caused double scrollbars.

import React, { useState, useEffect, useMemo } from 'react';
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
import { useCategories } from '@/hooks/useCategories';
import CategoryIcon from '@/components/shared/CategoryIcon';

const BudgetPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { addBudget } = useFinance();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categories: allCategories, isLoading: isLoadingCategories } = useCategories();
  
  // Budget state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    spent: 0
  });

  // Filter expense categories (both default and custom) - using same pattern as ExpenseForm
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
      // Categories will automatically update through useCategories hook
    };
    
    // Subscribe to language changes
    i18n.on('languageChanged', handleLanguageChange);
    
    // Cleanup
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay: 0.1
      }
    }
  };

  const budgetSectionVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: 0.2
      }
    }
  };

  const wantToBuySectionVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: 0.3
      }
    }
  };

  const pinjamanSectionVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 25,
        delay: 0.4
      }
    }
  };

  const buttonHoverVariants = {
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    tap: {
      scale: 0.95
    }
  };



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
    const selectedCategory = categories.find(cat => cat.id === newBudget.category);
    
    if (!selectedCategory) {
      toast({
        title: t('common.error'),
        description: t('budgets.errors.invalid_category'),
        variant: "destructive"
      });
      return;
    }

    // Add the new budget with the correct category ID
    addBudget({
      category: selectedCategory.name, // Use the display name for the category
      categoryId: selectedCategory.id,  // Use the ID
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
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white px-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-4 pt-12">
        {/* Enhanced Header with improved visual hierarchy */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          variants={headerVariants}
        >
          <div className="flex items-center">
            <motion.button 
              onClick={() => navigate('/')} 
              className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft size={24} className="text-white" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                <AnimatedText 
                  text={t('budgets.title')} 
                  animationType="slide" 
                  duration={0.3}
                />
              </h1>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <motion.div
                variants={buttonHoverVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Button className="bg-gradient-to-r from-[#C6FE1E] to-[#A8E016] hover:from-[#B0E018] hover:to-[#98D014] text-[#0D0D0D] rounded-full h-12 w-12 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-[#C6FE1E]/20">
                  <PlusCircle size={22} className="drop-shadow-sm" />
                </Button>
              </motion.div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-white/10 text-white backdrop-blur-xl shadow-2xl">
              <DialogHeader className="pb-6">
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 bg-[#C6FE1E]/10 rounded-full">
                    <PlusCircle className="h-6 w-6 text-[#C6FE1E]" />
                  </div>
                  <AnimatedText 
                    text={t('budgets.create_new_budget')}
                    animationType="fade"
                  />
                </DialogTitle>
                <p className="text-sm text-gray-400 mt-2">
                  <AnimatedText 
                    text={t('budgets.create_description', 'Set spending limits for your categories')}
                    animationType="fade"
                    duration={0.4}
                  />
                </p>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
                    <AnimatedText text={t('transactions.category')} />
                  </Label>
                  <Select
                    value={newBudget.category ? String(newBudget.category) : ""}
                    onValueChange={(value) => handleSelectChange('category', value)}
                    disabled={isLoadingCategories}
                  >
                    <SelectTrigger className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50">
                      <SelectValue>
                        <AnimatedText 
                          text={isLoadingCategories ? t('common.loading') : 
                            newBudget.category ? 
                              categories.find(c => c.id === newBudget.category)?.name || t('budgets.select_category') :
                              t('budgets.select_category')
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
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
                    <AnimatedText text={t('transactions.amount')} />
                  </Label>
                  <FormattedInput
                    id="amount"
                    name="amount"
                    placeholder={t('budgets.enter_amount')}
                    value={newBudget.amount}
                    onChange={handleAmountChange}
                    onValueChange={handleAmountValueChange}
                    className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="period" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#C6FE1E] rounded-full"></div>
                    <AnimatedText text={t('budgets.period')} />
                  </Label>
                  <Select
                    value={newBudget.period}
                    onValueChange={(value) => handleSelectChange('period', value as 'monthly' | 'weekly' | 'yearly')}
                  >
                    <SelectTrigger className="bg-[#242425]/80 border border-white/10 text-white h-12 rounded-xl hover:bg-[#242425] transition-colors duration-200 focus:ring-2 focus:ring-[#C6FE1E]/50">
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
                    <SelectContent className="bg-[#242425] border border-white/10 text-white backdrop-blur-xl">
                      <SelectItem value="weekly" className="hover:bg-[#333]/80 focus:bg-[#333]/80 transition-colors duration-200">
                        <AnimatedText text={t('budgets.weekly')} />
                      </SelectItem>
                      <SelectItem value="monthly" className="hover:bg-[#333]/80 focus:bg-[#333]/80 transition-colors duration-200">
                        <AnimatedText text={t('budgets.monthly')} />
                      </SelectItem>
                      <SelectItem value="yearly" className="hover:bg-[#333]/80 focus:bg-[#333]/80 transition-colors duration-200">
                        <AnimatedText text={t('budgets.yearly')} />
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 pt-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)} 
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
                    onClick={handleCreateBudget} 
                    className="w-full h-12 bg-gradient-to-r from-[#C6FE1E] to-[#A8E016] hover:from-[#B0E018] hover:to-[#98D014] text-[#0D0D0D] font-semibold border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <AnimatedText text={t('buttons.create')} />
                  </Button>
                </motion.div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
        
        {/* Budget Sections */}
        <motion.div variants={budgetSectionVariants} className="space-y-6">
          {/* Budget Overview */}
          <BudgetProgress />
          
          {/* Budget Categories List */}
          <BudgetList />
        </motion.div>
        
        {/* Want to Buy Section */}
        <motion.div variants={wantToBuySectionVariants} className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-[#C6FE1E] to-[#A8E016] rounded-full"></div>
              <h2 className="text-xl font-bold text-white">
                <AnimatedText 
                  text={t('budget.wantToBuyTitle')}
                  animationType="fade"
                />
              </h2>
            </div>
            <motion.div
              variants={buttonHoverVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-[#C6FE1E] hover:bg-[#C6FE1E]/10 rounded-full h-10 w-10 transition-all duration-200"
                onClick={() => handleOpenWantToBuyForm()}
              >
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">
                  <AnimatedText text={t('budget.addWantToBuy')} />
                </span>
              </Button>
            </motion.div>
          </div>
          <WantToBuyList onEditItem={handleOpenWantToBuyForm} />
        </motion.div>

        {/* Pinjaman Section */}
        <motion.div variants={pinjamanSectionVariants} className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-[#C6FE1E] to-[#A8E016] rounded-full"></div>
              <h2 className="text-xl font-bold text-white">
                <AnimatedText 
                  text={t('budget.pinjamanTitle')}
                  animationType="fade"
                />
              </h2>
            </div>
            <motion.div
              variants={buttonHoverVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-[#C6FE1E] hover:bg-[#C6FE1E]/10 rounded-full h-10 w-10 transition-all duration-200"
                onClick={() => handleOpenPinjamanForm()}
              >
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">
                  <AnimatedText text={t('budget.addPinjaman')} />
                </span>
              </Button>
            </motion.div>
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
