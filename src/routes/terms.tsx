import { createFileRoute } from '@tanstack/react-router';
import TermsOfService from '@/pages/TermsOfService';
import { buildPageHead, termsSeo } from '@/lib/seo';

export const Route = createFileRoute('/terms')({
  head: () => buildPageHead(termsSeo),
  component: TermsOfService,
});
