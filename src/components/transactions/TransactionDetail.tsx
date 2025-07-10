import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, FileText, Tag, ArrowDown, ArrowUp, ArrowLeftRight, X, Pencil, Save } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import CategoryIcon from '@/components/shared/CategoryIcon';
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocalizedCategoriesByType } from '@/utils/categoryUtils';
import { useAuth } from '@/context/AuthContext';
import { DatePicker } from '@/components/ui/date-picker';
import { FormattedInput } from '@/components/ui/formatted-input';
import { format, parseISO } from 'date-fns';
import { id as idLocale, enUS as enUSLocale } from 'date-fns/locale';

interface TransactionDetailProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({ 
  transactionId, 
  open, 
  onOpenChange 
}) => {
  const { t } = useTranslation();
  const { transactions, formatCurrency, wallets, updateTransaction, getDisplayCategoryName } = useFinance();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Find the transaction
  const transaction = transactions.find(t => t.id === transactionId);
  
  // State for edited transaction
  const [editedTransaction, setEditedTransaction] = useState<any>(null);
  // State for categories
  const [categories, setCategories] = useState<{id: string | number; name: string}[]>([]);
  
  // Load categories when needed
  useEffect(() => {
    const loadCategories = async () => {
      if (transaction && transaction.type !== 'transfer' && isEditing) {
        try {
          const type = transaction.type === 'income' ? 'income' : 'expense';
          const fetchedCategories = await getLocalizedCategoriesByType(type, user?.id);
          
          // Sort categories by ID to maintain consistent order
          const sortedCategories = [...fetchedCategories].sort((a, b) => {
            // Ensure IDs are treated as numbers for comparison
            const idA = typeof a.id === 'number' ? a.id : Number(a.id);
            const idB = typeof b.id === 'number' ? b.id : Number(b.id);
            return idA - idB; // This returns a number for comparison
          });
          
          setCategories(sortedCategories);
        } catch (error) {
          console.error('Error loading categories:', error);
          toast({
            title: t('common.error'),
            description: t('categories.error.load'),
            variant: 'destructive'
          });
        }
      }
    };
    
    loadCategories();
  }, [transaction, isEditing, t]);
  
  // Reset edited transaction when transaction changes or dialog opens/closes
  useEffect(() => {
    if (transaction) {
      setEditedTransaction({
        id: transaction.id,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        category: transaction.category,
        description: transaction.description,
        type: transaction.type,
        walletId: transaction.walletId
      });
      // Reset editing mode when transaction changes
      setIsEditing(false);
    }
  }, [transaction, open]);
  
  // Handle dialog close (cancel editing)
  const handleOpenChange = (newOpen: boolean) => {
    // If dialog is closing and we're in edit mode, reset the edited transaction
    if (!newOpen && isEditing) {
      setIsEditing(false);
      // Reset to original transaction data
      if (transaction) {
        setEditedTransaction({
          id: transaction.id,
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          category: transaction.category,
          description: transaction.description,
          type: transaction.type,
          walletId: transaction.walletId
        });
      }
    }
    onOpenChange(newOpen);
  };
  
  if (!transaction || !editedTransaction) {
    return null;
  }
  
  // Format date and time for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'; // Handle null/empty date
    try {
      const date = parseISO(dateString); // Parse the ISO string
      // Format as MM/DD/YYYY, H:MM AM/PM
      return format(date, 'MM/dd/yyyy, h:mm a');
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString; // Fallback to original string on error
    }
  };
  
  // Format date for input field
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Get wallet name by ID
  const getWalletName = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : 'Unknown Wallet';
  };
  
  // Handle form field change
  const handleChange = (field: string, value: any) => {
    setEditedTransaction({
      ...editedTransaction,
      [field]: value
    });
  };

  const handleAmountChange = (value: string) => {
    setEditedTransaction({
      ...editedTransaction,
      amount: value.replace(/\./g, '')
    });
  };

  const handleAmountValueChange = (numericValue: number) => {
    setEditedTransaction({
      ...editedTransaction,
      amount: numericValue
    });
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    
    if (transaction) {
      setEditedTransaction({
        id: transaction.id,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        category: transaction.category,
        description: transaction.description,
        type: transaction.type,
        walletId: transaction.walletId
      });
    }
  };
  
  // Handle save changes
  const handleSave = () => {
    updateTransaction({
      ...transaction,
      amount: parseFloat(editedTransaction.amount),
      categoryId: editedTransaction.categoryId,
      description: editedTransaction.description || '',
      walletId: editedTransaction.walletId
    });
    
    setIsEditing(false);
    toast({
      title: 'Success',
      description: 'Transaction updated successfully'
    });
  };
  
  // Type icon based on transaction type
  const getTypeIcon = () => {
    if (transaction.type === 'income') {
      return <ArrowUp className="w-5 h-5 text-[#C6FE1E] dark:text-green-400" />;
    } else if (transaction.type === 'expense') {
      return <ArrowDown className="w-5 h-5 text-[#FF6B6B] dark:text-red-400" />;
    } else {
      return <ArrowLeftRight className="w-5 h-5 text-[#C6FE1E] dark:text-yellow-400" />;
    }
  };
  
  // Get type label
  const getTypeLabel = () => {
    if (transaction.type === 'income') {
      return t('transactions.income');
    } else if (transaction.type === 'expense') {
      return t('transactions.expense');
    } else {
      return t('transactions.transfer');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1A1A1A] border-none text-white">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl font-bold">
            {t('transactions.details') || "Transaction Details"}
          </DialogTitle>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="absolute right-14 top-6 rounded-full p-2 bg-[#242425] text-[#868686] hover:text-[#C6FE1E] transition-colors"
              aria-label={t('common.edit')}
            >
              <Pencil size={20} />
            </button>
          )}
        </DialogHeader>
        
        <div className="mt-4">
          {/* Amount */}
          {isEditing ? (
            <div className="mb-4">
              <Label htmlFor="amount" className="text-[#868686] mb-1 block">
                {t('transactions.amount')}
              </Label>
              <FormattedInput 
                id="amount"
                value={editedTransaction.amount?.toString() || ''}
                onChange={handleAmountChange}
                onValueChange={handleAmountValueChange}
                className="bg-[#242425] border-0 text-white"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#868686]">{t('transactions.amount')}</span>
              <span className={`text-xl font-bold ${transaction.type === 'expense' ? 'text-[#FF6B6B]' : 'text-[#C6FE1E]'}`}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          )}
          
          {/* Category */}
          {isEditing && transaction.type !== 'transfer' ? (
            <div className="mb-4">
              <Label htmlFor="category" className="text-[#868686] mb-1 block">
                {t('transactions.category')}
              </Label>
              <Select 
                value={String(editedTransaction.categoryId)} 
                onValueChange={(value) => handleChange('categoryId', value)}
              >
                <SelectTrigger className="bg-[#242425] border-0 text-white">
                  <SelectValue placeholder={t('transactions.selectCategory')} />
                </SelectTrigger>
                <SelectContent className="bg-[#242425] border-0 text-white max-h-[300px]">
                  {categories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={String(category.id)}
                      className="hover:bg-[#333] focus:bg-[#333]"
                    >
                      <div className="flex items-center">
                        <CategoryIcon category={String(category.id)} size="sm" />
                        <span className="ml-2">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#868686]">{t('transactions.category')}</span>
              <div className="flex items-center">
                <CategoryIcon category={transaction.categoryId} size="sm" />
                <span className="ml-2">{getDisplayCategoryName(transaction)}</span>
              </div>
            </div>
          )}
          
          {/* Wallet */}
          {isEditing ? (
            <div className="mb-4">
              <Label htmlFor="wallet" className="text-[#868686] mb-1 block">
                {t('transactions.wallet')}
              </Label>
              <Select 
                value={editedTransaction.walletId} 
                onValueChange={(value) => handleChange('walletId', value)}
              >
                <SelectTrigger className="bg-[#242425] border-0 text-white">
                  <SelectValue placeholder={t('transactions.selectWallet')} />
                </SelectTrigger>
                <SelectContent className="bg-[#242425] border-0 text-white">
                  {wallets.map((wallet) => (
                    <SelectItem 
                      key={wallet.id} 
                      value={wallet.id}
                      className="hover:bg-[#333] focus:bg-[#333]"
                    >
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#868686]">{t('transactions.wallet')}</span>
              <span>{getWalletName(transaction.walletId)}</span>
            </div>
          )}
          
          {/* Description */}
          {isEditing ? (
            <div className="mb-4">
              <Label htmlFor="description" className="text-[#868686] mb-1 block">
                {t('transactions.description')}
              </Label>
              <Input 
                id="description"
                value={editedTransaction.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="bg-[#242425] border-0 text-white"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#868686]">{t('transactions.description')}</span>
              <span>{transaction.description || '-'}</span>
            </div>
          )}
          
          {/* Time - Display Only (Not Editable) */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#868686]">Waktu</span>
            <span>{formatDate(transaction.date)}</span>
          </div>
          
          {/* Type - non-editable */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#868686]">{t('transactions.type')}</span>
            <div className="flex items-center">
              {getTypeIcon()}
              <span className="ml-2">{getTypeLabel()}</span>
            </div>
          </div>
          
          {/* Save button at the bottom for editing mode */}
          {isEditing && (
            <div className="mt-6">
              <Button 
                onClick={handleSave}
                className="w-full bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0"
              >
                {t('common.save')}
              </Button>
              <Button 
                onClick={handleCancelEdit}
                className="w-full mt-3 bg-[#242425] text-white hover:bg-[#333] border-0"
              >
                {t('common.cancel')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetail;