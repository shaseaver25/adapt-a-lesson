-- Fix: Remove the overly permissive "Anyone can insert errors" policy
-- The table already has "Authenticated users can insert errors" policy which is more secure
DROP POLICY IF EXISTS "Anyone can insert errors" ON public.error_logs;