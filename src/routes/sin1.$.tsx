import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/sin1/$')({
  component: () => <Navigate to="/auth/callback" replace />,
});
