import { CANONICAL_SITE_URL } from '@/config/auth-routes';

export const DEFAULT_SITE_TITLE = 'Duitr - Smart Money, Smarter Future';

export const DEFAULT_SITE_DESCRIPTION =
  'Duitr - AI-powered personal finance manager. Track expenses, create budgets, set financial goals. Free expense tracking with multi-currency support.';

export const landingSeo = {
  title: DEFAULT_SITE_TITLE,
  description: DEFAULT_SITE_DESCRIPTION,
  canonical: `${CANONICAL_SITE_URL}/`,
  ogImage: `${CANONICAL_SITE_URL}/screenshots/duitr_thumbnail.jpg`,
} as const;

export const privacySeo = {
  title: 'Privacy Policy | Duitr',
  description: 'Learn how Duitr protects your personal and financial data.',
  canonical: `${CANONICAL_SITE_URL}/privacy`,
} as const;

export const termsSeo = {
  title: 'Terms of Service | Duitr',
  description: 'Terms and conditions for using the Duitr personal finance application.',
  canonical: `${CANONICAL_SITE_URL}/terms`,
} as const;

export function buildPageHead({
  title,
  description,
  canonical,
  ogImage,
}: {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
}) {
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { property: 'og:type', content: 'website' },
      ...(ogImage ? [{ property: 'og:image', content: ogImage }] : []),
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      ...(ogImage ? [{ name: 'twitter:image', content: ogImage }] : []),
    ],
    links: [{ rel: 'canonical', href: canonical }],
  };
}
