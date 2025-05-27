-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.quotation_statuses;
DROP TABLE IF EXISTS public.quotation_items;
DROP TABLE IF EXISTS public.quotations;

-- Drop the quotation_status enum type
DROP TYPE IF EXISTS quotation_status;

-- Drop related functions
DROP FUNCTION IF EXISTS create_quotation_version();
DROP FUNCTION IF EXISTS track_quotation_status();