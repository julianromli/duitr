-- Alter the 'date' column in the 'transactions' table
-- Change type from TEXT to TIMESTAMP WITH TIME ZONE
-- Convert existing 'YYYY-MM-DD' text data to timestamp at the start of the day UTC
ALTER TABLE public.transactions
ALTER COLUMN date TYPE TIMESTAMP WITH TIME ZONE
USING (date::timestamp AT TIME ZONE 'UTC');

-- Optional: Add a comment to the column for clarity
COMMENT ON COLUMN public.transactions.date IS 'The exact date and time (with timezone) the transaction occurred, stored in UTC.';
