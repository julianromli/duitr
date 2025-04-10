// Add comment indicating changes made to the file
// Created PinjamanList component to display debts/credits with due date coloring.
// Updated to show due date with icon instead of text label.

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { PinjamanItem } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { Edit, Trash, Landmark, HandCoins, HelpCircle, Clock } from 'lucide-react';
import { format, differenceInDays, isPast, parseISO } from 'date-fns'; // Import necessary date-fns functions
import { cn } from '@/lib/utils';
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
} from "@/components/ui/alert-dialog";

interface PinjamanListProps {
  onEditItem: (item: PinjamanItem) => void;
}

const PinjamanList: React.FC<PinjamanListProps> = ({ onEditItem }) => {
  const { pinjamanItems, updatePinjamanItem, deletePinjamanItem } = useFinance();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const handleCheckChange = (item: PinjamanItem) => {
    updatePinjamanItem({ ...item, is_settled: !item.is_settled });
  };

   const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Utang': return <Landmark className="h-4 w-4 text-red-500" />;
      case 'Piutang': return <HandCoins className="h-4 w-4 text-green-500" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to determine background and border color based on due date
  const getDueDateStyling = (dueDateStr: string, isSettled: boolean): string => {
      if (isSettled) {
          return 'bg-[#242425]/50 border-l-4 border-gray-500'; // Settled style
      }
      try {
        const dueDate = parseISO(dueDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare dates only
        dueDate.setHours(0, 0, 0, 0);

        const diffDays = differenceInDays(dueDate, today);

        if (diffDays < 0) {
            return 'bg-red-500/20 dark:bg-red-900/40 border-l-4 border-red-500'; // Overdue (Red)
        }
        if (diffDays <= 3) {
             return 'bg-yellow-500/20 dark:bg-yellow-800/40 border-l-4 border-yellow-500'; // Due soon (Yellow)
        }
         return 'bg-[#242425] border-l-4 border-green-500'; // Due later (Green border)
      } catch (e) {
          console.error("Error parsing due date:", dueDateStr, e);
          return 'bg-[#242425]'; // Default background on error
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
       {pinjamanItems.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('budget.noPinjamanItems')}</p>
      )}
      {pinjamanItems.map((item) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          className={cn(
            `flex items-center p-3 rounded-lg shadow-sm transition-opacity duration-300`,
             getDueDateStyling(item.due_date, item.is_settled),
             item.is_settled ? 'opacity-60' : ''
           )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Checkbox
            id={`pinjaman-${item.id}`}
            checked={item.is_settled}
            onCheckedChange={() => handleCheckChange(item)}
            className="mr-3 border-gray-500 data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D] dark:border-gray-600 dark:data-[state=checked]:bg-blue-600 dark:data-[state=checked]:text-white"
            aria-label={`Mark ${item.name} as settled`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <span className={`font-medium truncate ${item.is_settled ? 'line-through text-gray-500 dark:text-gray-400' : 'text-white dark:text-gray-100'}`}>
                   {item.name}
                </span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1 items-center">
              <span className="flex items-center gap-1">{getCategoryIcon(item.category)}{t(`budget.${item.category.toLowerCase()}`)}</span>
              <span className="flex items-center gap-1">
                 <Clock className="h-3 w-3 text-gray-400"/> 
                 {format(parseISO(item.due_date), 'dd MMM yyyy')}
              </span>
            </div>
          </div>
          <div className="ml-2 flex items-center flex-shrink-0">
             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700/50 dark:text-gray-500 dark:hover:text-gray-100 dark:hover:bg-gray-700"
                onClick={() => onEditItem(item)}
                disabled={item.is_settled}
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
                         {t('budget.deletePinjamanConfirm')} "{item.name}"? {t('common.cannotBeUndone')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200">{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                         onClick={() => deletePinjamanItem(item.id)}
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

export default PinjamanList; 