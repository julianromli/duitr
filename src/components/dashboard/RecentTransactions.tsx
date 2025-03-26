
import React from 'react';
import { Calendar, ShoppingCart, Coffee, Home, CreditCard, ReceiptText } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import DashboardCard from './DashboardCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const categoryIcons: Record<string, React.ReactNode> = {
  Groceries: <ShoppingCart className="w-3 h-3" />,
  Dining: <Coffee className="w-3 h-3" />,
  Rent: <Home className="w-3 h-3" />,
  Utilities: <CreditCard className="w-3 h-3" />,
  Salary: <ReceiptText className="w-3 h-3" />,
  Freelance: <ReceiptText className="w-3 h-3" />,
};

const RecentTransactions: React.FC = () => {
  const { transactions } = useFinance();
  const navigate = useNavigate();
  
  // Sort transactions by date (newest first) and take only 5
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <DashboardCard 
      title="Recent Transactions" 
      icon={<Calendar className="w-4 h-4" />} 
      contentClassName="px-0"
    >
      <ul className="divide-y">
        {recentTransactions.map((transaction) => (
          <li key={transaction.id} className="px-4 py-3 hover:bg-muted/30 transition-colors duration-200">
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
              <div className="text-right">
                <p className={`font-medium ${
                  transaction.type === 'income' ? 'text-finance-income' : 'text-finance-expense'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="px-4 py-3 border-t">
        <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/transactions')}>
          View All Transactions
        </Button>
      </div>
    </DashboardCard>
  );
};

export default RecentTransactions;
