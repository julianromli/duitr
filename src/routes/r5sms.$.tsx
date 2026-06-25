import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/r5sms/$')({
  component: () => <Navigate to="/auth/callback" replace />,
});
