# Developer Guide - Duitr

Panduan lengkap untuk developer yang ingin berkontribusi atau memahami arsitektur aplikasi Duitr.

## 📋 Daftar Isi

1. [Arsitektur Aplikasi](#arsitektur-aplikasi)
2. [Setup Development](#setup-development)
3. [Struktur Kode](#struktur-kode)
4. [State Management](#state-management)
5. [Database Schema](#database-schema)
6. [API Integration](#api-integration)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Contributing](#contributing)

## 🏗️ Arsitektur Aplikasi

### Tech Stack Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
├─────────────────────────────────────────────────────────┤
│ • React 18 + TypeScript                                │
│ • Vite (Build Tool)                                    │
│ • Tailwind CSS + shadcn/ui                            │
│ • React Router (Routing)                               │
│ • React Query (Server State)                          │
│ • React Context (Client State)                        │
│ • React Hook Form + Zod (Forms & Validation)          │
│ • Framer Motion (Animations)                          │
│ • i18next (Internationalization)                      │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                Backend (Supabase)                      │
├─────────────────────────────────────────────────────────┤
│ • PostgreSQL Database                                  │
│ • Row Level Security (RLS)                            │
│ • Real-time Subscriptions                             │
│ • Authentication & Authorization                       │
│ • Edge Functions (Serverless)                         │
│ • Storage (File Upload)                               │
└─────────────────────────────────────────────────────────┘
```

### Application Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │    Business     │    │      Data       │
│     Layer       │    │     Logic       │    │     Layer       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Pages         │    │ • Contexts      │    │ • Supabase      │
│ • Components    │    │ • Hooks         │    │ • Services      │
│ • UI Components │    │ • Utils         │    │ • Types         │
│ • Layouts       │    │ • Validators    │    │ • Schemas       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Setup Development

### Prerequisites

- **Node.js** >= 18.0.0 or **Bun** >= 1.0.0
- **Bun** (recommended package manager)
- **Git**
- **Supabase Account**
- **Code Editor** (VS Code recommended)

### Environment Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd duitr
```

2. **Install Dependencies**
```bash
bun install
```

3. **Environment Variables**
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Settings
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

4. **Database Setup**
```bash
# Install Supabase CLI
bun install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

5. **Start Development Server**
```bash
bun dev
```

### VS Code Setup

Recommended extensions:
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## 📁 Struktur Kode

### Directory Structure

```
src/
├── components/              # React Components
│   ├── app/                # App-level components
│   │   ├── AppContent.tsx  # Main app wrapper
│   │   └── AppRoutes.tsx   # Route definitions
│   ├── auth/               # Authentication components
│   ├── budget/             # Budget-related components
│   ├── dashboard/          # Dashboard components
│   ├── layout/             # Layout components
│   ├── shared/             # Shared/common components
│   ├── transactions/       # Transaction components
│   ├── ui/                 # Base UI components (shadcn/ui)
│   └── wallets/            # Wallet components
├── context/                # React Context providers
│   ├── AuthContext.tsx    # Authentication state
│   ├── FinanceContext.tsx # Financial data state
│   ├── ThemeContext.tsx   # Theme management
│   └── TransitionContext.tsx # Page transitions
├── hooks/                  # Custom React hooks
│   ├── useBudgets.ts      # Budget operations
│   ├── useTransactions.ts # Transaction operations
│   └── useWallets.ts      # Wallet operations
├── lib/                    # Utilities and configurations
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # General utilities
├── pages/                  # Page components
├── services/               # API service layer
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

### Component Architecture

#### 1. Component Hierarchy
```
App
├── Providers (Auth, Theme, Query, etc.)
├── AppContent
│   ├── Header
│   ├── Main Content (Routes)
│   └── Navbar
└── Global Components (Toaster, etc.)
```

#### 2. Component Patterns

**Container/Presentational Pattern**
```tsx
// Container Component (Logic)
const TransactionContainer: React.FC = () => {
  const { transactions, loading } = useTransactions();
  const { addTransaction } = useFinanceContext();
  
  return (
    <TransactionList 
      transactions={transactions}
      loading={loading}
      onAdd={addTransaction}
    />
  );
};

// Presentational Component (UI)
interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onAdd: (transaction: Transaction) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  loading,
  onAdd
}) => {
  // Pure UI logic only
};
```

**Custom Hook Pattern**
```tsx
// Custom Hook
export const useTransactions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions
  });
  
  const addTransaction = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
    }
  });
  
  return {
    transactions: data || [],
    loading: isLoading,
    error,
    addTransaction: addTransaction.mutate
  };
};
```

## 🔄 State Management

### State Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Client State                          │
├─────────────────────────────────────────────────────────┤
│ React Context (Global UI State)                        │
│ • AuthContext (User authentication)                    │
│ • ThemeContext (UI theme)                             │
│ • TransitionContext (Page transitions)                │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                   Server State                          │
├─────────────────────────────────────────────────────────┤
│ React Query (Server Data Caching)                      │
│ • Transactions                                         │
│ • Wallets                                             │
│ • Budgets                                             │
│ • Categories                                          │
│ • User Profile                                        │
└─────────────────────────────────────────────────────────┘
```

### Context Providers

#### AuthContext
```tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Implementation...
  
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### FinanceContext
```tsx
interface FinanceContextType {
  wallets: Wallet[];
  categories: Category[];
  refreshData: () => void;
}

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Implementation using React Query
};
```

### React Query Setup

```tsx
// Query Client Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Query Keys
export const queryKeys = {
  transactions: ['transactions'] as const,
  wallets: ['wallets'] as const,
  budgets: ['budgets'] as const,
  categories: ['categories'] as const,
};
```

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    users    │     │   wallets   │     │ categories  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │────▶│ id (PK)     │     │ id (PK)     │
│ email       │     │ user_id(FK) │     │ name        │
│ created_at  │     │ name        │     │ type        │
│ updated_at  │     │ type        │     │ icon        │
└─────────────┘     │ balance     │     │ color       │
                    │ created_at  │     └─────────────┘
                    └─────────────┘            │
                           │                   │
                           ▼                   ▼
                    ┌─────────────────────────────────┐
                    │         transactions            │
                    ├─────────────────────────────────┤
                    │ id (PK)                        │
                    │ user_id (FK)                   │
                    │ wallet_id (FK)                 │
                    │ category_id (FK)               │
                    │ amount                         │
                    │ type (income/expense/transfer) │
                    │ description                    │
                    │ date                          │
                    │ created_at                    │
                    └─────────────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────┐
                    │           budgets               │
                    ├─────────────────────────────────┤
                    │ id (PK)                        │
                    │ user_id (FK)                   │
                    │ category_id (FK)               │
                    │ amount                         │
                    │ period                         │
                    │ created_at                     │
                    └─────────────────────────────────┘
```

### Table Definitions

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Wallets Table
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Categories Table
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  icon VARCHAR(50),
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description TEXT,
  date DATE NOT NULL,
  to_wallet_id UUID REFERENCES wallets(id), -- For transfers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own wallets" ON wallets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);
```

## 🔌 API Integration

### Supabase Client Setup

```tsx
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

### Service Layer

```tsx
// services/transactionService.ts
import { supabase } from '@/lib/supabase';
import type { Transaction, CreateTransactionData } from '@/types/finance';

export const transactionService = {
  async getAll(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        wallet:wallets(name, type),
        category:categories(name, icon, color)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  async create(transaction: CreateTransactionData): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
```

### React Query Integration

```tsx
// hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services/transactionService';
import { useAuth } from '@/context/AuthContext';

export const useTransactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const {
    data: transactions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => transactionService.getAll(user!.id),
    enabled: !!user?.id
  });
  
  const addTransaction = useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['wallets']);
    }
  });
  
  const updateTransaction = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Transaction>) =>
      transactionService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['wallets']);
    }
  });
  
  const deleteTransaction = useMutation({
    mutationFn: transactionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['wallets']);
    }
  });
  
  return {
    transactions,
    isLoading,
    error,
    addTransaction: addTransaction.mutate,
    updateTransaction: updateTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    isAdding: addTransaction.isPending,
    isUpdating: updateTransaction.isPending,
    isDeleting: deleteTransaction.isPending
  };
};
```

## 🧪 Testing

### Testing Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   Testing Pyramid                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           E2E Tests (Cypress/Playwright)               │
│                    ▲                                   │
│               Integration Tests                         │
│                    ▲                                   │
│                Unit Tests                              │
│              (Jest + RTL)                             │
└─────────────────────────────────────────────────────────┘
```

