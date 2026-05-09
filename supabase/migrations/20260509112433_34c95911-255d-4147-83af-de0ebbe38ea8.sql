ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS serial_number BIGINT;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM public.orders
)
UPDATE public.orders o
SET serial_number = ordered.rn
FROM ordered
WHERE o.id = ordered.id AND o.serial_number IS NULL;

CREATE SEQUENCE IF NOT EXISTS public.orders_serial_number_seq;
SELECT setval('public.orders_serial_number_seq', GREATEST(COALESCE((SELECT MAX(serial_number) FROM public.orders), 0), 1), true);

ALTER TABLE public.orders ALTER COLUMN serial_number SET DEFAULT nextval('public.orders_serial_number_seq');
ALTER SEQUENCE public.orders_serial_number_seq OWNED BY public.orders.serial_number;
ALTER TABLE public.orders ALTER COLUMN serial_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_serial_number_idx ON public.orders(serial_number);