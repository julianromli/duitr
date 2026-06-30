import { createFileRoute, redirect } from '@tanstack/react-router';
import { APP_HOME } from '@/config/route-paths';
import SupabaseTestPage from '@/pages/SupabaseTestPage';

export const Route = createFileRoute('/app/test-supabase')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: APP_HOME });
    }
  },
  component: SupabaseTestPage,
});
