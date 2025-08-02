# Technology Stack Standards

## Core Technologies

### Frontend Framework
- **React 18+** - Modern functional components with hooks
- **TypeScript** - Strict type checking enabled
- **Vite** - Fast build tool and development server

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Consistent, accessible component library
- **Radix UI** - Primitive components for custom UI elements
- **Lucide React** - Icon library (preferred over custom SVGs)

### State Management
- **Zustand** - Lightweight state management
- **React Query** - Server state management and caching
- **React Context** - Component-level shared state

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - File storage

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting (if used)
- **TypeScript Compiler** - Type checking
- **Vite PWA Plugin** - Progressive Web App features

### Testing (Recommended)
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **@testing-library/jest-dom** - Custom matchers

### Internationalization
- **react-i18next** - Translation management
- **i18next** - Core internationalization framework

### Form Handling
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Utilities
- **clsx** - Conditional className utility
- **date-fns** - Date manipulation
- **Framer Motion** - Animation library

## Package Manager
- **npm** - Primary package manager
- **pnpm** - Alternative (if available, use first)

## Browser Support
- Modern browsers (ES2020+)
- Mobile-first responsive design
- PWA compatibility

## Environment Requirements
- **Node.js 18+**
- **TypeScript 5+**
- **React 18+**

## Deployment
- **Vercel** - Preferred hosting platform
- **Netlify** - Alternative hosting
- Static site generation compatible

## Development Workflow
1. Local development with Vite dev server
2. TypeScript compilation checking
3. ESLint code quality checks
4. Build optimization for production
5. PWA service worker generation