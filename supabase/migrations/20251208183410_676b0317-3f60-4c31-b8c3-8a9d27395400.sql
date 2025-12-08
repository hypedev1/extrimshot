-- Create incomplete_orders table
CREATE TABLE public.incomplete_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  customer_name TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;

-- Anyone can create incomplete orders (from the public form)
CREATE POLICY "Anyone can create incomplete orders"
ON public.incomplete_orders
FOR INSERT
WITH CHECK (true);

-- Anyone can update incomplete orders (to add more info)
CREATE POLICY "Anyone can update incomplete orders"
ON public.incomplete_orders
FOR UPDATE
USING (true);

-- Anyone can delete incomplete orders (when order is completed)
CREATE POLICY "Anyone can delete incomplete orders"
ON public.incomplete_orders
FOR DELETE
USING (true);

-- Admins can view incomplete orders
CREATE POLICY "Admins can view incomplete orders"
ON public.incomplete_orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_incomplete_orders_updated_at
BEFORE UPDATE ON public.incomplete_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique index on phone to avoid duplicates
CREATE UNIQUE INDEX idx_incomplete_orders_phone ON public.incomplete_orders(phone);