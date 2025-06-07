
// Fixed BudgetList to handle category property properly and correct function calls
// Updated to match the updated FinanceContext interface

import React, { useState, useEffect } from 'react';
import { PieChart, Edit, Trash, X, Check, Calendar } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { formatCurrency, updateBudget, deleteBudget, categories } = useFinance();
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
        // Get category name from categories array
        const categoryName = categories.find(cat => 
          String(cat.category_id) === String(currentBudget.category_id)
        )?.en_name || currentBudget.category || '';
        
        setEditForm({
          category: categoryName,
          amount: currentBudget.amount.toString(),
          period: currentBudget.period as 'weekly' | 'monthly' | 'yearly' || 'monthly'
        });
      } else {
        console.warn("Could not find budget with ID:", editingBudget);
      }
    }
  }, [budgets, editingBudget, categories]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-finance-expense';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-finance-income';
  };

  const handleEdit = (budget: any) => {
    console.log("Editing budget:", budget);
    setEditingBudget(budget.id);
    const categoryName = categories.find(cat => 
      String(cat.category_id) === String(budget.category_id)
    )?.en_name || budget.category || '';
    
    setEditForm({
      category: categoryName,
      amount: budget.amount.toString(),
      period: budget.period || 'monthly'
    });
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
  };

  const handleSaveEdit = async (budget: any) => {
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
    await updateBudget(budget.id, {
      amount: Number(editForm.amount),
      period: editForm.period
    });

    setEditingBudget(null);
  };

  const handleDelete = async (id: string) => {
    await deleteBudget(id);
  };

  // Get category name helper
  const getCategoryName = (budget: any) => {
    const category = categories.find(cat => 
      String(cat.category_id) === String(budget.category_id)
    );
    return category?.en_name || budget.category || 'Unknown Category';
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5" /> 
            <AnimatedText 
              text={t('budgets.budget_categories')} 
              animationType="fade" 
              duration={0.3}
            />
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {budgets.map((budget) => {
              const percentage = (budget.spent / budget.amount) * 100;
              const remaining = budget.amount - budget.spent;
              const isEditing = editingBudget === budget.id;
              const categoryName = getCategoryName(budget);
              
              return (
                <div key={budget.id} className="space-y-2">
                  {isEditing ? (
                    <div className="flex flex-col space-y-3 bg-gray-100 dark:bg-gray-800 p-3 rounded-md border">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">
                            <AnimatedText text={t('transactions.category')} animationType="slide" />:
                          </label>
                          <span className="text-sm">
                            <AnimatedText text={categoryName} animationType="scale" />
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">
                            <AnimatedText text={t('transactions.amount')} animationType="slide" />:
                          </label>
                          <Input 
                            value={editForm.amount}
                            onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                            className="w-28 h-8"
                            type="number"
                            min="0"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">
                            <AnimatedText text={t('budgets.period')} animationType="slide" />:
                          </label>
                          <Select
                            value={editForm.period}
                            onValueChange={(value) => setEditForm({...editForm, period: value as 'weekly' | 'monthly' | 'yearly'})}
                          >
                            <SelectTrigger className="w-28 h-8">
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
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">
                          <AnimatedText 
                            text={categoryName}
                            animationType="slide"
                            duration={0.4}
                          />
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <AnimatedText 
                            text={getPeriodLabel(budget.period || 'monthly')}
                            className="text-xs"
                            animationType="fade"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          <span className={remaining < 0 ? 'text-finance-expense' : ''}>
                            {formatCurrency(budget.spent)}
                          </span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-muted-foreground">{formatCurrency(budget.amount)}</span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
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
                    </div>
                  )}
                  
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2" 
                    indicatorClassName={getProgressColor(percentage)} 
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <AnimatedText 
                      text={t('budgets.used', { percentage: Math.round(percentage) })}
                      className="text-xs"
                      animationType="slide"
                    />
                    <span className={remaining < 0 ? 'text-finance-expense' : ''}>
                      <AnimatedText 
                        text={remaining < 0 
                          ? t('budgets.over_by', { amount: formatCurrency(Math.abs(remaining)) })
                          : t('budgets.remaining', { amount: formatCurrency(Math.abs(remaining)) })
                        }
                        className="text-xs"
                        animationType="slide"
                      />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetList;
