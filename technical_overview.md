# Technical Overview - Duitr

Based on my analysis of the codebase, here's a comprehensive technical overview:

## Core Components

### Frontend Architecture
**Tech Stack**: React 18 + TypeScript with Vite, featuring strict type safety (null checks, no implicit any) and path alias `@/` for imports.

**Component Organization**:
- **App Layer** (`src/components/app/`): `AppContent` wrapper manages global UI (toasts, navbar, install banner), `AppRoutes` handles routing with lazy loading and online/offline detection
- **Feature Modules**: Organized by domain - auth, budget, currency, dashboard, transactions, wallets, settings - each with dedicated components and business logic
- **UI Foundation** (`src/components/ui/`): shadcn/ui Radix primitives with Tailwind + CVA variants
- **Layout Components**: Navbar with visibility hooks, PageTransition using Framer Motion
- **Shared Components**: ErrorBoundary, Logo, ThemeToggle, LanguageSwitcher, InstallAppBanner

**State Management**:
- **React Query (TanStack Query)**: Server state with optimized stale times (categories: 5min, transactions: 2min, budgets: 3min), retry logic that skips 4xx errors, conditional window refocus
- **Context Providers**: `AuthContext` (auth state + balance visibility), `FinanceContext` (transactions/budgets/wallets CRUD), `ThemeContext` (dark/light mode), `TransitionContext` (page animations)
- **Custom Hooks** (`src/hooks/`): `useCategories`, `useTransactions`, `useBudgets`, `useWallets`, `useCurrencyOnboarding`, `useNavbarVisibility`, `usePWA`

**Service Layer** (`src/services/`):
- `categoryService.ts`: Category CRUD with fallback to default categories if DB table missing, overloaded `getCategoryById` supporting both cached and DB lookups
- `aiTransactionService.ts`: AI-powered transaction suggestions
- `exportService.ts`: Excel export using ExcelJS

**Internationalization**:
- i18next with English/Indonesian support, browser language detection
- Translations in `src/locales/en.json` and `id.json`
- localStorage persistence, fallback to Indonesian
- Custom loading wrapper ensures translations ready before render

**PWA Setup**:
- Vite PWA Plugin with Workbox strategies
- Runtime caching: Google Fonts (CacheFirst, 365d), static assets (StaleWhileRevalidate, 30d), API calls (NetworkFirst, 7d)
- Service worker registration with `prompt` mode (skipWaiting: true, clientsClaim: false)
- Disabled in development to prevent HMR issues

### Backend Architecture
**Supabase (PostgreSQL + Auth)**:
- **Database Schema**: `wallets`, `transactions`, `budgets`, `categories`, `want_to_buy`, `pinjaman` (loans)
  - **Note**: Removed `exchange_rates` table (no longer needed after currency simplification)
  - Transactions table uses single `amount` column (removed: original_amount, converted_amount, exchange_rate, rate_timestamp)
- **Row Level Security (RLS)**: Policies enforce `auth.uid() = user_id` on all tables
- **Auth**: Email/password + Google OAuth with PKCE flow, custom storage layer for iOS Safari compatibility
- **Edge Functions**: `gemini-finance-insight` for AI-powered financial analysis
- **Custom Functions**: `delete_all_user_data(user_id)` for currency change (deletes all user data safely)

**Data Types** (`src/types/`):
- Transaction: id, amount, categoryId, date, type (income/expense/transfer), walletId, destinationWalletId?, fee?
- Wallet: id, name, balance, type (cash/bank/e-wallet/investment), color
- Budget: id, amount, categoryId, month, year
- PinjamanItem, WantToBuyItem for loans and wishlists

**Currency System** (Simplified Display-Only):
- User selects currency (USD/IDR) during onboarding
- Currency stored in `auth.users.user_metadata.currency`
- All amounts displayed using user's preferred currency format
- **NO currency conversion** - just formatting preference
- USD format: $1,234.56 (with decimals)
- IDR format: Rp 1.234.567 (no decimals)
- Currency utilities in `src/utils/currency.ts`: `formatCurrency()`, `parseCurrency()`, `getCurrencySymbol()`
- Currency change requires data reset (all transactions/budgets/wallets deleted)

