-- Add serial_number column
ALTER TABLE public.incomplete_orders ADD COLUMN serial_number bigint;

-- Backfill existing rows oldest first
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.incomplete_orders
)
UPDATE public.incomplete_orders i
SET serial_number = o.rn
FROM ordered o
WHERE i.id = o.id;

-- Create sequence starting after max
DO $$
DECLARE
  max_sn bigint;
BEGIN
  SELECT COALESCE(MAX(serial_number), 0) INTO max_sn FROM public.incomplete_orders;
  EXECUTE 'CREATE SEQUENCE IF NOT EXISTS public.incomplete_orders_serial_number_seq START WITH ' || (max_sn + 1);
END $$;

ALTER TABLE public.incomplete_orders
  ALTER COLUMN serial_number SET DEFAULT nextval('public.incomplete_orders_serial_number_seq'),
  ALTER COLUMN serial_number SET NOT NULL;

ALTER SEQUENCE public.incomplete_orders_serial_number_seq OWNED BY public.incomplete_orders.serial_number;

CREATE UNIQUE INDEX IF NOT EXISTS incomplete_orders_serial_number_key ON public.incomplete_orders(serial_number);
