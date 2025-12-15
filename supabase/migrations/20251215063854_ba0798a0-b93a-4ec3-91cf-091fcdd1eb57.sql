-- Add package_type column to orders table
ALTER TABLE public.orders ADD COLUMN package_type text NOT NULL DEFAULT 'regular';

-- Add comment for clarity
COMMENT ON COLUMN public.orders.package_type IS 'Package type: regular (90g/15 days/1250tk) or permanent (180g/30 days/1950tk)';