import { createFileRoute, redirect } from '@tanstack/react-router';
import { UNAUTHENTICATED_REDIRECT } from '@/config/auth-routes';
import { FinanceProvider } from '@/context/FinanceContext';
import { getSession } from '@/lib/supabase';
import { AuthenticatedChrome } from '@/components/app/AuthenticatedChrome';

export const Route = createFileRoute('/app')({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await getSession();
    if (error || !data.session?.user) {
      throw redirect({ to: UNAUTHENTICATED_REDIRECT });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <FinanceProvider>
      <AuthenticatedChrome />
    </FinanceProvider>
  );
}
