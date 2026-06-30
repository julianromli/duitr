import { createFileRoute, redirect } from '@tanstack/react-router';
import { PUBLIC_HOME } from '@/config/route-paths';

export const Route = createFileRoute('/landing')({
  beforeLoad: () => {
    throw redirect({ to: PUBLIC_HOME });
  },
});
