-- Create table for blocked order attempts
CREATE TABLE public.blocked_order_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  fingerprint TEXT,
  ip_address TEXT,
  block_reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_order_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert blocked attempts
CREATE POLICY "Anyone can create blocked attempts"
ON public.blocked_order_attempts
FOR INSERT
WITH CHECK (true);

-- Only admins can view blocked attempts
CREATE POLICY "Admins can view blocked attempts"
ON public.blocked_order_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete blocked attempts
CREATE POLICY "Admins can delete blocked attempts"
ON public.blocked_order_attempts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));