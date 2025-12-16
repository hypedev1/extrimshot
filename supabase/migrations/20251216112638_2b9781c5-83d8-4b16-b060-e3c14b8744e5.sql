-- Add notes column to orders table for admin internal notes
ALTER TABLE public.orders ADD COLUMN notes text;