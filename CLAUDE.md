# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Duitr is a modern personal finance management application built with React 18, TypeScript, and Supabase. It features expense tracking, budget management, wallet transfers, AI-powered financial insights, and PWA capabilities with offline support.

## Development Commands

### Essential Commands
```bash
npm run dev          # Start development server (port 8080)
npm run build        # Production build
npm run build:pwa    # PWA build with icons and verification
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build (port 4173)
```

### Testing
```bash
npm test             # Run tests with Vitest
npm run test:run     # Run tests once (CI mode)
npm run test:coverage # Run tests with coverage
npm run test:watch   # Watch mode
npm run test:ui      # UI test runner
```

### Security
```bash
npm run security:audit   # Audit all dependencies
npm run security:check   # Audit with high severity threshold
npm run security:fix     # Attempt automatic fixes
```

### PWA & Deployment
```bash
npm run pwa:icons        # Generate PWA icons
npm run pwa:verify       # Verify PWA setup
npm run copy-pwa         # Copy PWA assets to dist
npm run vercel:deploy    # Deploy to Vercel
```

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL), Row Level Security
- **State Management**: React Query (TanStack Query), React Context
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: i18next with English/Indonesian support
- **PWA**: Vite PWA Plugin, Service Worker, offline support
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React for consistent iconography

