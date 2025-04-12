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
import i18next from 'i18next';

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
          const fetchedCategories = await getLocalizedCategoriesByType(type, i18next);
          setCategories(fetchedCategories);
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
        date: transaction.date,
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
          date: transaction.date,
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
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
        date: transaction.date,
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
      date: editedTransaction.date,
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
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">
              {t('transactions.details') || "Transaction Details"}
            </DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="rounded-full p-2 bg-[#242425] text-[#C6FE1E] hover:text-white transition-colors"
                >
                  <Pencil size={16} />
                </button>
              ) : (
                <button 
                  onClick={handleSave} 
                  className="rounded-full p-2 bg-[#242425] text-[#C6FE1E] hover:text-white transition-colors"
                >
                  <Save size={16} />
                </button>
              )}
              <DialogClose 
                className="rounded-full p-2 bg-[#242425] text-[#868686] hover:text-white transition-colors"
                onClick={isEditing ? handleCancelEdit : undefined}
              >
                <X size={16} />
              </DialogClose>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {/* Amount */}
          {isEditing ? (
            <div className="mb-4">
              <Label htmlFor="amount" className="text-[#868686] mb-1 block">
                {t('transactions.amount')}
              </Label>
              <Input 
                id="amount"
                type="number"
                step="0.01"
                value={editedTransaction.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
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
                <SelectContent className="bg-[#242425] border-0 text-white">
                  {categories.map((category) => (
                    <SelectItem 
                      key={category.id} 
                      value={String(category.id)}
                      className="hover:bg-[#333] focus:bg-[#333]"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#868686]">{t('transactions.category')}</span>
              <div className="flex items-center">
                <CategoryIcon category={getDisplayCategoryName(transaction)} size="sm" />
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
          
          {/* Date */}
          {isEditing ? (
            <div className="mb-4">
              <Label htmlFor="date" className="text-[#868686] mb-1 block">
                {t('transactions.date')}
              </Label>
              <Input 
                id="date"
                type="date"
                value={formatDateForInput(editedTransaction.date)}
                onChange={(e) => handleChange('date', e.target.value)}
                className="bg-[#242425] border-0 text-white"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#868686]">{t('transactions.date')}</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
          )}
          
          {/* Type - non-editable */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#868686]">{t('transactions.type')}</span>
            <div className="flex items-center">
              {getTypeIcon()}
              <span className="ml-2">{getTypeLabel()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetail; 