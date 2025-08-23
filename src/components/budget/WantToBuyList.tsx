// Enhanced WantToBuyList component with improved UI/UX design
// Features: Modern card design, enhanced animations, priority badges, better visual hierarchy
// Improved accessibility, micro-interactions, and responsive layout

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { WantToBuyItem } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Edit, Trash, ShoppingBag, Package, HelpCircle, AlertTriangle, Calendar, CheckCircle2, Clock, Star } from 'lucide-react';
import { formatIDR } from '@/utils/currency';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'Tinggi': 
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      case 'Sedang': 
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        };
      case 'Rendah': 
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          badge: 'bg-green-500/20 text-green-400 border-green-500/30'
        };
      default: 
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
    }
  };

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'Kebutuhan': 
        return {
          icon: <ShoppingBag className="h-4 w-4" />,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
      case 'Keinginan': 
        return {
          icon: <Package className="h-4 w-4" />,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        };
      default: 
        return {
          icon: <HelpCircle className="h-4 w-4" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
    }
  };

  const getStatusIcon = (isPurchased: boolean) => {
    return isPurchased ? 
      <CheckCircle2 className="h-5 w-5 text-green-400" /> : 
      <Clock className="h-5 w-5 text-gray-400" />;
  };

  // Map priority values to translation keys
  const getPriorityTranslationKey = (priority: string) => {
    switch (priority) {
      case 'Tinggi': return 'budget.priorityHigh';
      case 'Sedang': return 'budget.priorityMedium';
      case 'Rendah': return 'budget.priorityLow';
      default: return 'budget.priorityMedium';
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

  if (wantToBuyItems.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12 px-6"
      >
        <div className="mx-auto w-16 h-16 bg-[#C6FE1E] rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="h-8 w-8 text-[#0D0D0D]" />
        </div>
        <p className="text-gray-500 text-lg font-medium mb-2">{t('budget.noWantToBuyItems')}</p>
        <p className="text-gray-400 text-sm">{t('budget.noWantToBuyDescription')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
    >
      <AnimatePresence mode="popLayout">
        {wantToBuyItems.map((item, index) => {
          const priorityConfig = getPriorityConfig(item.priority);
          const categoryConfig = getCategoryConfig(item.category);
          
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                layout: { duration: 0.3 }
              }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                item.is_purchased 
                  ? 'bg-[#0D0D0D] border-[#0D0D0D] shadow-lg' 
                  : `bg-[#171717] shadow-xl hover:shadow-2xl hover:border-gray-500/60 ${priorityConfig.borderColor}`
              }`}
            >
              {/* Priority indicator bar */}
              <div className={`absolute top-0 left-0 w-1 h-full ${priorityConfig.bgColor}`} />
              
              {/* Status indicator */}
              <div className="absolute top-4 right-4">
                {getStatusIcon(item.is_purchased)}
              </div>

              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-1">
                    <Checkbox
                      id={`wtb-${item.id}`}
                      checked={item.is_purchased}
                      onCheckedChange={() => handleCheckChange(item)}
                      className="mr-3 border-gray-500 data-[state=checked]:bg-[#C6FE1E] data-[state=checked]:text-[#0D0D0D] data-[state=checked]:border-[#C6FE1E] dark:border-gray-600 dark:data-[state=checked]:bg-blue-600 dark:data-[state=checked]:text-white"
                      aria-label={`Mark ${item.name} as purchased`}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Item name and price */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold transition-all duration-200 ${
                          item.is_purchased 
                            ? 'line-through text-gray-400' 
                            : 'text-white group-hover:text-blue-300'
                        }`}>
                          {item.name}
                        </h3>
                        <div className="mt-1">
                          <span className={`text-xl font-bold ${
                            item.is_purchased ? 'text-gray-500' : 'text-green-400'
                          }`}>
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge 
                        variant="outline" 
                        className={`${categoryConfig.badge} border text-xs font-medium`}
                      >
                        <span className={categoryConfig.color}>
                          {categoryConfig.icon}
                        </span>
                        <span className="ml-1">
                          {t(`budget.${item.category.toLowerCase()}`)}
                        </span>
                      </Badge>
                      
                      <Badge 
                        variant="outline" 
                        className={`${priorityConfig.badge} border text-xs font-medium`}
                      >
                        <Star className={`h-3 w-3 ${priorityConfig.color}`} />
                        <span className="ml-1">
                          {t(getPriorityTranslationKey(item.priority))}
                        </span>
                      </Badge>
                      
                      <Badge 
                        variant="outline" 
                        className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs font-medium"
                      >
                        <Calendar className="h-3 w-3" />
                        <span className="ml-1">
                          {format(new Date(item.estimated_date), 'dd MMM yyyy')}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="absolute top-4 right-12 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                    onClick={() => onEditItem(item)}
                    disabled={item.is_purchased}
                    aria-label={`Edit ${item.name}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </motion.div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#1A1A1A] border-white/10 text-white rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white text-lg font-semibold">
                        {t('common.areYouSure')}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300 text-sm">
                        {t('budget.deleteWantToBuyConfirm')} "{item.name}"? {t('common.cannotBeUndone')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white border-white/10 rounded-lg">
                        {t('common.cancel')}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteWantToBuyItem(item.id)}
                        className="bg-[#FF4444] hover:bg-[#FF6666] text-white rounded-lg"
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default WantToBuyList;