## Component Interactions

**Data Flow Pattern**:
1. **Authentication Flow**: main.tsx → App.tsx → AuthProvider → AuthContext initializes via `supabase.auth.getSession()` → `onAuthStateChange` listener maintains state
2. **Route Protection**: AppRoutes checks `user` from AuthContext → unauthenticated: public routes only → authenticated: FinanceProvider wraps protected routes
3. **Data Fetching**: Components use custom hooks (e.g., `useCategories`) → hooks call service functions → services query Supabase → React Query caches results → components render from cache
4. **Mutations**: Component calls context method (e.g., `addTransaction`) → FinanceContext updates Supabase → invalidates React Query cache → refetch triggers UI update

**Communication Methods**:
- **React Context**: Global state propagation (auth, theme, transitions)
- **React Query**: Async data synchronization with automatic caching/revalidation
- **Supabase Realtime**: Auth state changes via `onAuthStateChange`
- **Custom Events**: Online/offline detection using window event listeners

**Key APIs**:
- **Supabase Client** (`src/lib/supabase.ts`): createClient with custom storage wrapper, iOS-specific handling (debug mode, x-client-info header), PKCE auth flow
- **Category Utilities** (`src/utils/categoryUtils.ts`): Legacy name-to-ID mapping, UUID/string ID conversion, default categories
- **Currency Utilities** (`src/utils/currency.ts`): Multi-currency formatting with IDR/USD/EUR support

**Design Patterns**:
- **Provider Pattern**: All contexts use React Context API
- **Custom Hook Pattern**: Business logic encapsulated in hooks
- **Service Layer Pattern**: Data access abstracted from components
- **Repository Pattern**: Service functions abstract Supabase queries
- **Lazy Loading**: Routes lazy-loaded with React.lazy + Suspense

## Deployment Architecture

**Build Process**:
```bash
# Development: Vite dev server (port 8080), HMR with SWC
bun dev

# Production: Standard build
bun run build  # vite build

# PWA build: Build + icon generation + verification
bun run build:pwa  # vite build + pwa:icons + pwa:verify + copy-pwa
```

**Build Outputs**:
- `dist/`: Production assets (JS, CSS, HTML)
- `dist/sw.js`: Service worker (only in production builds)
- `dist/pwa-icons/`: PWA icons (generated by sharp)
- Bundle analysis available via webpack-bundle-analyzer

**Environment Configuration**:
- `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Environment prefix: `VITE_` for client-side access
- Validation: App fails fast if env vars missing

**External Dependencies**:
- **Supabase Backend**: PostgreSQL + Auth + Edge Functions + Storage
- **Google Fonts**: Space Grotesk (loaded via @fontsource)
- **Lucide React**: Icon library (460+ icons)
- **Recharts**: Data visualization

**Deployment Platform: Vercel**
- **Configuration** (`vercel.json`):
  - Content Security Policy headers with unsafe-inline/eval for Vite
  - Service Worker support with `Service-Worker-Allowed: /`
  - SPA fallback: all routes rewrite to `/index.html`
  - Cache control: `s-maxage=0` for edge caching
- **Build Command**: `bun run build` or `bun run build:pwa`
- **Environment**: Production domain `https://duitr.my.id`

**Database Migrations**:
- Stored in `supabase/migrations/`
- Applied via Supabase CLI or dashboard
- Initial schema in `supabase_schema.sql`

**Progressive Web App**:
- Manifest generation (icons, theme colors, display: standalone)
- Service worker with granular caching strategies
- Offline fallback page for network errors
- Install banner for iOS/Android prompts

## Runtime Behavior

