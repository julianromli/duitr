# Duitr

Duitr is an open-source personal finance manager built with React, TypeScript, Vite, and Supabase. It helps users track transactions, manage wallets and budgets, review financial trends, and use the app as a Progressive Web App on desktop or mobile.

Live app: https://www.duitr.my.id

## Features

- Transaction tracking for income, expenses, and wallet transfers
- Wallet management with real-time balance updates
- Budget tracking, wishlist items, and loan management
- Dashboard analytics and charts
- English and Indonesian localization with i18next
- Theme switching and responsive UI
- PWA support with installable offline-capable experience
- Data export utilities

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui and Radix UI
- TanStack Query
- React Hook Form and Zod
- Supabase and PostgreSQL
- Vitest and Testing Library

## Quick Start

### Prerequisites

- Bun 1.x or newer
- A Supabase project

### Install

```bash
git clone https://github.com/julianromli/duitr.git
cd duitr
bun install
```

### Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase values.

Required variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Locally

```bash
bun dev
```

The app runs at `http://localhost:8080` by default.

## Scripts

```bash
bun dev
bun run lint
bun run test:run
bun run build
bun run preview
```

Additional scripts:

- `bun test` for watch mode
- `bun run test:coverage` for coverage
- `bun run build:pwa` for a production PWA build
- `bun run security:check` for dependency audit checks

## Database Setup

Duitr uses Supabase for authentication, storage, and PostgreSQL data.

Suggested local setup flow:

1. Create a Supabase project.
2. Apply SQL files from `supabase/migrations/` in order.
3. Review `supabase_schema.sql` for the current schema reference.
4. Start the app and sign in with a test account.

## Project Structure

```text
src/
├── components/
├── config/
├── context/
├── features/
├── hooks/
├── integrations/
├── lib/
├── locales/
├── pages/
├── services/
├── test/
├── tests/
├── types/
└── utils/
```

## Documentation

- `docs/DEVELOPER_GUIDE.md` for local development notes
- `docs/technical_overview.md` for architecture context
- `docs/API_DOCUMENTATION.md` for Supabase-facing details
- `AGENTS.md` and `CLAUDE.md` for AI-assisted development workflows

## Contributing

Contributions are welcome. Please read `CONTRIBUTING.md` before opening a pull request.

Before submitting changes, run:

```bash
bun run lint
bun run test:run
bun run build
```

## Security

Please read `SECURITY.md` for how to report vulnerabilities responsibly.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
