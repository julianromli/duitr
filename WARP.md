# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Duitr** is a modern personal finance management Progressive Web App (PWA) built with React 18, TypeScript, and Supabase. It features comprehensive transaction tracking, budget management, multi-wallet support, and AI-powered financial insights with full internationalization (Indonesian/English).

## Common Development Commands

### Development
```bash
npm run dev                    # Start dev server at http://localhost:8080
npm run build:dev             # Development build
npm run build                 # Production build
npm run build:pwa             # PWA build with icons generation
npm run preview               # Preview production build
```

### Testing
```bash
npm test                      # Run tests in watch mode
npm run test:run              # Run tests once
npm run test:coverage         # Run tests with coverage report
npm run test:ui               # Open Vitest UI
```

### Code Quality
```bash
npm run lint                  # ESLint check
```

### PWA & Assets
```bash
npm run pwa:icons             # Generate PWA icons
npm run pwa:verify            # Verify PWA configuration
```

### Deployment
```bash
npm run vercel:deploy         # Deploy to Vercel
```

### Testing Individual Components
```bash
# Run specific test files
npx vitest src/test/auth/AuthContext.test.tsx
npx vitest src/test/transaction/TransactionForm.test.tsx
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Authentication + Real-time)
- **State Management**: React Context + TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Internationalization**: i18next + react-i18next
- **Testing**: Vitest + Testing Library
- **PWA**: Vite PWA Plugin with Workbox

### Key Architectural Patterns

#### Provider Hierarchy
The app uses a layered provider approach:
```
QueryClientProvider → TooltipProvider → I18nextProvider → ErrorBoundary → ThemeProvider → AuthProvider → CurrencyOnboardingWrapper → BrowserRouter → TransitionProvider
```

#### AI-Powered Features
- **Add with AI**: Natural language transaction parsing via Gemini AI
- **Smart categorization**: Automatic transaction categorization based on description
- **Wallet selection**: Manual wallet selection with real-time balance display
- **Individual transaction management**: Delete parsed transactions before confirmation

#### Component Organization
- **Container/Presentational Pattern**: Logic containers separate from UI components
- **Custom Hooks**: Business logic abstracted into reusable hooks (`useTransactions`, `useBudgets`, etc.)
- **Context + React Query**: Client state (UI) vs Server state (data) separation

#### State Management Strategy
- **Client State**: React Context for authentication, theme, transitions
- **Server State**: TanStack Query for data fetching, caching, and synchronization
- **Form State**: React Hook Form with Zod schemas for validation

### Directory Structure Deep Dive

```
src/
├── components/
│   ├── app/                    # Core app wrapper components
│   ├── auth/                   # Authentication UI (login, signup, protected routes)
│   ├── budget/                 # Budget management (progress, lists, forms)
│   ├── currency/               # Currency selection and formatting
│   ├── dashboard/              # Dashboard widgets (charts, summaries, recent items)
│   ├── export/                 # Data export functionality
│   ├── layout/                 # App layout (header, navbar, page transitions)
│   ├── settings/               # Settings and preferences
│   ├── shared/                 # Reusable components (icons, error boundaries)
│   ├── transactions/           # Transaction CRUD + AI-powered features
│   │   ├── AIAddTransactionDialog.tsx  # AI chat interface for transaction parsing
│   │   └── AIFloatingButton.tsx       # Perfect circle floating action button
│   └── ui/                     # Base shadcn/ui components
├── context/                    # React Context providers
├── hooks/                      # Custom business logic hooks
├── lib/                        # Utilities and configurations (Supabase client)
├── locales/                    # i18n translation files
└── test/                       # Test utilities and mocks
```

## Database Architecture

### Core Entities
- **users**: User profiles and settings
- **wallets**: User wallets with different types (cash, bank, e-wallet)
- **categories**: Transaction categories with icons and colors
- **transactions**: Financial transactions (income/expense/transfer)
- **budgets**: Budget planning and tracking
- **want_to_buy**: Wishlist items
- **pinjaman**: Loan tracking

### Key Database Features
- **Row Level Security (RLS)**: All tables have user-specific access control
- **Real-time subscriptions**: Live data updates via Supabase
- **Foreign key relationships**: Normalized schema with proper referential integrity

## Development Patterns

### Custom Hooks Pattern
Business logic is encapsulated in custom hooks that combine React Query with Supabase:

```typescript
// Example: hooks/useTransactions.ts
export const useTransactions = () => {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => transactionService.getAll(user!.id)
  });
  
  const addTransaction = useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['wallets']); // Update balances
    }
  });
  
  return { transactions, isLoading, addTransaction: addTransaction.mutate };
};
```

### Component Architecture
Components follow a container/presentational pattern with proper TypeScript interfaces:

```typescript
// Container component handles logic
const TransactionContainer: React.FC = () => {
  const { transactions, addTransaction } = useTransactions();
  return <TransactionList transactions={transactions} onAdd={addTransaction} />;
};

