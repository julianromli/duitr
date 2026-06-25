import { createFileRoute } from '@tanstack/react-router';
import SupabaseTestPage from '@/pages/SupabaseTestPage';

export const Route = createFileRoute('/_authenticated/test-supabase')({
  component: SupabaseTestPage,
});
