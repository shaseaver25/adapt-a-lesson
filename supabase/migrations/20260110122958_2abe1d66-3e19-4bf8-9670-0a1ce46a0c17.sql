-- Add new profile fields for registration
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS organization_type text CHECK (organization_type IN ('school', 'non_profit', 'home_school', 'other'));

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, provider, company, organization_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'organization_type'
  );
  RETURN NEW;
END;
$$;