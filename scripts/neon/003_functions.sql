-- Functions adapted for Neon Auth

CREATE OR REPLACE FUNCTION public.get_user_currency(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT preferred_currency FROM public.user_profiles WHERE user_id = user_uuid),
        'IDR'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_all_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be NULL';
  END IF;

  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'You can only delete your own data';
  END IF;

  DELETE FROM public.transactions WHERE user_id = p_user_id;
  DELETE FROM public.budgets WHERE user_id = p_user_id;
  DELETE FROM public.wallets WHERE user_id = p_user_id;
  DELETE FROM public.want_to_buy_items WHERE user_id = p_user_id;
  DELETE FROM public.pinjaman_items WHERE user_id = p_user_id;
  DELETE FROM public.categories WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_transfer_transaction(transaction_id uuid, source_wallet_id uuid, destination_wallet_id uuid, transfer_amount integer)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.wallets SET balance = balance + transfer_amount WHERE id = source_wallet_id;
  UPDATE public.wallets SET balance = balance - transfer_amount WHERE id = destination_wallet_id;
  DELETE FROM public.transactions WHERE id = transaction_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction or wallet not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_default_category_for_budget()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.category_id IS NULL THEN
        NEW.category_id := (SELECT category_id FROM public.categories WHERE category_key = 'expense_other');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_default_category_for_transaction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.category_id IS NULL THEN
        IF NEW.type = 'expense' THEN
            NEW.category_id := (SELECT category_id FROM public.categories WHERE category_key = 'expense_other');
        ELSIF NEW.type = 'income' THEN
            NEW.category_id := (SELECT category_id FROM public.categories WHERE category_key = 'income_other');
        ELSIF NEW.type = 'transfer' THEN
            NEW.category_id := (SELECT category_id FROM public.categories WHERE category_key = 'system_transfer');
        ELSE
            NEW.category_id := (SELECT category_id FROM public.categories WHERE category_key = 'expense_other');
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_budget_category_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    other_expense_id INTEGER;
BEGIN
    SELECT category_id INTO other_expense_id FROM public.categories WHERE category_key = 'expense_other' LIMIT 1;
    IF NEW.category_id IS NULL THEN
        NEW.category_id := other_expense_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE category_id = NEW.category_id) THEN
        NEW.category_id := other_expense_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_inactive_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notification_subscriptions
  WHERE is_active = false AND updated_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_predictions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.budget_predictions WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_subscriptions(p_user_id uuid)
RETURNS TABLE(id uuid, endpoint text, p256dh_key text, auth_key text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT ns.id, ns.endpoint, ns.p256dh_key, ns.auth_key, ns.created_at
  FROM public.notification_subscriptions ns
  WHERE ns.user_id = p_user_id AND ns.is_active = true
  ORDER BY ns.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_prediction_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_subscription_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_all_user_data(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_all_user_data(uuid) FROM anon;

DROP TRIGGER IF EXISTS set_default_category_budget ON public.budgets;
CREATE TRIGGER set_default_category_budget BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_default_category_for_budget();

DROP TRIGGER IF EXISTS set_default_category_transaction ON public.transactions;
CREATE TRIGGER set_default_category_transaction BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_default_category_for_transaction();

DROP TRIGGER IF EXISTS update_prediction_timestamp ON public.budget_predictions;
CREATE TRIGGER update_prediction_timestamp BEFORE UPDATE ON public.budget_predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_prediction_timestamp();

DROP TRIGGER IF EXISTS update_subscription_timestamp ON public.notification_subscriptions;
CREATE TRIGGER update_subscription_timestamp BEFORE UPDATE ON public.notification_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_timestamp();
