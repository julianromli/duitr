# AGENTS.md

Agent guide for working in `duitr`.

## Scope

- Frontend app: React 19 + TypeScript + Vite + Tailwind CSS.
- Backend integration: Supabase.
- Package manager: Bun.
- Tests: Vitest + Testing Library + jsdom.

## Rule Files

- Existing root agent file was replaced with this shorter, repo-verified version.
- No `.cursorrules` file was found.
- No `.cursor/rules/` directory was found.
- No `.github/copilot-instructions.md` file was found.

## Core Commands

```bash
bun install
bun dev
bun run build
bun run preview
bun run lint
bun test
bun run test:run
bun run test:coverage
```

## Command Notes

- Dev server runs on `http://localhost:8080`.
- Preview server runs on port `4173`.
- `bun test` starts Vitest in watch mode.
- `bun run test:run` is the non-watch CI-style test command.
- `bun run build:pwa` performs a production build plus PWA asset generation and verification.

## Single-Test Commands

Run one test file:

```bash
bun run test:run -- src/tests/sanitize.test.ts
```

Run one test file in watch mode:

```bash
bun test -- src/test/transaction/TransactionForm.test.tsx
```

Run one named test inside a file:

```bash
bun run test:run -- src/test/transaction/TransactionForm.test.tsx -t "should render transaction form with all required fields"
```

Useful variations:

```bash
bun run test:run -- --coverage
bun run test:run -- --changed
bun run test:ui
```

## Lint Commands

Lint the repo:

```bash
bun run lint
```

Lint one file or folder:

```bash
bun run lint -- src/pages/ProfilePage.tsx
bun run lint -- src/components/transactions
```

## Security / Audit Commands

```bash
bun run security:audit
bun run security:check
bun run security:fix
```

## Verification Before Finishing Code Changes

For real code changes, run:

```bash
bun run lint
bun run test:run
bun run build
```

Also review the final diff before handing off.

## Project Structure

```text
src/
  components/   feature UI and shadcn/ui wrappers
  config/       routes and config
  context/      React context providers
  features/     isolated feature areas
  hooks/        reusable hooks
  integrations/ Supabase types/client
  lib/          shared utilities/config
  locales/      i18n JSON files
  pages/        route-level components
  services/     data/service layer
  test/         test utilities and many component tests
  tests/        additional test files
  types/        shared TS types
  utils/        pure helpers
```

## Source Of Truth Rules

- Use `@/` imports for everything under `src/`.
- Do not hardcode categories. Categories come from the database via `categoryService` and `useCategories`.
- Category IDs are numeric database IDs (`category_id`).
- Currency is display-only (`USD` / `IDR`); do not add conversion logic unless explicitly requested.
- All user-facing strings must go through i18next.

## Imports

- Prefer `@/` aliases over deep relative paths.
- Keep imports grouped logically: React/framework, third-party, then local `@/` imports.
- Use `import type` for type-only imports when practical.
- Follow the surrounding file's import ordering if it already has a clear pattern.

## Formatting

- No dedicated Prettier/Biome config was found.
- ESLint is present, but it is not a full formatting authority.
- Preserve the style already used in the file you edit.
- The codebase mixes semicolon/no-semicolon and quote styles; avoid drive-by reformatting.
- Keep diffs tight and local.
- Use `cn` from `@/lib/utils` for class merging.

## TypeScript

- Type all component props, hook params, and service inputs/outputs.
- Prefer explicit domain types from `src/types`.
- For forms, define a Zod schema and derive types with `z.infer<typeof schema>`.
- Guard nullable/optional values explicitly.
- Do not rely on the compiler alone: root TS config is strict-oriented, but `tsconfig.app.json` relaxes several checks.

## Naming

- Components/pages: `PascalCase`.
- Hooks: `camelCase` and must start with `use`.
- Utilities/functions/variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` for module-level constants.
- Types/interfaces: `PascalCase`.
- Match neighboring file naming before introducing a new pattern.

## React Conventions

- Prefer functional components.
- Keep state local unless it is shared.
- Use React Query for server-backed async state.
- Use Context for app-wide client state already modeled that way.
- Prefer composition over inheritance.
- Reuse existing components before adding new dependencies.

## UI Conventions

- Prefer existing shadcn/ui components first.
- Use Tailwind classes and theme tokens defined in `src/index.css` / `tailwind.config.ts`.
- Reuse existing design tokens such as `background`, `foreground`, `primary`, and `muted`.
- Keep accessibility intact: labels, roles, keyboard support, and focus states matter.
- Use `lucide-react` icons unless there is a strong repo-local reason not to.

## Forms And Validation

- Standard stack is React Hook Form + Zod.
- Validate user input before service calls.
- Show user-visible failures with toast/alert UI.
- Keep validation messages and labels translatable.

## i18n Rules

- Translation files are `src/locales/en.json` and `src/locales/id.json`.
- Use `useTranslation()` in components.
- Do not ship new hardcoded UI copy in JSX.
- If you add a new key, add it to both language files.

## Error Handling

- Handle Supabase responses by checking `error` explicitly.
- In services, throw clear `Error` objects with actionable messages.
- In UI code, catch failures and surface them via toast/alert/state.
- Logging with `console.error` is common in this repo; include enough context to debug.
- Do not silently swallow errors unless there is a deliberate fallback.

## Testing Conventions

- Test runner setup lives in `src/test/setup.ts`.
- Shared render helpers live in `src/test/test-utils.tsx`.
- Prefer behavior-focused tests using Testing Library queries.
- Prefer accessible selectors (`getByRole`, `getByLabelText`) before test IDs.
- Mock external boundaries, not internal implementation details, when possible.
- Coverage thresholds in `vitest.config.ts` are `70` for branches/functions/lines/statements.

## Supabase And Security

- Never commit `.env` or secrets.
- Expected env vars are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Assume RLS matters; do not bypass ownership/security assumptions in app logic.
- Sanitize or validate untrusted input before rendering or submission.

## When Adding Files

- Put files in the existing feature folder when possible.
- Prefer extending an existing service/hook/component over creating parallel abstractions.
- Keep new helpers small and specific.
- Add or update tests when behavior changes.

## Good Default Workflow

1. Read nearby files first.
2. Make the smallest correct change.
3. Keep user-facing text in i18n.
4. Run targeted tests first, then full verification.
5. Review the diff for accidental formatting churn.
