-- Create subscription overrides table for manual access grants
CREATE TABLE public.subscription_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  override_type TEXT NOT NULL CHECK (override_type IN ('permanent', 'trial')),
  trial_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscription_overrides ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage overrides
CREATE POLICY "Admins can view all overrides"
ON public.subscription_overrides
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert overrides"
ON public.subscription_overrides
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update overrides"
ON public.subscription_overrides
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete overrides"
ON public.subscription_overrides
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Users can view their own override
CREATE POLICY "Users can view own override"
ON public.subscription_overrides
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Grant permanent access to Shannon and Jena
INSERT INTO public.subscription_overrides (user_id, override_type, notes)
VALUES 
  ('0ea0e50c-db26-49a0-bf59-89a296e8a30c', 'permanent', 'Owner - Shannon Seaver'),
  ('79ad5e06-0572-4812-8f14-e445b9f8a696', 'permanent', 'Co-founder - Jena Zangs');

-- Grant 7-day trial to all other users
INSERT INTO public.subscription_overrides (user_id, override_type, trial_end_date, notes)
SELECT 
  id, 
  'trial', 
  now() + INTERVAL '7 days',
  'Initial trial grant'
FROM profiles 
WHERE id NOT IN (
  '0ea0e50c-db26-49a0-bf59-89a296e8a30c',
  '79ad5e06-0572-4812-8f14-e445b9f8a696'
);