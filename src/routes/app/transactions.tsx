import { createFileRoute } from '@tanstack/react-router';
import Transactions from '@/pages/Transactions';

export const Route = createFileRoute('/app/transactions')({
  component: Transactions,
});
