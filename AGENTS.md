# AGENTS.md

Primary documentation for AI agents working on Duitr - Personal Finance Management App.

## Quick Start

```bash
bun install                    # Install dependencies
bun dev                        # Start dev server (port 8080)
bun test                       # Run tests
bun run lint                   # Lint code
bun run build                  # Production build
bun run preview                # Preview build (port 4173)
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **UI Components**: shadcn/ui (primary source)
- **Backend**: Supabase (PostgreSQL + RLS)
- **State**: React Query + React Context
- **Forms**: React Hook Form + Zod
- **i18n**: i18next (English/Indonesian)
- **Currency**: Simple display-only preference system (USD/IDR)
- **Package Manager**: Bun

## Project Structure

```
src/
├── components/          # Feature-based components
│   ├── auth/           # Authentication
│   ├── budget/         # Budgeting
│   ├── currency/       # Currency handling
│   ├── dashboard/      # Dashboard widgets
│   ├── transactions/   # Transaction management
│   └── ui/             # shadcn/ui base components
├── hooks/              # Custom React hooks
├── lib/                # Utils & configs
├── locales/            # i18next translations
├── pages/              # Route pages
├── services/           # API services
└── types/              # TypeScript types
```

## Critical Rules

### 🎨 UI Component Selection (MANDATORY)
1. **ALWAYS check existing components first** - Use `list_items_in_registries` MCP tool
2. **Priority**: shadcn/ui > existing custom > third-party libraries
3. **Installation**: Use `get_add_command_for_items` MCP tool for shadcn components
4. **Exception**: Only use non-shadcn if user explicitly requests another source

### 🎯 Development Patterns
- **Imports**: Use `@/` path alias for all src imports
- **Types**: Strict TypeScript - all components must have typed props
- **i18n**: All user-facing text uses i18next keys (`t('key')`)
- **Forms**: React Hook Form + Zod validation for ALL forms
- **Styling**: Tailwind CSS with design tokens from `/app/globals.css`
- **Animations**: Framer Motion for transitions

### 🔒 Security
- All Supabase tables use Row Level Security (RLS)
- Environment variables in `.env` (see `.env.example`)
- Input validation with Zod on all forms
- Regular audits: `bun run security:check`

### ✅ Pre-Merge Verification
Before completing any task, ALWAYS verify:
```bash
bun run lint                   # Must pass
bun test                       # Must pass
bun run build                  # Must succeed
git diff                       # Review all changes
```

## Currency System (IMPORTANT)

### Overview
Duitr uses a **simplified display-only currency system**:
- User selects currency (USD/IDR) during onboarding
- All transactions recorded in selected currency
- **NO currency conversion** - it's just formatting preference
- Currency affects display format only:
  - USD: $1,234.56 (with decimals)
  - IDR: Rp 1.234.567 (no decimals)

### Key Points
- User currency stored in `auth.users.user_metadata.currency`
- Database uses single `amount` column (no conversion columns)
- Changing currency **DELETES ALL USER DATA** (requires confirmation)
- See `CURRENCY_REFACTOR_SUMMARY.md` for implementation details

### Currency Change Flow
1. User goes to Profile → Currency Settings
2. Clicks "Change Currency" button
3. Sees warning dialog about data deletion
4. Selects new currency (USD/IDR)
5. Types "DELETE" to confirm
6. All data deleted via `delete_all_user_data()` function
7. Currency updated in user metadata
8. User starts fresh with new currency

### Database Schema
```sql
-- Simple schema (no conversion columns)
transactions:
  - amount NUMERIC(20,2)  ✅ Only this!
  
-- NO MORE: original_amount, converted_amount, exchange_rate, etc.

-- User currency preference
auth.users.user_metadata:
  - currency: 'USD' | 'IDR'
```

## Common Workflows

### Adding shadcn Component
```bash
# 1. Check available components
# Use MCP: list_items_in_registries registries: ['@shadcn']

# 2. Get install command
# Use MCP: get_add_command_for_items items: ['@shadcn/button']

# 3. Install component
bunx shadcn@latest add button
```

### Database Changes
1. Create migration in `supabase/migrations/`
2. Apply migration to local Supabase
3. Test with Row Level Security policies
4. Update TypeScript types in `src/types/`

### Adding Translations
1. Add keys to `src/locales/en/translation.json`
2. Add keys to `src/locales/id/translation.json`
3. Use in components: `const { t } = useTranslation();`

### PWA Development
```bash
bun run build:pwa              # Build with PWA
bun run pwa:icons              # Generate icons
bun run pwa:verify             # Verify setup
```

## Component Best Practices

### Component Structure
```typescript
import { ComponentProps } from '@/types';
import { useTranslation } from 'react-i18next';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <h2>{t('my.title.key')}</h2>
      {/* Component content */}
    </div>
  );
}
```

### Styling Priorities
1. Use existing shadcn/ui component variants
2. Extend with `class-variance-authority` (cva)
3. Apply Tailwind for spacing/positioning only
4. Use CSS variables from theme (`--background`, `--foreground`, etc.)

### Form Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  field: z.string().min(1, 'Required'),
});

type FormData = z.infer<typeof schema>;

export function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  // Form implementation
}
```

## Testing Strategy

After implementing UI features, ALWAYS offer Playwright testing for:
- Component states (default, hover, active, disabled, error)
- Responsive breakpoints (mobile, tablet, desktop)
- Keyboard navigation and accessibility
- Cross-browser compatibility

## Documentation References

- **Comprehensive Guide**: See `CLAUDE.md` for detailed architecture
- **Technical Overview**: See `technical_overview.md` for system architecture
- **Developer Setup**: See `DEVELOPER_GUIDE.md` for environment setup
- **API Details**: See `API_DOCUMENTATION.md` for backend integration
- **Currency System**: See `CURRENCY_REFACTOR_SUMMARY.md` for currency implementation
- **README**: See `README.md` for project overview

## Key Files

- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind configuration
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `supabase_schema.sql` - Database schema reference

## Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Common Issues

- **PWA Cache**: Clear service workers in DevTools if blank page after deploy
- **Build Errors**: Delete `node_modules` and run `bun install`
- **Type Errors**: Ensure React/ReactDOM versions match in `package.json`

---

**Last Updated**: Keep this file updated with code changes during PRs.
