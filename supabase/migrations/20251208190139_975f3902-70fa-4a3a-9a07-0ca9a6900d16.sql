-- Add SELECT policy for incomplete_orders for anonymous users (needed for upsert with select)
CREATE POLICY "Anyone can view their incomplete orders" 
ON public.incomplete_orders 
FOR SELECT 
TO public
USING (true);

-- Also ensure orders table allows anonymous select after insert
CREATE POLICY "Anyone can view their own order after creation" 
ON public.orders 
FOR SELECT 
TO public
USING (true);