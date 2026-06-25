import { createFileRoute, Navigate } from '@tanstack/react-router';
import { UNAUTHENTICATED_REDIRECT } from '@/config/auth-routes';
import { useAuth } from '@/context/AuthContext';
import NotFound from '@/pages/NotFound';

export const Route = createFileRoute('/$')({
  component: CatchAllRoute,
});

function CatchAllRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={UNAUTHENTICATED_REDIRECT} replace />;
  }

  return <NotFound />;
}
