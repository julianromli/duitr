
import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useCategories } from '@/hooks/useCategories';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BudgetList: React.FC = () => {
  const { budgets, formatCurrency, deleteBudget } = useFinance();
  const { getCategoryName } = useCategories();
  const { t } = useTranslation();
  
  // Sort budgets by spending percentage (highest first)
  const sortedBudgets = [...budgets].sort((a, b) => {
    const spentPercentA = (a.spent / a.amount) * 100;
    const spentPercentB = (b.spent / b.amount) * 100;
    return spentPercentB - spentPercentA;
  });
  
  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  return (
    <motion.div
      className="space-y-4"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {sortedBudgets.length === 0 ? (
        <div className="bg-[#242425] rounded-lg p-4 text-center text-[#868686]">
          {t('budgets.no_budgets')}
        </div>
      ) : (
        sortedBudgets.map((budget) => {
          const spentPercent = (budget.spent / budget.amount) * 100;
          const isOverBudget = spentPercent > 100;
          
          return (
            <motion.div 
              key={budget.id}
              variants={itemVariants}
              className="bg-[#242425] rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white text-sm font-medium">{getCategoryName(budget.category_id)}</h3>
                  <p className="text-[#868686] text-xs">{t(`budgets.${budget.period}`)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </p>
                  <p className={`text-xs ${isOverBudget ? 'text-red-500' : 'text-[#868686]'}`}>
                    {isOverBudget ? (
                      `${spentPercent.toFixed(0)}% (${t('budgets.over_budget')})`
                    ) : (
                      `${spentPercent.toFixed(0)}%`
                    )}
                  </p>
                </div>
              </div>
              
              <Progress 
                value={spentPercent > 100 ? 100 : spentPercent} 
                className={`h-2 ${isOverBudget ? 'bg-[#3D2929]' : 'bg-[#2D2D2D]'}`}
                indicatorClassName={isOverBudget ? 'bg-red-500' : 'bg-[#C6FE1E]'}
              />
              
              <div className="flex justify-end space-x-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('common.delete')}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#1A1A1A] text-white border-0">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('budgets.delete_confirm_title')}</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#868686]">
                        {t('budgets.delete_confirm_description')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#242425] text-white border-0 hover:bg-[#333]">
                        {t('common.cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => deleteBudget(budget.id)}
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};

export default BudgetList;
