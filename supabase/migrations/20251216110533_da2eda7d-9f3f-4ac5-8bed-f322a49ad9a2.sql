-- Add Pathao location and tracking columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS pathao_city_id INTEGER,
ADD COLUMN IF NOT EXISTS pathao_zone_id INTEGER,
ADD COLUMN IF NOT EXISTS pathao_area_id INTEGER,
ADD COLUMN IF NOT EXISTS pathao_consignment_id TEXT;

-- Create index for quick lookup of Pathao orders
CREATE INDEX IF NOT EXISTS idx_orders_pathao_consignment ON public.orders(pathao_consignment_id) WHERE pathao_consignment_id IS NOT NULL;