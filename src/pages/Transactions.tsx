import React from 'react';
import { useTranslation } from 'react-i18next';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionForm from '@/components/transactions/TransactionForm';
import ExportButton from '@/components/export/ExportButton';
import { ArrowLeftRight } from 'lucide-react';

const Transactions: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col h-full min-h-screen bg-[#0D0D0D] text-white">
      <div className="p-6 pt-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('transactions.history')}</h1>
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
