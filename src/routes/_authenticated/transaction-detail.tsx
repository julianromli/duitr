import { createFileRoute } from '@tanstack/react-router';
import TransactionDetailPage from '@/pages/TransactionDetailPage';

export const Route = createFileRoute('/_authenticated/transaction-detail')({
  component: TransactionDetailPage,
});
