-- Drop existing SELECT policies on profiles (they are RESTRICTIVE which causes the issue)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies (default behavior, at least one must pass)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can read own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());