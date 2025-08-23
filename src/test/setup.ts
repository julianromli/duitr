import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup()
})

// Mock environment variables for tests
beforeAll(() => {
  // Set up test environment variables
  vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'mock-anon-key-for-testing')
  vi.stubEnv('VITE_PRODUCTION_DOMAIN', 'http://localhost:3000')
})

// Mock Supabase client for tests
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn()
    })),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(),
        upload: vi.fn(),
        remove: vi.fn()
      }))
    }
  },
  isIOS: vi.fn(() => false)
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null
    })
  }
})

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    form: 'form',
    section: 'section'
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children
}))

// Mock i18next
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

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Global test utilities
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