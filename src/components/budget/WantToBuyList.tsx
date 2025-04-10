// Add comment indicating changes made to the file
// Created WantToBuyList component to display and manage wishlist items.

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { WantToBuyItem } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { Edit, Trash, ShoppingBag, Package, HelpCircle, AlertTriangle } from 'lucide-react';
import { formatIDR } from '@/utils/currency'; // Assuming formatIDR is suitable
import { format } from 'date-fns';
import { motion } from 'framer-motion';
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
} from "@/components/ui/alert-dialog"

interface WantToBuyListProps {
  onEditItem: (item: WantToBuyItem) => void;
}

const WantToBuyList: React.FC<WantToBuyListProps> = ({ onEditItem }) => {
  const { wantToBuyItems, updateWantToBuyItem, deleteWantToBuyItem, formatCurrency } = useFinance();
  const { t } = useTranslation();

  const handleCheckChange = (item: WantToBuyItem) => {
    updateWantToBuyItem({ ...item, is_purchased: !item.is_purchased });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Tinggi': return 'text-red-500';
      case 'Sedang': return 'text-yellow-500';
      case 'Rendah': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

   const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Kebutuhan': return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case 'Keinginan': return <Package className="h-4 w-4 text-purple-500" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

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
        className="space-y-3"
        variants={listVariants}
        initial="hidden"
        animate="visible"
    >
      {wantToBuyItems.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('budget.noWantToBuyItems')}</p>
      )}
      {wantToBuyItems.map((item) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          className={`flex items-center p-3 bg-[#242425] dark:bg-gray-800 rounded-lg shadow-sm ${item.is_purchased ? 'opacity-60' : ''}`}
        >
          <Checkbox
            id={`wtb-${item.id}`}
            checked={item.is_purchased}
            onCheckedChange={() => handleCheckChange(item)}
            className="mr-3 border-gray-500 data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D] dark:border-gray-600 dark:data-[state=checked]:bg-blue-600 dark:data-[state=checked]:text-white"
            aria-label={`Mark ${item.name} as purchased`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <span className={`font-medium truncate ${item.is_purchased ? 'line-through text-gray-500 dark:text-gray-400' : 'text-white dark:text-gray-100'}`}>
                    {item.name}
                </span>
                 <span className="text-sm font-semibold text-white dark:text-gray-200 ml-2 flex-shrink-0">
                    {formatCurrency(item.price)} {/* Use formatCurrency from context */}
                 </span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1 items-center">
              <span className="flex items-center gap-1">{getCategoryIcon(item.category)}{t(`budget.${item.category.toLowerCase()}`)}</span>
              <span className="flex items-center gap-1">
                    <AlertTriangle className={`h-3 w-3 ${getPriorityColor(item.priority)}`} />
                    {t(`budget.priority${item.priority}`)}
              </span>
              <span>{t('budget.estimate')}: {format(new Date(item.estimated_date), 'dd MMM yyyy')}</span>
            </div>
          </div>
          <div className="ml-2 flex items-center flex-shrink-0">
             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700/50 dark:text-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-700"
                onClick={() => onEditItem(item)}
                disabled={item.is_purchased}
             >
                <Edit className="h-4 w-4" />
                <span className="sr-only">{t('common.edit')}</span>
             </Button>
              <AlertDialog>
                 <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-900/20 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/30"
                    >
                        <Trash className="h-4 w-4" />
                         <span className="sr-only">{t('common.delete')}</span>
                    </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent className="bg-[#1A1A1A] border-none text-white dark:bg-gray-800 dark:text-gray-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400 dark:text-gray-500">
                         {t('budget.deleteWantToBuyConfirm')} "{item.name}"? {t('common.cannotBeUndone')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200">{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                         onClick={() => deleteWantToBuyItem(item.id)}
                         className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
                       >
                         {t('common.delete')}
                       </AlertDialogAction>
                    </AlertDialogFooter>
                 </AlertDialogContent>
             </AlertDialog>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default WantToBuyList; 