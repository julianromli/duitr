-- Fix RLS Security Issues
-- Enable Row Level Security on tables that currently have RLS disabled
-- and add appropriate policies to restrict access to authenticated users

-- Enable RLS on categories_backup table
ALTER TABLE public.categories_backup ENABLE ROW LEVEL SECURITY;

-- Enable RLS on category_id_mapping table
ALTER TABLE public.category_id_mapping ENABLE ROW LEVEL SECURITY;

-- Enable RLS on categories_duplicate table
ALTER TABLE public.categories_duplicate ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for categories_backup table
-- Allow authenticated users to read all records (since this is a backup table)
CREATE POLICY "Allow authenticated users to read categories_backup" ON public.categories_backup
    FOR SELECT
    TO authenticated
    USING (true);

-- Restrict insert/update/delete to service role only for backup table
CREATE POLICY "Restrict write access to service role for categories_backup" ON public.categories_backup
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add RLS policies for category_id_mapping table
-- Allow authenticated users to read mapping data
CREATE POLICY "Allow authenticated users to read category_id_mapping" ON public.category_id_mapping
    FOR SELECT
    TO authenticated
    USING (true);

-- Restrict write access to service role only for mapping table
CREATE POLICY "Restrict write access to service role for category_id_mapping" ON public.category_id_mapping
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add RLS policies for categories_duplicate table
-- Allow authenticated users to read duplicate categories
CREATE POLICY "Allow authenticated users to read categories_duplicate" ON public.categories_duplicate
    FOR SELECT
    TO authenticated
    USING (true);

-- Restrict write access to service role only for duplicate table
CREATE POLICY "Restrict write access to service role for categories_duplicate" ON public.categories_duplicate
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.categories_backup IS 'Backup table for categories with RLS enabled - read access for authenticated users, write access restricted to service role';
COMMENT ON TABLE public.category_id_mapping IS 'Category ID mapping table with RLS enabled - read access for authenticated users, write access restricted to service role';
COMMENT ON TABLE public.categories_duplicate IS 'Duplicate categories table with RLS enabled - read access for authenticated users, write access restricted to service role';