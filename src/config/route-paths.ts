export const PUBLIC_HOME = '/' as const;
export const APP_HOME = '/app' as const;

export const mainPages = [
  APP_HOME,
  '/app/transactions',
  '/app/wallets',
  '/app/budget',
  '/app/profile',
  '/app/statistics',
] as const;

/** Legacy root paths redirected to /app/* */
export const LEGACY_APP_REDIRECTS = {
  '/transactions': '/app/transactions',
  '/wallets': '/app/wallets',
  '/budget': '/app/budget',
  '/profile': '/app/profile',
  '/statistics': '/app/statistics',
  '/editcategory': '/app/editcategory',
  '/transaction-detail': '/app/transaction-detail',
  '/test-supabase': '/app/test-supabase',
  '/test-login-button': '/app/test-login-button',
  '/test-datepicker': '/app/test-datepicker',
} as const;