### Unit Testing Setup

```bash
# Install testing dependencies
bun add -d @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

```tsx
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### Component Testing

```tsx
// components/transactions/TransactionForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionForm } from './TransactionForm';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('TransactionForm', () => {
  it('should render form fields', () => {
    render(<TransactionForm />, { wrapper: createWrapper() });
    
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/wallet/i)).toBeInTheDocument();
  });
  
  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<TransactionForm onSubmit={onSubmit} />, { wrapper: createWrapper() });
    
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100000' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        amount: 100000,
        // ... other fields
      });
    });
  });
});
```

### Hook Testing

```tsx
// hooks/useTransactions.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTransactions } from './useTransactions';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTransactions', () => {
  it('should fetch transactions', async () => {
    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper()
    });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.transactions).toBeDefined();
  });
});
```

## 🚀 Deployment

### Build Process

```bash
# Development build
bun run build:dev

# Production build
bun run build

# PWA build with icons
bun run build:pwa
```

### Vercel Deployment

```json
// vercel.json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### Environment Variables

```bash
# Production Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run tests
        run: bun test
      
      - name: Build application
        run: bun run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🤝 Contributing

### Development Workflow

1. **Fork Repository**
2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make Changes**
4. **Write Tests**
5. **Run Tests**
   ```bash
   bun test
   bun run lint
   bun run type-check
   ```
6. **Commit Changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Create Pull Request**

### Commit Convention

Menggunakan [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(transactions): add transaction filtering
fix(auth): resolve login redirect issue
docs(readme): update installation guide
```

### Code Review Guidelines

1. **Code Quality**
   - Follow TypeScript best practices
   - Use consistent naming conventions
   - Write self-documenting code
   - Add comments for complex logic

2. **Performance**
   - Avoid unnecessary re-renders
   - Use React.memo for expensive components
   - Implement proper loading states
   - Optimize bundle size

3. **Accessibility**
   - Use semantic HTML
   - Add proper ARIA labels
   - Ensure keyboard navigation
   - Test with screen readers

4. **Testing**
   - Write unit tests for utilities
   - Test component behavior
   - Mock external dependencies
   - Achieve good test coverage

### Release Process

1. **Version Bump**
   ```bash
   bun version patch|minor|major
   ```

2. **Update Changelog**
   ```bash
   # Update CHANGELOG.md with new features and fixes
   ```

3. **Create Release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Deploy**
   ```bash
   # Automatic deployment via CI/CD
   ```

---

**Happy Coding!** 🚀

Jika ada pertanyaan atau butuh bantuan, jangan ragu untuk membuat issue atau menghubungi tim developer.