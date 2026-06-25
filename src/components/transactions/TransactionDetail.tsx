import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import TransactionDetailOverlay from '@/components/transactions/TransactionDetailOverlay';

interface TransactionDetailProps {
  transactionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog-based transaction detail — resolves transaction by ID and delegates to the shared overlay UI.
 */
const TransactionDetail: React.FC<TransactionDetailProps> = ({
  transactionId,
  open,
  onOpenChange,
}) => {
  const { transactions } = useFinance();
  const transaction = transactionId
    ? transactions.find((item) => item.id === transactionId)
    : undefined;

  if (!transaction) {
    return null;
  }

  return (
    <TransactionDetailOverlay
      transaction={transaction}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
};

export default TransactionDetail;
