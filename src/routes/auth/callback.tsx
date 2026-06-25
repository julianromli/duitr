import { createFileRoute } from '@tanstack/react-router';
import AuthCallback from '@/pages/auth/AuthCallback';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});
