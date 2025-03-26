import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ShoppingCart, Coffee, Home, CreditCard, ReceiptText, Trash2 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import DashboardCard from './DashboardCard';
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

const categoryIcons: Record<string, React.ReactNode> = {
  Groceries: <ShoppingCart className="w-3 h-3" />,
  Dining: <Coffee className="w-3 h-3" />,
  Rent: <Home className="w-3 h-3" />,
  Utilities: <CreditCard className="w-3 h-3" />,
  Salary: <ReceiptText className="w-3 h-3" />,
  Freelance: <ReceiptText className="w-3 h-3" />,
};

const RecentTransactions: React.FC = () => {
  const { t } = useTranslation();
  const { transactions, formatCurrency, deleteTransaction } = useFinance();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  // Sort transactions by date (newest first) and take only 5
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
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

  return (
    <>
      <DashboardCard 
        title={t('dashboard.recent_transactions')} 
        icon={<Calendar className="w-4 h-4" />} 
        contentClassName="px-0"
      >
        <ul className="divide-y">
          {recentTransactions.map((transaction) => (
            <li key={transaction.id} className="px-4 py-3 hover:bg-muted/30 transition-colors duration-200 group relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-finance-income/10 text-finance-income' : 'bg-finance-expense/10 text-finance-expense'
                  }`}>
                    {categoryIcons[transaction.category] || <ShoppingCart className="w-3 h-3" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.category}</p>
                    <p className="text-xs text-muted-foreground">{transaction.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'income' ? 'text-finance-income' : 'text-finance-expense'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteClick(transaction.id, e)}
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title={t('transactions.delete')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="px-4 py-3 border-t">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/transactions')}>
            {t('transactions.title')}
          </Button>
        </div>
      </DashboardCard>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('transactions.delete_confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              {t('buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RecentTransactions;
