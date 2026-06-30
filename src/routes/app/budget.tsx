import { createFileRoute } from '@tanstack/react-router';
import BudgetPage from '@/pages/BudgetPage';

export const Route = createFileRoute('/app/budget')({
  component: BudgetPage,
});
