-- Duitr public schema migration for Neon (adapted from Supabase)
-- FK targets: neon_auth."user"(id) instead of auth.users(id)
-- Skips legacy tables: categories_backup, categories_duplicate, category_id_mapping

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SEQUENCE IF NOT EXISTS categories_category_id_seq;

CREATE TABLE IF NOT EXISTS public.categories (
  category_id integer NOT NULL DEFAULT nextval('categories_category_id_seq'::regclass),
  category_key text NOT NULL UNIQUE,
  en_name text NOT NULL,
  id_name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['expense'::text, 'income'::text, 'system'::text])),
  created_at timestamptz DEFAULT now(),
  icon text,
  user_id uuid REFERENCES neon_auth."user"(id),
  color text DEFAULT '#6B7280'::text,
  PRIMARY KEY (category_id)
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  name text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  type text NOT NULL,
  color text NOT NULL,
  base_currency varchar NOT NULL DEFAULT 'IDR'::character varying CHECK (base_currency::text = ANY (ARRAY['IDR'::character varying::text, 'USD'::character varying::text])),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  category_id integer REFERENCES public.categories(category_id),
  amount numeric NOT NULL,
  spent numeric NOT NULL DEFAULT 0,
  period text DEFAULT 'monthly'::text,
  created_at timestamptz DEFAULT now(),
  currency varchar NOT NULL DEFAULT 'IDR'::character varying CHECK (currency::text = ANY (ARRAY['IDR'::character varying::text, 'USD'::character varying::text])),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  amount numeric NOT NULL,
  description text,
  date text NOT NULL,
  type text NOT NULL,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id),
  category_id integer REFERENCES public.categories(category_id),
  original_amount numeric NOT NULL,
  original_currency varchar NOT NULL DEFAULT 'IDR'::character varying CHECK (original_currency::text = ANY (ARRAY['IDR'::character varying::text, 'USD'::character varying::text])),
  converted_amount numeric NOT NULL,
  converted_currency varchar NOT NULL DEFAULT 'IDR'::character varying CHECK (converted_currency::text = ANY (ARRAY['IDR'::character varying::text, 'USD'::character varying::text])),
  exchange_rate numeric DEFAULT 1.0 CHECK (exchange_rate > 0::numeric),
  rate_timestamp timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  base_currency varchar NOT NULL,
  target_currency varchar NOT NULL,
  rate numeric NOT NULL,
  rate_date date NOT NULL,
  source varchar NOT NULL DEFAULT 'exchangerate-api'::character varying,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pinjaman_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  name text NOT NULL,
  icon text,
  category text NOT NULL CHECK (category = ANY (ARRAY['Utang'::text, 'Piutang'::text])),
  due_date date NOT NULL,
  amount numeric NOT NULL,
  is_settled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.want_to_buy_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  name text NOT NULL,
  icon text,
  price numeric NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['Keinginan'::text, 'Kebutuhan'::text])),
  estimated_date date NOT NULL,
  priority text NOT NULL CHECK (priority = ANY (ARRAY['Tinggi'::text, 'Sedang'::text, 'Rendah'::text])),
  is_purchased boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.budget_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES neon_auth."user"(id),
  category_id integer REFERENCES public.categories(category_id),
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
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- User metadata for preferred_currency (was in auth.users.raw_user_meta_data)
CREATE TABLE IF NOT EXISTS public.user_metadata (
  user_id uuid PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  preferred_currency text NOT NULL DEFAULT 'IDR',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
