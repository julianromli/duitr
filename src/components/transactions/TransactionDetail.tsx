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
  const { transactions, formatCurrency, wallets, updateTransaction } = useFinance();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Find the transaction
  const transaction = transactions.find(t => t.id === transactionId);
  
  // State for edited transaction
  const [editedTransaction, setEditedTransaction] = useState<any>(null);
  
  // Reset edited transaction when transaction changes or dialog opens/closes
  useEffect(() => {
    if (transaction) {
      setEditedTransaction({
        id: transaction.id,
        amount: transaction.amount,
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
  
  // Define categories based on transaction type
  const getCategories = () => {
    if (editedTransaction.type === 'income') {
      return [
        t('income.categories.salary') || 'Salary',
        t('income.categories.business') || 'Business',
        t('income.categories.investment') || 'Investment',
        t('income.categories.gift') || 'Gift',
        t('income.categories.freelance') || 'Freelance',
        t('income.categories.refund') || 'Refund',
        t('income.categories.bonus') || 'Bonus',
        t('income.categories.other') || 'Other'
      ];
    } else {
      return [
        t('budgets.categories.groceries') || 'Groceries',
        t('budgets.categories.dining') || 'Dining',
        t('budgets.categories.transportation') || 'Transportation',
        t('budgets.categories.utilities') || 'Utilities',
        t('budgets.categories.housing') || 'Housing',
        t('budgets.categories.entertainment') || 'Entertainment',
        t('budgets.categories.shopping') || 'Shopping',
        t('budgets.categories.healthcare') || 'Healthcare',
        t('budgets.categories.education') || 'Education',
        t('budgets.categories.personal_care') || 'Personal Care',
        t('budgets.categories.travel') || 'Travel',
        t('budgets.categories.gifts') || 'Gifts',
        t('budgets.categories.other') || 'Other',
        'Transfer'
      ];
    }
  };
  
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
  
  // Get the appropriate icon based on transaction type
  const getTransactionIcon = () => {
    if (transaction.type === 'income') {
      return <ArrowUp className="text-[#C6FE1E]" size={24} />;
    } else if (transaction.type === 'expense') {
      return <ArrowDown className="text-red-500" size={24} />;
    } else {
      // For any other type including 'transfer'
      return <ArrowLeftRight className="text-[#1364FF]" size={24} />;
    }
  };

  // Handle saving the edited transaction
  const handleSave = async () => {
    try {
      await updateTransaction(editedTransaction);
      
      toast({
        title: t('common.success'),
        description: t('transactions.update_success') || "Transaction updated successfully",
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: t('common.error') || "Error",
        description: t('transactions.update_error') || "Failed to update transaction",
        variant: "destructive"
      });
    }
  };

  // Handle changes to input fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedTransaction({
      ...editedTransaction,
      [name]: name === 'amount' ? parseFloat(value) : value
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setEditedTransaction({
      ...editedTransaction,
      [name]: value
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original transaction data
    if (transaction) {
      setEditedTransaction({
        id: transaction.id,
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        walletId: transaction.walletId
      });
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
        
        {!isEditing ? (
          // View mode
          <div className="space-y-6">
            {/* Main transaction info */}
            <div className="flex flex-col items-center justify-center pt-2 pb-6">
              <div className="mb-4 w-16 h-16 rounded-full bg-[#242425] flex items-center justify-center">
                <CategoryIcon category={transaction.category} size="lg" />
              </div>
              
              <h2 className="text-xl font-bold">{transaction.category}</h2>
              <p className="text-sm text-[#868686]">{transaction.description}</p>
              
              <div className="mt-4 flex items-center">
                {getTransactionIcon()}
                <span className={`text-3xl font-bold ml-2 ${
                  transaction.type === 'income' 
                    ? 'text-[#C6FE1E]' 
                    : transaction.type === 'expense' 
                      ? 'text-red-500' 
                      : 'text-[#1364FF]'
                }`}>
                  {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>
            
            {/* Details list */}
            <div className="bg-[#242425] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#868686]">
                  <Calendar size={16} />
                  <span>{t('transactions.date')}</span>
                </div>
                <span className="text-white">{formatDate(transaction.date)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#868686]">
                  <Tag size={16} />
                  <span>{t('transactions.category')}</span>
                </div>
                <span className="text-white">{transaction.category}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#868686]">
                  <FileText size={16} />
                  <span>{t('transactions.description')}</span>
                </div>
                <span className="text-white">{transaction.description}</span>
              </div>
            </div>
          </div>
        ) : (
          // Edit mode
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t('transactions.type')}</Label>
                <Select 
                  value={editedTransaction.type} 
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger className="bg-[#242425] border-none text-white">
                    <SelectValue placeholder={t('transactions.transaction_type')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242425] border-none text-white">
                    <SelectItem value="income">{t('transactions.income')}</SelectItem>
                    <SelectItem value="expense">{t('transactions.expense')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">{t('transactions.amount')}</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  className="bg-[#242425] border-none text-white"
                  value={editedTransaction.amount}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">{t('transactions.category')}</Label>
                <Select 
                  value={editedTransaction.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger className="bg-[#242425] border-none text-white">
                    <SelectValue placeholder={t('budgets.select_category')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242425] border-none text-white">
                    {getCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">{t('transactions.description')}</Label>
                <Input
                  id="description"
                  name="description"
                  className="bg-[#242425] border-none text-white"
                  value={editedTransaction.description}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">{t('transactions.date')}</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  className="bg-[#242425] border-none text-white"
                  value={formatDateForInput(editedTransaction.date)}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="walletId">{t('transactions.wallet')}</Label>
                <Select 
                  value={editedTransaction.walletId} 
                  onValueChange={(value) => handleSelectChange('walletId', value)}
                >
                  <SelectTrigger className="bg-[#242425] border-none text-white">
                    <SelectValue placeholder={t('wallets.select_wallet')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242425] border-none text-white">
                    {wallets.map(wallet => (
                      <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetail; 