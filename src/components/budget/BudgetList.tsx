import React, { useState, useEffect } from 'react';
import { PieChart, Edit, Trash, X, Check, Calendar } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { Progress } from '@/components/ui/progress';
import { useFinance } from '@/context/FinanceContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import AnimatedText from '@/components/ui/animated-text';

const BudgetList: React.FC = () => {
  const { budgets } = useBudgets();
  const { formatCurrency, updateBudget, deleteBudget } = useFinance();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly'
  });
  
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(i18n.language);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);
  
  useEffect(() => {
    if (editingBudget) {
      const currentBudget = budgets.find(b => b.id === editingBudget);
      if (currentBudget) {
        console.log("Found budget for editing:", currentBudget);
        setEditForm({
          category: currentBudget.category || '',
          amount: currentBudget.amount.toString(),
          period: currentBudget.period as 'weekly' | 'monthly' | 'yearly' || 'monthly'
        });
      } else {
        console.warn("Could not find budget with ID:", editingBudget);
      }
    }
  }, [budgets, editingBudget]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-finance-expense';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-finance-income';
  };

  const handleEdit = (budget: any) => {
    console.log("Editing budget:", budget);
    setEditingBudget(budget.id);
    setEditForm({
      category: budget.category || '',
      amount: budget.amount.toString(),
      period: budget.period || 'monthly'
    });
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
  };

  const handleSaveEdit = (budget: any) => {
    // Validate inputs
    if (!editForm.amount || isNaN(Number(editForm.amount)) || Number(editForm.amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    // Update the budget with amount and period changes, preserve category
    updateBudget({
      ...budget,
      category: budget.category,
      amount: Number(editForm.amount),
      period: editForm.period
    });

    toast({
      title: "Success",
      description: "Budget updated successfully"
    });

    setEditingBudget(null);
  };

  const handleDelete = (id: string) => {
    deleteBudget(id);
    
    toast({
      title: "Success",
      description: "Budget deleted successfully"
    });
  };

  // Fungsi untuk mendapatkan label periode yang diterjemahkan
  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'weekly':
        return t('budgets.weekly');
      case 'yearly':
        return t('budgets.yearly');
      case 'monthly':
      default:
        return t('budgets.monthly');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-1 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <PieChart className="w-5 h-5" /> 
          <AnimatedText 
            text={t('budgets.budget_categories')} 
            animationType="fade" 
            duration={0.3}
          />
        </h2>
      </div>
      
      <div className="space-y-4">
        {budgets.map((budget) => {
              const percentage = (budget.spent / budget.amount) * 100;
              const remaining = budget.amount - budget.spent;
              const isEditing = editingBudget === budget.id;
              
              return (
                <div key={budget.id} className="border bg-card rounded-xl p-4 space-y-3 hover:bg-[#2a2a2b] transition-colors duration-200">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex flex-col space-y-1">
                          <label className="text-sm font-medium">
                            <AnimatedText text={t('transactions.category')} animationType="slide" />:
                          </label>
                          <span className="text-sm">
                            <AnimatedText text={budget.category || 'No Category'} animationType="scale" />
                          </span>
                        </div>
                      
                        <div className="flex flex-col space-y-1">
                          <label className="text-sm font-medium">
                            <AnimatedText text={t('transactions.amount')} animationType="slide" />:
                          </label>
                          <Input 
                            value={editForm.amount}
                            onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                            className="w-full h-8"
                            type="number"
                            min="0"
                          />
                        </div>
                      
                        <div className="flex flex-col space-y-1">
                          <label className="text-sm font-medium">
                            <AnimatedText text={t('budgets.period')} animationType="slide" />:
                          </label>
                          <Select
                            value={editForm.period}
                            onValueChange={(value) => setEditForm({...editForm, period: value as 'weekly' | 'monthly' | 'yearly'})}
                          >
                            <SelectTrigger className="w-full h-8">
                              <SelectValue placeholder={t('budgets.select_period')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">
                                <AnimatedText text={t('budgets.weekly')} />
                              </SelectItem>
                              <SelectItem value="monthly">
                                <AnimatedText text={t('budgets.monthly')} />
                              </SelectItem>
                              <SelectItem value="yearly">
                                <AnimatedText text={t('budgets.yearly')} />
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEdit}
                          className="h-8"
                        >
                          <X className="h-4 w-4 mr-1" /> 
                          <AnimatedText text={t('common.cancel')} />
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleSaveEdit(budget)}
                          className="h-8 bg-finance-income text-black hover:bg-finance-income/90"
                        >
                          <Check className="h-4 w-4 mr-1" /> 
                          <AnimatedText text={t('common.save')} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Card Header - Category Name and Edit Button */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">
                            <AnimatedText 
                              text={budget.category}
                              animationType="slide"
                              duration={0.4}
                            />
                          </h3>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <AnimatedText 
                              text={getPeriodLabel(budget.period || 'monthly')}
                              className="text-xs"
                              animationType="fade"
                            />
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(budget)}>
                              <Edit className="mr-2 h-4 w-4" /> 
                              <AnimatedText text={t('common.edit')} />
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(budget.id)}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" /> 
                              <AnimatedText text={t('common.delete')} />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Prominent Progress Bar */}
                      <div className="space-y-2">
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className="h-3 w-full" 
                          indicatorClassName={getProgressColor(percentage)} 
                        />
                      </div>
                      
                      {/* Consolidated Financial Details */}
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className={`font-semibold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                            {formatCurrency(budget.spent)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          dari {formatCurrency(budget.amount)}
                        </div>
                      </div>
                      
                      {/* Clear Status Readout */}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          <AnimatedText 
                            text={`${Math.round(percentage)}% digunakan`}
                            className="text-xs"
                            animationType="slide"
                          />
                        </span>
                        <span className={remaining < 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-green-600 dark:text-green-400'}>
                          <AnimatedText 
                            text={remaining < 0 
                              ? `Kelebihan ${formatCurrency(Math.abs(remaining))}`
                              : `Sisa ${formatCurrency(Math.abs(remaining))}`
                            }
                            className="text-xs"
                            animationType="slide"
                          />
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
    </div>
  );
};

export default BudgetList;
