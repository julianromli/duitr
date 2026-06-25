import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  return <Outlet />;
}
