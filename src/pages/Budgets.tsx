import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/layout/Header';
import BudgetProgress from '@/components/budget/BudgetProgress';
import BudgetList from '@/components/budget/BudgetList';
import { PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/hooks/use-toast';

const Budgets: React.FC = () => {
  const { t } = useTranslation();
  const { addBudget } = useFinance();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    spent: 0
  });

  const categoryOptions = [
    t('budgets.categories.groceries'),
    t('budgets.categories.dining'),
    t('budgets.categories.transportation'),
    t('budgets.categories.entertainment'),
    t('budgets.categories.utilities'),
    t('budgets.categories.housing'),
    t('budgets.categories.healthcare'),
    t('budgets.categories.education'),
    t('budgets.categories.shopping'),
    t('budgets.categories.personal_care'),
    t('budgets.categories.travel'),
    t('budgets.categories.gifts'),
    t('budgets.categories.other')
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBudget({
      ...newBudget,
      [name]: value
    });
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

    // Add the new budget
    addBudget({
      category: newBudget.category,
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

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t('budgets.title')}</h2>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="w-4 h-4" />
            {t('budgets.create_budget')}
          </Button>
        </div>
        
        <BudgetProgress />
        
        <div className="mt-6">
          <BudgetList />
        </div>

        {/* Create Budget Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                {t('budgets.create_new_budget')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">{t('transactions.category')}</Label>
                <Select
                  value={newBudget.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('budgets.select_category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="amount">{t('transactions.amount')}</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder={t('budgets.enter_amount')}
                  value={newBudget.amount}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="period">{t('budgets.period')}</Label>
                <Select
                  value={newBudget.period}
                  onValueChange={(value) => handleSelectChange('period', value as 'monthly' | 'weekly' | 'yearly')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('budgets.select_period')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t('budgets.weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('budgets.monthly')}</SelectItem>
                    <SelectItem value="yearly">{t('budgets.yearly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('buttons.cancel')}</Button>
              <Button onClick={handleCreateBudget}>{t('buttons.create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Budgets;
