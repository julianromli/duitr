import { createFileRoute } from '@tanstack/react-router';
import LandingPage from '@/pages/LandingPage';
import { buildPageHead, landingSeo } from '@/lib/seo';

export const Route = createFileRoute('/landing')({
  head: () => buildPageHead(landingSeo),
  component: LandingPage,
});
