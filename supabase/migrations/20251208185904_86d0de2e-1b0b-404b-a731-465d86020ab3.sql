-- Drop existing restrictive policies for orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create permissive policy for public order creation
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
TO public
WITH CHECK (true);

-- Drop existing restrictive policies for incomplete_orders
DROP POLICY IF EXISTS "Anyone can create incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anyone can update incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anyone can delete incomplete orders" ON public.incomplete_orders;

-- Create permissive policies for incomplete_orders
CREATE POLICY "Anyone can create incomplete orders" 
ON public.incomplete_orders 
FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can update incomplete orders" 
ON public.incomplete_orders 
FOR UPDATE 
TO public
USING (true);

CREATE POLICY "Anyone can delete incomplete orders" 
ON public.incomplete_orders 
FOR DELETE 
TO public
USING (true);