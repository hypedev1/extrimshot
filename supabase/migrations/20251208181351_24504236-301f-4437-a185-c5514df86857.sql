-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create a PERMISSIVE policy (default is permissive, but being explicit)
CREATE POLICY "Anyone can create orders" 
ON public.orders 
AS PERMISSIVE
FOR INSERT 
TO public
WITH CHECK (true);