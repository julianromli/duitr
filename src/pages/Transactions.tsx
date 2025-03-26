
import React from 'react';
import Header from '@/components/layout/Header';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionForm from '@/components/transactions/TransactionForm';

const Transactions: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-in">
      <Header />
      <div className="flex-1 p-6 pb-24 md:pb-6 space-y-6 overflow-auto fade-mask">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Transactions History</h2>
          <TransactionForm />
        </div>
        
        <TransactionList />
      </div>
    </div>
  );
};

export default Transactions;