**Application Initialization**:
1. **DOM Ready** (`main.tsx`): DOMContentLoaded listener ensures safe mount
2. **Provider Stack Setup** (`App.tsx`):
   - QueryClientProvider (React Query config)
   - TooltipProvider (shadcn UI)
   - I18nextProvider (translations)
   - AppWrapper waits for i18n readiness (10s timeout fallback)
   - ErrorBoundary catches render errors
   - ThemeProvider (light/dark mode)
   - AuthProvider (session check)
   - CurrencyOnboardingWrapper (first-time currency setup)
   - BrowserRouter + TransitionProvider (routing + animations)
3. **Auth Initialization**: AuthContext calls `getSession()` → sets user state → loads user settings (balance visibility, language preference)
4. **Data Loading**: FinanceContext fetches transactions/budgets/wallets when user authenticated

**Request/Response Flow**:
- **Transactions List**: Component → `useTransactions()` hook → React Query checks cache → if stale, service function queries Supabase → transforms data → updates cache → component renders
- **Create Transaction**: Form submission → `addTransaction()` context method → validates data → Supabase insert → invalidates React Query cache → triggers refetch → UI updates
- **AI Insights**: Button click → `aiTransactionService` → calls Supabase Edge Function (gemini-finance-insight) → receives analysis → displays in dialog

**Business Workflows**:
1. **User Signup**: Form → AuthContext.signUp → Supabase auth.signUp with email redirect → verification email sent
2. **Google OAuth**: Button → signInWithGoogle → clears old session data → generates PKCE verifier → redirects to Google → callback to `/auth/callback` → session established
3. **Wallet Transfer**: Transfer form → creates 2 transactions (expense from source, income to destination) → updates both wallet balances → single atomic operation
4. **Budget Tracking**: FinanceContext calculates spent amount by filtering transactions by category → compares to budget limit → renders progress bar
5. **Currency Display**: User sets preferred currency in onboarding → stored in user metadata → all amounts formatted per currency → NO conversion (display-only preference)
6. **Currency Change**: User clicks "Change Currency" in settings → warning dialog shows → types "DELETE" to confirm → `delete_all_user_data()` function called → all data deleted → currency updated → user starts fresh

**Error Handling**:
- **ErrorBoundary**: Catches React render errors, displays fallback UI, logs to console (can extend to error tracking service)
- **Service Layer**: Try-catch blocks, fallback to default data (e.g., categories table missing → use hardcoded defaults)
- **React Query**: Retry logic with exponential backoff (max 2 retries), skips 4xx errors
- **Toast Notifications**: User-facing errors displayed via sonner/shadcn toast
- **Auth Errors**: iOS-specific handling with custom storage wrapper, logging via `auth-logger`

**Background Tasks**:
- **Service Worker**: Background sync for offline actions, cache updates
- **Auth Token Refresh**: Supabase auto-refreshes tokens via `autoRefreshToken: true`
- **React Query**: Background refetching based on staleTime config
- **Online/Offline Detection**: Event listeners update UI state, redirect to offline page

**Performance Optimizations**:
- **Code Splitting**: Route-based lazy loading with React.lazy
- **Memo Hooks**: useCallback/useMemo for expensive computations (e.g., `loadUserSettings`)
- **Query Caching**: Aggressive stale times reduce redundant API calls
- **Conditional Refetch**: Production-only window focus refetch
- **SWC Compiler**: Fast refresh and optimized builds

## Summary

This architecture follows a modern React SPA pattern with server-side data persistence, offline-first PWA capabilities, and strict security boundaries via RLS policies. The codebase emphasizes type safety, accessibility (Radix primitives), and developer experience (hot reload, comprehensive tooling).

**Recent Major Changes:**
- **Currency System Refactor (Jan 2025)**: Simplified from complex multi-currency exchange system to display-only preference system. Removed 9 unnecessary database columns, deleted exchange_rates table, reduced code by 70%. See `CURRENCY_REFACTOR_SUMMARY.md` for details.
