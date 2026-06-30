/** Where unauthenticated users are sent when accessing protected routes */
export const UNAUTHENTICATED_REDIRECT = '/' as const;

/** Production site URL (Cloudflare Workers custom domain) */
export const PRODUCTION_SITE_URL = 'https://duitr.faizintifada.com' as const;

/** Canonical URL for SEO meta tags */
export const CANONICAL_SITE_URL = PRODUCTION_SITE_URL;

/** OAuth / email verification callback URL */
export function getAuthCallbackUrl(): string {
  if (import.meta.env.MODE === 'production') {
    const domain = import.meta.env.VITE_PRODUCTION_DOMAIN || PRODUCTION_SITE_URL;
    return `${domain.replace(/\/$/, '')}/auth/callback`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return `${PRODUCTION_SITE_URL}/auth/callback`;
}
