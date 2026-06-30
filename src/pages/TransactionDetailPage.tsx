import React from 'react';
import { Navigate, useRouter, useRouterState } from '@tanstack/react-router';
import TransactionDetailOverlay from '@/components/transactions/TransactionDetailOverlay';
import type { Transaction } from '@/types/finance';

const TransactionDetailPage: React.FC = () => {
  const router = useRouter();
  const state = useRouterState({
    select: (s) => s.location.state,
  }) as { transaction?: Transaction } | undefined;
  const transaction = state?.transaction;

  if (!transaction) {
    return <Navigate to="/app/transactions" replace />;
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.history.back();
    }
  };

  return (
    <TransactionDetailOverlay
      transaction={transaction}
      open
      onOpenChange={handleOpenChange}
    />
  );
};

export default TransactionDetailPage;
