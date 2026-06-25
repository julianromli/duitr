import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';
import NotFound from '@/pages/NotFound';

export const Route = createFileRoute('/$')({
  component: CatchAllRoute,
});

function CatchAllRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  return <NotFound />;
}