// Presentational component handles UI
interface TransactionListProps {
  transactions: Transaction[];
  onAdd: (transaction: Transaction) => void;
}
```

### Form Validation Pattern
All forms use React Hook Form with Zod schemas:

```typescript
const transactionSchema = z.object({
  amount: z.number().min(1),
  category_id: z.number(),
  description: z.string().optional()
});

type TransactionFormData = z.infer<typeof transactionSchema>;
```

## Testing Strategy

### Test Setup
- **Framework**: Vitest with jsdom environment
- **Coverage**: 70% threshold for branches, functions, lines, statements
- **Mocks**: Comprehensive mocking for Supabase, React Router, Framer Motion, i18next

### Test Structure
```
src/test/
├── auth/                      # Authentication tests
├── transaction/               # Transaction component tests
├── setup.ts                   # Test configuration and global mocks
```

### Running Specific Tests
```bash
# Component tests
npm run test -- src/test/transaction/TransactionForm.test.tsx

# Authentication tests
npm run test -- src/test/auth/

# Coverage for specific directory
npm run test:coverage -- src/components/transactions/
```

## Environment Configuration

### Required Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Setup
1. Copy `.env.example` to `.env`
2. Configure Supabase credentials
3. Run database migrations from the `migrations/` directory
4. Start development server with `npm run dev`

## Internationalization (i18n)

### Language Support
- **Default**: Indonesian (id)
- **Secondary**: English (en)
- **Framework**: i18next with browser language detection

### Translation Organization
- Translations stored in `src/locales/`
- Keys organized by feature domains (landing, auth, dashboard, etc.)
- Dynamic loading with fallback mechanisms

## PWA Features

### Configuration
- **Service Worker**: Workbox-powered with caching strategies
- **Manifest**: Dynamic generation via scripts
- **Icons**: Auto-generated from source with `generate-pwa-icons.mjs`
- **Offline Support**: Network-first for API, cache-first for assets

### PWA Development
```bash
npm run pwa:icons              # Generate icons after logo changes
npm run pwa:verify             # Validate PWA configuration
npm run build:pwa              # Full PWA build with assets
```

## Build & Deployment

### Development Modes
- **Development**: HMR at localhost:8080
- **Production**: Optimized build with service worker
- **Preview**: Local production preview at localhost:4173

### Vercel Deployment
- Configured with `vercel.json`
- Environment variables managed in Vercel dashboard
- Automatic deployments on main branch pushes

## MCP Integration

### Available MCP Servers
- **context7**: Advanced context management (`@upstash/context7-mcp`)
- **shadcn-ui**: Component library integration (`@jpisnice/shadcn-ui-mcp-server`)
- **git-mcp-server**: AI-powered Git operations (`@cyanheads/git-mcp-server`)

### MCP Configuration
Configuration is stored in `.trae/mcp.json` and enables enhanced AI-powered development workflows.

## Recent Updates (Latest)

### AI-Powered Transaction Features ✨
- **Enhanced AI Dialog**: Complete wallet selection functionality with manual user control
- **Individual Transaction Management**: Users can delete specific parsed transactions before confirmation
- **Perfect Circle UI**: Fixed floating action button to be perfectly circular
- **Real-time Balance Display**: Wallet selector shows live balance information
- **Gemini AI Integration**: Natural language parsing via Supabase Edge Functions

### Key Components Updated
- `AIAddTransactionDialog.tsx`: Added delete buttons with Trash2 icons for individual transaction removal
- `AIFloatingButton.tsx`: Fixed button styling for perfect circle shape (`p-0 min-w-0 flex items-center justify-center`)
- Enhanced state management for parsed transactions with filter functionality

## Common Development Tasks

### Adding New Features
1. Create components in appropriate `src/components/` subdirectory
2. Add custom hooks in `src/hooks/` for business logic
3. Update database schema and migrations if needed
4. Add translations for new UI text
5. Write tests following existing patterns

### Database Changes
1. Create migration SQL files in `migrations/` directory
2. Apply migrations to Supabase project
3. Update TypeScript types if schema changes
4. Test RLS policies for new tables

### UI Component Development
1. Use existing shadcn/ui components as base
2. Follow Tailwind CSS conventions
3. Implement proper TypeScript interfaces
4. Add responsive design considerations
5. Test across different screen sizes

## Performance Considerations

### React Query Configuration
- Categories have 30-second stale time for freshness
- Other queries have 5-minute stale time
- Automatic query invalidation on mutations

### Bundle Optimization
- Dynamic imports for code splitting
- PWA caching strategies for assets
- Service worker optimization for offline support

### Database Optimization
- Proper indexing on frequently queried columns
- RLS policies optimized for performance
- Real-time subscriptions only where needed
