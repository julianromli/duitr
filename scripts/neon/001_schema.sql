-- Duitr public schema for Neon (FKs -> neon_auth."user")
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE SEQUENCE IF NOT EXISTS public.categories_category_id_seq;

CREATE TABLE IF NOT EXISTS public.categories (
  category_id integer PRIMARY KEY DEFAULT nextval('public.categories_category_id_seq'),
  category_key text NOT NULL UNIQUE,
  en_name text NOT NULL,
  id_name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['expense'::text, 'income'::text, 'system'::text])),
  created_at timestamptz DEFAULT now(),
  icon text,
  user_id uuid REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  color text DEFAULT '#6B7280'::text
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  name text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  type text NOT NULL,
  color text NOT NULL,
  base_currency varchar(3) NOT NULL DEFAULT 'IDR' CHECK (base_currency::text = ANY (ARRAY['IDR'::text, 'USD'::text]))
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  description text,
  date text NOT NULL,
  type text NOT NULL,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id integer REFERENCES public.categories(category_id) ON DELETE RESTRICT,
  original_amount numeric NOT NULL,
  original_currency varchar(3) NOT NULL DEFAULT 'IDR' CHECK (original_currency::text = ANY (ARRAY['IDR'::text, 'USD'::text])),
  converted_amount numeric NOT NULL,
  converted_currency varchar(3) NOT NULL DEFAULT 'IDR' CHECK (converted_currency::text = ANY (ARRAY['IDR'::text, 'USD'::text])),
  exchange_rate numeric DEFAULT 1.0 CHECK (exchange_rate > 0::numeric),
  rate_timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  category_id integer REFERENCES public.categories(category_id),
  amount numeric NOT NULL,
  spent numeric NOT NULL DEFAULT 0,
  period text DEFAULT 'monthly'::text,
  created_at timestamptz DEFAULT now(),
  currency varchar(3) NOT NULL DEFAULT 'IDR' CHECK (currency::text = ANY (ARRAY['IDR'::text, 'USD'::text]))
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency varchar(3) NOT NULL,
  target_currency varchar(3) NOT NULL,
  rate numeric NOT NULL,
  rate_date date NOT NULL,
  source varchar(50) NOT NULL DEFAULT 'exchangerate-api'::varchar,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pinjaman_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  category text NOT NULL CHECK (category = ANY (ARRAY['Utang'::text, 'Piutang'::text])),
  due_date date NOT NULL,
  amount numeric NOT NULL,
  is_settled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.want_to_buy_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  price numeric NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['Keinginan'::text, 'Kebutuhan'::text])),
  estimated_date date NOT NULL,
  priority text NOT NULL CHECK (priority = ANY (ARRAY['Tinggi'::text, 'Sedang'::text, 'Rendah'::text])),
  is_purchased boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS public.budget_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  category_id integer REFERENCES public.categories(category_id) ON DELETE CASCADE,
  prediction_date date NOT NULL DEFAULT CURRENT_DATE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  current_spend numeric NOT NULL CHECK (current_spend >= 0::numeric),
  budget_limit numeric NOT NULL CHECK (budget_limit > 0::numeric),
  projected_spend numeric NOT NULL CHECK (projected_spend >= 0::numeric),
  overrun_amount numeric NOT NULL DEFAULT 0,
  risk_level text NOT NULL CHECK (risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])),
  confidence numeric CHECK (confidence >= 0::numeric AND confidence <= 1::numeric),
  days_remaining integer,
  recommended_daily_limit numeric CHECK (recommended_daily_limit >= 0::numeric),
  insight text,
  seasonal_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  preferred_currency text NOT NULL DEFAULT 'IDR',
  is_balance_hidden boolean NOT NULL DEFAULT false,
  raw_metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories (type);
CREATE INDEX IF NOT EXISTS idx_categories_type_user ON public.categories (type, user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories (user_id, type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_per_user ON public.categories (category_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS wallets_user_id_idx ON public.wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON public.wallets (user_id, base_currency);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_wallet_id_idx ON public.transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date);
CREATE INDEX IF NOT EXISTS idx_transactions_description_trgm ON public.transactions USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_transactions_rate_timestamp ON public.transactions (rate_timestamp);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions (user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_currency ON public.transactions (user_id, original_currency);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_created ON public.transactions (user_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_created ON public.transactions (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON public.budgets (user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON public.budgets (category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_currency ON public.budgets (user_id, currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_base ON public.exchange_rates (base_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON public.exchange_rates (rate_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rates_unique ON public.exchange_rates (base_currency, target_currency, rate_date);
CREATE INDEX IF NOT EXISTS idx_pinjaman_items_user_id ON public.pinjaman_items (user_id);
CREATE INDEX IF NOT EXISTS idx_want_to_buy_items_user_id ON public.want_to_buy_items (user_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_endpoint ON public.notification_subscriptions (endpoint);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_inactive ON public.notification_subscriptions (updated_at) WHERE is_active = false;
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_active ON public.notification_subscriptions (user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.budget_predictions (created_at);
CREATE INDEX IF NOT EXISTS idx_predictions_period ON public.budget_predictions (user_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_risk ON public.budget_predictions (user_id, risk_level) WHERE risk_level = ANY (ARRAY['medium'::text, 'high'::text]);
CREATE INDEX IF NOT EXISTS idx_predictions_user_category_date ON public.budget_predictions (user_id, category_id, prediction_date DESC);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinjaman_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.want_to_buy_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
