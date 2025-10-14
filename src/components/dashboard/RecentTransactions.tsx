import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Trash2 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import DashboardCard from './DashboardCard';
import CurrencyDisplay from '@/components/currency/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CategoryIcon from '@/components/shared/CategoryIcon';
import { motion } from 'framer-motion';
import TransactionDetailOverlay from '@/components/transactions/TransactionDetailOverlay';

const RecentTransactions: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transactions, formatCurrency, deleteTransaction, getDisplayCategoryName } = useFinance();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  // State for transaction detail overlay
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Sort transactions exactly like the "Newest" sort option in TransactionList
  // This prioritizes created_at timestamp over date for more accurate sorting
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      // Ensure we parse ISO dates correctly
      const dateA = a.date ? new Date(a.date.split('T')[0] + 'T12:00:00Z') : new Date(0);
      const dateB = b.date ? new Date(b.date.split('T')[0] + 'T12:00:00Z') : new Date(0);
      
      // Log the dates being compared for debugging
      console.log('Comparing transactions:', {
        transactionA: {
          id: a.id,
          description: a.description,
          rawDate: a.date,
          parsedDate: dateA.toISOString(),
        },
        transactionB: {
          id: b.id,
          description: b.description,
          rawDate: b.date,
          parsedDate: dateB.toISOString(),
        },
        result: dateB.getTime() - dateA.getTime()
      });

      // Sort by date (newest first)
      const dateComparison = dateB.getTime() - dateA.getTime();
      
      // If dates are the same, sort by amount as secondary criteria
      if (dateComparison === 0) {
        return b.amount - a.amount;
      }
      
      return dateComparison;
    })
    .slice(0, 10);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTransactionToDelete(id);
    setIsDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction(transactionToDelete);
      toast({
        title: t('common.success'),
        description: t('transactions.delete_success'),
      });
      setTransactionToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Handle transaction click to show detail overlay
  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };
  
  return (
    <>
      <DashboardCard
        title={t('dashboard.recent_transactions')}
        actionButton={
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[#C6FE1E] hover:text-white transition-colors"
            onClick={() => navigate('/transactions')}
          >
            {t('dashboard.view_all')}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        }
      >
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between cursor-pointer hover:bg-[#242425] p-2 rounded-lg transition-colors"
                onClick={() => handleTransactionClick(transaction)}
              >
                <div className="flex items-center">
                  <CategoryIcon category={transaction.categoryId || transaction.category} size="sm" />
                  <div className="ml-3">
                    <p className="font-medium">{getDisplayCategoryName(transaction)}</p>
                    <p className="text-xs text-[#868686]">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`mr-4 font-medium ${transaction.type === 'expense' ? 'text-[#FF6B6B]' : 'text-[#C6FE1E]'}`}>
                    <span>{transaction.type === 'expense' ? '-' : '+'}</span>
                    <CurrencyDisplay 
                      amount={transaction.amount}
                      className="inline"
                    />
                  </div>
                  <button 
                    onClick={(e) => handleDeleteClick(transaction.id, e)}
                    className="text-[#868686] hover:text-[#FF6B6B] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-[#868686]">
              {t('transactions.no_transactions')}
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-[#1A1A1A] border-0 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
              <AlertDialogDescription className="text-[#868686]">
                {t('transactions.delete_confirmation')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#242425] border-0 text-white hover:bg-[#333]">
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-[#FF6B6B] text-white hover:bg-red-400"
              >
                {t('transactions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardCard>
      
      {/* Transaction Detail Overlay */}
      {selectedTransaction && (
        <TransactionDetailOverlay
          transaction={selectedTransaction}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}
    </>
  );
};

export default RecentTransactions;
