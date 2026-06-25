import { createFileRoute, redirect } from '@tanstack/react-router';
import SupabaseTestPage from '@/pages/SupabaseTestPage';

export const Route = createFileRoute('/_authenticated/test-supabase')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/' });
    }
  },
  component: SupabaseTestPage,
});
