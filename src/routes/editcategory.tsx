import { createFileRoute, redirect } from '@tanstack/react-router';
import { LEGACY_APP_REDIRECTS } from '@/config/route-paths';

export const Route = createFileRoute('/editcategory')({
  beforeLoad: () => {
    throw redirect({ to: LEGACY_APP_REDIRECTS['/editcategory'] });
  },
});
