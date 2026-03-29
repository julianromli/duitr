# Contributing to Duitr

## Development Setup

```bash
bun install
bun dev
```

Copy `.env.example` to `.env` and provide your Supabase credentials before running the app.

## Before Opening a Pull Request

Run the project checks locally:

```bash
bun run lint
bun run test:run
bun run build
```

## Pull Request Guidelines

- Keep changes focused and scoped to one concern.
- Update documentation when setup, behavior, or developer workflow changes.
- Add or update tests when fixing bugs or changing logic.
- Do not commit secrets, local environment files, or generated artifacts.

## Project Conventions

- Use `@/` imports for files under `src/`.
- Use TypeScript types for component props and service interfaces.
- Use i18next keys for user-facing strings.
- Prefer existing shadcn/ui components before introducing new UI dependencies.
- Use React Hook Form and Zod for form validation.

## Reporting Bugs

If you found a bug, open a GitHub issue with:

- Expected behavior
- Actual behavior
- Steps to reproduce
- Screenshots or logs when relevant

For security issues, use the process in `SECURITY.md` instead of opening a public issue.
