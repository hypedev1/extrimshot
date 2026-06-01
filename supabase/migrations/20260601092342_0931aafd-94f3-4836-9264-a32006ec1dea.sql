CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_orders_customer_name_trgm ON public.orders USING gin (lower(customer_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_phone_trgm ON public.orders USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_address_trgm ON public.orders USING gin (lower(address) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incomplete_orders_customer_name_trgm ON public.incomplete_orders USING gin (lower(customer_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_phone_trgm ON public.incomplete_orders USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_address_trgm ON public.incomplete_orders USING gin (lower(address) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_created_at ON public.incomplete_orders (created_at DESC);