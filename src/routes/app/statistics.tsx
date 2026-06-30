import { createFileRoute } from '@tanstack/react-router';
import Statistics from '@/pages/Statistics';

export const Route = createFileRoute('/app/statistics')({
  component: Statistics,
});
