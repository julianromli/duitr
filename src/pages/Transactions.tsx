import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/layout/Header';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionForm from '@/components/transactions/TransactionForm';
import ExportButton from '@/components/export/ExportButton';

const Transactions: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t('transactions.history')}</h2>
          <div className="flex gap-2">
            <ExportButton />
            <TransactionForm />
          </div>
        </div>
        
        <TransactionList />
      </div>
    </div>
  );
};

export default Transactions;
