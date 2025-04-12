
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinance } from '@/context/FinanceContext';
import { useCategories } from '@/hooks/useCategories';
import { format } from 'date-fns';
import { Calendar, Search, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface TransactionListProps {
  onTransactionClick?: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ onTransactionClick }) => {
  const { transactions, wallets, formatCurrency } = useFinance();
  const { t, i18n } = useTranslation();
  const { categories, getCategoryName } = useCategories();
  const navigate = useNavigate();
  const currentLanguage = i18n.language;
  
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Apply filters
  useEffect(() => {
    let result = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(query) || 
        getCategoryName(t.category_id).toLowerCase().includes(query)
      );
    }
    
    setFilteredTransactions(result);
  }, [transactions, typeFilter, searchQuery, categories]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy');
  };
  
  const getWalletName = (id: string) => {
    const wallet = wallets.find(w => w.id === id);
    return wallet ? wallet.name : '';
  };
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'expense':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'transfer':
        return <Wallet className="w-5 h-5 text-blue-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Animation variants
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
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#868686] h-4 w-4" />
          <Input
            placeholder={t('transactions.search')}
            className="bg-[#242425] border-0 text-white pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
        >
          <SelectTrigger className="bg-[#242425] border-0 text-white">
            <SelectValue placeholder={t('transactions.all_types')} />
          </SelectTrigger>
          <SelectContent className="bg-[#242425] border-0 text-white">
            <SelectItem value="all" className="hover:bg-[#333] focus:bg-[#333]">
              {t('transactions.all_types')}
            </SelectItem>
            <SelectItem value="income" className="hover:bg-[#333] focus:bg-[#333]">
              {t('transactions.income')}
            </SelectItem>
            <SelectItem value="expense" className="hover:bg-[#333] focus:bg-[#333]">
              {t('transactions.expense')}
            </SelectItem>
            <SelectItem value="transfer" className="hover:bg-[#333] focus:bg-[#333]">
              {t('transactions.transfer')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Transactions List */}
      <motion.div 
        className="space-y-3"
        variants={listVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredTransactions.length === 0 && (
          <div className="bg-[#242425] rounded-lg p-4 text-center text-[#868686]">
            {t('transactions.no_transactions')}
          </div>
        )}
        
        {filteredTransactions.map((transaction) => (
          <motion.div 
            key={transaction.id}
            variants={itemVariants}
            className="bg-[#242425] rounded-lg p-4 flex items-center space-x-4 cursor-pointer hover:bg-[#2a2a2b] transition-colors"
            onClick={() => onTransactionClick && onTransactionClick(transaction.id)}
          >
            <div className="bg-[#1A1A1A] rounded-full p-2">
              {getTransactionIcon(transaction.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white text-sm font-medium truncate">
                    {getCategoryName(transaction.category_id)}
                  </h3>
                  <p className="text-[#868686] text-xs truncate">{transaction.description}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-green-500' : 
                    transaction.type === 'expense' ? 'text-red-500' : 'text-blue-500'
                  }`}>
                    {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-[#868686] text-xs">{getWalletName(transaction.walletId)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-[#868686] text-xs">{formatDate(transaction.date)}</p>
                {transaction.type === 'transfer' && transaction.destinationWalletId && (
                  <p className="text-[#868686] text-xs">
                    → {getWalletName(transaction.destinationWalletId)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default TransactionList;
