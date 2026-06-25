import { createFileRoute } from '@tanstack/react-router';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import { buildPageHead, privacySeo } from '@/lib/seo';

export const Route = createFileRoute('/privacy')({
  head: () => buildPageHead(privacySeo),
  component: PrivacyPolicy,
});
