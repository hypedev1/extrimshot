-- Create table to store order fingerprints for fraud prevention
CREATE TABLE public.order_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  ip_address TEXT,
  phone TEXT NOT NULL,
  user_agent TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.order_fingerprints ENABLE ROW LEVEL SECURITY;

-- Anyone can insert fingerprints (needed for order submission)
CREATE POLICY "Anyone can create fingerprints" 
ON public.order_fingerprints 
FOR INSERT 
WITH CHECK (true);

-- Anyone can check fingerprints (needed for validation)
CREATE POLICY "Anyone can view fingerprints" 
ON public.order_fingerprints 
FOR SELECT 
USING (true);

-- Admins can delete old fingerprints
CREATE POLICY "Admins can delete fingerprints" 
ON public.order_fingerprints 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_order_fingerprints_fingerprint ON public.order_fingerprints(fingerprint);
CREATE INDEX idx_order_fingerprints_phone ON public.order_fingerprints(phone);
CREATE INDEX idx_order_fingerprints_ip ON public.order_fingerprints(ip_address);
CREATE INDEX idx_order_fingerprints_created ON public.order_fingerprints(created_at);