### Project Structure
```
src/
├── components/          # React components organized by feature
│   ├── app/             # Core app components (AppRoutes, AppContent)
│   ├── auth/            # Authentication (Login, Signup, ProtectedRoute)
│   ├── budget/          # Budgeting (BudgetList, BudgetProgress, WantToBuy)
│   ├── currency/        # Currency handling (Input, Display, Selection)
│   ├── dashboard/       # Dashboard (BalanceSummary, SpendingChart, RecentTransactions)
│   ├── export/          # Data export functionality
│   ├── layout/          # Layout components (Navbar, Header, PageTransition)
│   ├── magicui/         # Magic UI components for enhanced visuals
│   ├── settings/        # Settings components
│   ├── shared/          # Shared components (Logo, ThemeToggle, LanguageSwitcher)
│   ├── test/            # Test components
│   ├── transactions/    # Transaction forms and lists
│   └── ui/              # Base UI components from shadcn/ui
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
├── locales/             # i18next translation files
├── pages/               # Page components
├── services/            # Service layer for API calls
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Database Schema (Supabase)
- **users** - User authentication and preferences
- **wallets** - User wallets with currency support
- **categories** - Transaction categories
- **transactions** - Financial transactions with multi-currency support
- **budgets** - User budgets and spending limits
- **want_to_buy** - Wishlist items
- **pinjaman** - Loan management
- **exchange_rates** - Currency conversion rates

### Key Patterns
- **Path Aliases**: Use `@/` for src imports (configured in tsconfig.json)
- **Component Organization**: Components grouped by feature, not type
- **Form Validation**: React Hook Form + Zod for all forms
- **Type Safety**: Strict TypeScript configuration enabled
- **Internationalization**: All user-facing text uses i18next keys
- **PWA**: Service worker caching with granular cache strategies
- **Animations**: Framer Motion for smooth UI transitions

## Development Guidelines

### Environment Setup
1. Copy `.env.example` to `.env`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Run database migrations from `supabase/migrations/`

### Component Development
- Use shadcn/ui components as base
- Implement proper TypeScript types
- Follow existing component patterns and naming conventions
- Use Tailwind CSS for styling with consistent design tokens
- Ensure all text is internationalized using i18next
- Use Framer Motion for animations when appropriate

### State Management
- Use React Query for server state and API calls
- Use React Context for client-side state
- Keep component state local when possible
- Use Zod schemas for data validation

### Security Considerations
- Row Level Security (RLS) enabled on all Supabase tables
- Environment variables for sensitive configuration
- Input validation on all forms
- TypeScript strict mode enabled
- Regular security audits with npm audit

### Testing
- Write tests for new components and utilities
- Use Vitest for unit testing
- Test both happy paths and error cases
- Maintain test coverage

### PWA Development
- PWA is disabled in development (devOptions.enabled: false)
- Use `npm run build:pwa` for production PWA builds
- Test offline functionality thoroughly
- Ensure all assets are properly cached

## Common Issues

### PWA Cache Problems
If experiencing blank pages after deployment:
1. Unregister service workers in DevTools
2. Clear site storage
3. Hard refresh (Ctrl+F5)

### Build Issues
- Validate production builds locally: `npm run build` then `npm run preview`
- For React context errors, ensure React/ReactDOM versions match
- Delete node_modules and reinstall if needed

### Development Server
- Development server runs on port 8080
- Preview server runs on port 4173
- Hot module replacement enabled with SWC

## AI Features

The application includes AI-powered financial insights using:
- Gemini Finance Insight Edge Function in Supabase
- AI evaluation of spending patterns
- Smart recommendations for financial management
- Financial health scoring

## Internationalization

Supports English and Indonesian languages:
- Translation files in `src/locales/`
- Use i18next keys for all user-facing text
- Language switcher component available
- Default language is Indonesian

## **🎨 Enhanced UI/Frontend Styling Rules**

### **1. Component Selection & Priority**
- **MUTLAK**: Selalu cek existing components di project dulu sebelum add yang baru
- **WAJIB**: Gunakan `list_items_in_registries` MCP tool untuk cek available shadcn components
- **PRIORITAS**: shadcn UI components > existing custom components > third-party libraries
- **INSTALASI**: Selalu use `get_add_command_for_items` MCP tool untuk install shadcn components
- **EXCEPTION**: Hanya boleh pakai non-shadcn components kalau user explicitly mention sumber lain

### **2. Styling & Customization Guidelines**
- **BASE STYLING**: Ikuti patterns dan variables di `/app/globals.css`
- **CUSTOM STYLING**: Extend shadcn components pakai `variants` dari `class-variance-authority` (cva)
- **TAILWIND**: Custom classes hanya untuk spacing, positioning, dan micro-adjustments
- **THEME CONSISTENCY**: Pastikan pakai CSS variables yang udah defined (`--background`, `--foreground`, dll)
- **NO INLINE STYLES**: Avoid inline styles, prefer Tailwind classes atau component variants

### **3. Accessibility & Responsiveness**
- **A11Y FIRST**: Pertahankan semua accessibility features bawaan shadcn components
- **MOBILE FIRST**: Always implement responsive design starting dari mobile
- **KEYBOARD NAV**: Ensure proper keyboard navigation di semua interactive components  
- **SCREEN READERS**: Maintain proper ARIA labels dan semantic HTML
- **FOCUS STATES**: Never remove focus indicators, enhance kalau perlu

### **4. Component Implementation Best Practices**
- **COMPOSITION**: Prefer component composition over inheritance
- **SINGLE RESPONSIBILITY**: Each component should have one clear purpose
- **REUSABILITY**: Build reusable component variations with proper props
- **TYPE SAFETY**: Always use TypeScript interfaces for component props
- **DEFAULT VALUES**: Provide sensible defaults for all optional props

### **5. User Experience & Visual Design**
- **GESTALT PRINCIPLES**: Apply proximity, similarity, alignment, dan visual hierarchy
- **CONSISTENCY**: Maintain consistent spacing (4px grid), typography scale, dan color usage
- **VISUAL FEEDBACK**: Provide clear loading states, hover effects, dan transitions
- **ERROR HANDLING**: Always implement proper error states dengan shadcn Alert/Toast components
- **PROGRESSIVE ENHANCEMENT**: Design works tanpa JavaScript, enhanced dengan JS

### **6. Performance & Optimization**
- **LAZY LOADING**: Use React.lazy untuk heavy components when appropriate
- **MEMO OPTIMIZATION**: Memoize expensive calculations dan component re-renders
- **BUNDLE SIZE**: Prefer tree-shakable imports dari shadcn
- **ANIMATION**: Use CSS transforms over changing layout properties
- **IMAGE OPTIMIZATION**: Always optimize images dan use proper aspect ratios

### **7. Testing & Quality Assurance**
- **COMPONENT TESTING**: After implementing new UI features, ALWAYS offer Playwright testing
- **VISUAL TESTING**: Test all component states (default, hover, active, disabled, error)
- **CROSS-BROWSER**: Ensure compatibility across modern browsers
- **RESPONSIVE TESTING**: Test all breakpoints (mobile, tablet, desktop)
- **ACCESSIBILITY TESTING**: Verify keyboard navigation dan screen reader compatibility

### **8. Documentation & Maintenance**
- **COMPONENT DOCS**: Document any custom component extensions
- **PROPS INTERFACE**: Clear TypeScript interfaces with JSDoc comments
- **USAGE EXAMPLES**: Provide usage examples for complex custom components
- **CHANGELOG**: Update component changes in project documentation
- **VERSION TRACKING**: Keep track of shadcn component versions being used

### **9. Development Workflow**
- **MCP INTEGRATION**: Always use MCP tools untuk component discovery dan installation
- **CODE REVIEW**: Self-check component implementation against these rules
- **ITERATION**: Build incrementally, test each component addition
- **ROLLBACK STRATEGY**: Keep component changes small dan easily reversible
- **DOCUMENTATION UPDATE**: Update AGENTS.md ketika add significant UI components