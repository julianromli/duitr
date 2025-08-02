// Add comment indicating changes made to the file
// Created PinjamanList component to display debts/credits with due date coloring.
// Updated to show due date with icon instead of text label.
// Fixed date parsing to ensure consistent display regardless of timezone.

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
  const { pinjamanItems, updatePinjamanItem, deletePinjamanItem, formatCurrency } = useFinance();
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  const handleCheckChange = (item: PinjamanItem) => {
    updatePinjamanItem({ ...item, is_settled: !item.is_settled });
  };

   const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Utang': return <Landmark className="h-4 w-4 text-red-500" />;
      case 'Piutang': return <HandCoins className="h-4 w-4 text-green-500" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to format a date string consistently
  const formatDateString = (dateStr: string | null): string => {
    if (!dateStr) return ''; 
    
    try {
      // For YYYY-MM-DD format strings, parse without timezone conversion
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return format(new Date(year, month - 1, day), 'dd MMM yyyy');
      }
      
      // Otherwise use parseISO which handles ISO strings
      return format(parseISO(dateStr), 'dd MMM yyyy');
    } catch (e) {
      console.error('Error formatting date:', dateStr, e);
      return dateStr;
    }
  };

  // Function to determine background and border color based on due date
  const getDueDateStyling = (dueDateStr: string, isSettled: boolean): string => {
      if (isSettled) {
          return 'bg-[#242425]/50 border-l-4 border-gray-500'; // Settled style
      }
      try {
        // Parse the date in a timezone-agnostic way
        let dueDate;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
          const [year, month, day] = dueDateStr.split('-').map(Number);
          dueDate = new Date(year, month - 1, day);
        } else {
          dueDate = parseISO(dueDateStr);
        }
        
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-2 mt-4"
      initial="hidden"
      animate="visible"
      variants={listVariants}
    >
      {pinjamanItems.map((item) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          className={`flex flex-col sm:flex-row sm:items-center p-3 rounded-md space-y-3 sm:space-y-0 ${getDueDateStyling(item.due_date || '', item.is_settled)}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center w-full sm:w-auto">
            <Checkbox
              id={`pinjaman-${item.id}`}
              checked={item.is_settled}
              onCheckedChange={() => handleCheckChange(item)}
              className="mr-3 border-gray-500 data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D] dark:border-gray-600 dark:data-[state=checked]:bg-blue-600 dark:data-[state=checked]:text-white"
              aria-label={`Mark ${item.name} as settled`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <span className={`font-medium truncate ${item.is_settled ? 'line-through text-gray-500 dark:text-gray-400' : 'text-white dark:text-gray-100'}`}>
                     {item.name}
                  </span>
                  <span className="text-sm font-semibold text-white dark:text-gray-200 sm:ml-2 flex-shrink-0">
                     {formatCurrency(item.amount)}
                  </span>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1 items-center">
                <span className="flex items-center gap-1">{getCategoryIcon(item.category)}{t(`budget.${item.category?.toLowerCase() || 'utang'}`)}</span>
                <span className="flex items-center gap-1">
                   <Clock className="h-3 w-3 text-gray-400"/> 
                   {formatDateString(item.due_date)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end w-full sm:w-auto sm:ml-2 flex-shrink-0">
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
                 <AlertDialogContent className="bg-[#1A1A1A] border-white/10 text-white rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white text-lg font-semibold">
                        {t('common.areYouSure')}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300 text-sm">
                         {t('budget.deletePinjamanConfirm')} "{item.name}"? {t('common.cannotBeUndone')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white border-white/10 rounded-lg">
                        {t('common.cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction
                         onClick={() => deletePinjamanItem(item.id)}
                         className="bg-[#FF4444] hover:bg-[#FF6666] text-white rounded-lg"
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