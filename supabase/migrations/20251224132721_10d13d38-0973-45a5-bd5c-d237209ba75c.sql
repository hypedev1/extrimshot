-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for incomplete_orders table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.incomplete_orders;