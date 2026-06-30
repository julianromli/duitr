import { createFileRoute } from '@tanstack/react-router';
import TransactionDetailPage from '@/pages/TransactionDetailPage';

export const Route = createFileRoute('/app/transaction-detail')({
  component: TransactionDetailPage,
});
