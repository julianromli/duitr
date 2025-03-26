
import React, { useState } from 'react';
import { Calendar, Filter, Search, ShoppingCart, Coffee, Home, CreditCard, ReceiptText } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const categoryIcons: Record<string, React.ReactNode> = {
  Groceries: <ShoppingCart className="w-4 h-4" />,
  Dining: <Coffee className="w-4 h-4" />,
  Rent: <Home className="w-4 h-4" />,
  Utilities: <CreditCard className="w-4 h-4" />,
  Salary: <ReceiptText className="w-4 h-4" />,
  Freelance: <ReceiptText className="w-4 h-4" />,
};

const TransactionList: React.FC = () => {
  const { transactions } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.category.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 self-end">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            All
          </Button>
          <Button
            variant={typeFilter === 'income' ? 'default' : 'outline'}
            size="sm"
            className={typeFilter === 'income' ? 'bg-finance-income hover:bg-finance-income/90' : ''}
            onClick={() => setTypeFilter('income')}
          >
            Income
          </Button>
          <Button
            variant={typeFilter === 'expense' ? 'default' : 'outline'}
            size="sm"
            className={typeFilter === 'expense' ? 'bg-finance-expense hover:bg-finance-expense/90' : ''}
            onClick={() => setTypeFilter('expense')}
          >
            Expenses
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <ul className="divide-y">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="p-4 hover:bg-muted/30 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-finance-income/10 text-finance-income' : 'bg-finance-expense/10 text-finance-expense'
                    }`}>
                      {categoryIcons[transaction.category] || <ShoppingCart className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.category}</p>
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'income' ? 'text-finance-income' : 'text-finance-expense'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
