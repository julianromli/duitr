import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { invokeGeminiFinanceInsight } from '@/lib/ai/invokeGeminiFinanceInsight'

afterEach(() => {
  cleanup()
})

beforeAll(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key-for-testing')
  vi.stubEnv('VITE_NEON_AUTH_URL', 'http://localhost:54322/auth')
  vi.stubEnv('VITE_NEON_DATA_API_URL', 'http://localhost:54322/rest/v1')
  vi.stubEnv('VITE_DATABASE_PROVIDER', 'supabase')
  vi.stubEnv('VITE_PRODUCTION_DOMAIN', 'http://localhost:3000')
})

vi.mock('@/lib/ai/invokeGeminiFinanceInsight', () => ({
  invokeGeminiFinanceInsight: vi.fn(),
}))

export const getMockGeminiFinanceInsightInvoke = () => vi.mocked(invokeGeminiFinanceInsight)

vi.mock('@/lib/supabase', () => {
  const auth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    resend: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    setSession: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
  }

  const signInWithGoogle = vi.fn(async () => {
    const { data, error } = await auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/auth/callback' },
    });
    return { data, error, isWebViewBlocked: false };
  });

  const supabase = {
    auth: {
      ...auth
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn()
    })),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(),
        upload: vi.fn(),
        remove: vi.fn()
      }))
    }
  }

  return {
    supabase,
    getSession: auth.getSession,
    getCurrentUser: auth.getUser,
    signInWithGoogle,
    isIOS: vi.fn(() => false),
  }
})

/** @deprecated Use getMockGeminiFinanceInsightInvoke for AI calls */
export const getMockSupabaseFunctionInvoke = () => getMockGeminiFinanceInsightInvoke()

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useRouter: () => ({
      history: { back: vi.fn() },
    }),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    }),
    useRouterState: ({ select }: { select?: (state: { location: { pathname: string; state: unknown } }) => unknown }) => {
      const state = { location: { pathname: '/', state: null } }
      return select ? select(state) : state
    },
  }
})

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, prop) => prop,
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children
}))

vi.mock('i18next', () => ({
  default: {
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockReturnThis(),
    t: vi.fn((key: string) => key),
    changeLanguage: vi.fn(),
    language: 'en',
  },
  use: vi.fn().mockReturnThis(),
  init: vi.fn().mockReturnThis(),
  t: vi.fn((key: string) => key),
  changeLanguage: vi.fn(),
  language: 'en',
}))

vi.mock('i18next-browser-languagedetector', () => ({
  default: {
    type: 'languageDetector',
    init: vi.fn(),
    detect: vi.fn(() => 'en'),
    cacheUserLanguage: vi.fn(),
  },
}))

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, fallback?: string) => fallback || key,
      i18n: {
        language: 'en',
        changeLanguage: vi.fn()
      }
    }),
    Trans: ({ children }: { children: React.ReactNode }) => children,
    initReactI18next: {
      type: '3rdParty',
      init: vi.fn(),
    },
  }
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
  configurable: true,
  value: vi.fn(() => false),
})

Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
  configurable: true,
  value: vi.fn(),
})

Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
  configurable: true,
  value: vi.fn(),
})

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: vi.fn(),
})

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User'
  }
}

export const mockTransaction = {
  id: 'test-transaction-id',
  amount: 100000,
  description: 'Test transaction',
  type: 'expense' as const,
  categoryId: 'test-category-id',
  walletId: 'test-wallet-id',
  userId: 'test-user-id',
  date: '2024-01-01T00:00:00.000Z'
}

export const mockWallet = {
  id: 'test-wallet-id',
  name: 'Test Wallet',
  balance: 1000000,
  currency: 'IDR' as const,
  userId: 'test-user-id'
}

export const mockBudget = {
  id: 'test-budget-id',
  name: 'Test Budget',
  amount: 500000,
  spent: 100000,
  categoryId: 'test-category-id',
  userId: 'test-user-id',
  period: 'monthly' as const
}
