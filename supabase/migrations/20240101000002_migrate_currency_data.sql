-- Data migration script for single-currency system
-- Intelligently detect and set currency for existing records

-- Migrate existing transaction data
-- Detect currency based on amount patterns (IDR typically has larger amounts)
WITH user_currency_detection AS (
  SELECT 
    user_id,
    CASE 
      WHEN AVG(amount) > 100000 THEN 'IDR'
      ELSE 'USD'
    END as detected_currency
  FROM transactions 
  WHERE amount > 0
  GROUP BY user_id
)
UPDATE transactions t
SET currency = ucd.detected_currency
FROM user_currency_detection ucd
WHERE t.user_id = ucd.user_id;

-- Handle transactions for users without transaction history
UPDATE transactions 
SET currency = 'IDR'
WHERE currency IS NULL OR currency = '';

-- Migrate wallet data based on user's detected currency
WITH wallet_currency_detection AS (
  SELECT 
    w.id,
    COALESCE(ucd.detected_currency, 'IDR') as wallet_currency
  FROM wallets w
  LEFT JOIN (
    SELECT 
      user_id,
      CASE 
        WHEN AVG(amount) > 100000 THEN 'IDR'
        ELSE 'USD'
      END as detected_currency
    FROM transactions 
    WHERE amount > 0
    GROUP BY user_id
  ) ucd ON w.user_id = ucd.user_id
)
UPDATE wallets w
SET currency = wcd.wallet_currency
FROM wallet_currency_detection wcd
WHERE w.id = wcd.id;

-- Migrate budget data based on user's detected currency
WITH budget_currency_detection AS (
  SELECT 
    b.id,
    COALESCE(ucd.detected_currency, 'IDR') as budget_currency
  FROM budgets b
  LEFT JOIN (
    SELECT 
      user_id,
      CASE 
        WHEN AVG(amount) > 100000 THEN 'IDR'
        ELSE 'USD'
      END as detected_currency
    FROM transactions 
    WHERE amount > 0
    GROUP BY user_id
  ) ucd ON b.user_id = ucd.user_id
)
UPDATE budgets b
SET currency = bcd.budget_currency
FROM budget_currency_detection bcd
WHERE b.id = bcd.id;

-- Set user currency preference in auth metadata based on detected currency
-- This will be handled by the application layer during user login
-- as we cannot directly update auth.users metadata from SQL

-- Verify migration results
-- Uncomment these queries to check the migration results:
-- SELECT currency, COUNT(*) FROM transactions GROUP BY currency;
-- SELECT currency, COUNT(*) FROM wallets GROUP BY currency;
-- SELECT currency, COUNT(*) FROM budgets GROUP BY currency;