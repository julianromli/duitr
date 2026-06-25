import { createFileRoute } from '@tanstack/react-router';
import Statistics from '@/pages/Statistics';

export const Route = createFileRoute('/_authenticated/statistics')({
  component: Statistics,
});
