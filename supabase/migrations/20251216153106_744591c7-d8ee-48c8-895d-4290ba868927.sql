-- Add login attempt tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS locked_at timestamp with time zone;

-- Create function to check and lock account after 5 failed attempts
CREATE OR REPLACE FUNCTION public.increment_failed_login(p_email text)
RETURNS TABLE(is_locked boolean, attempts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_attempts integer;
  v_locked boolean;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id FROM public.profiles WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false::boolean, 0::integer;
    RETURN;
  END IF;
  
  -- Increment failed attempts
  UPDATE public.profiles
  SET 
    failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
    updated_at = now()
  WHERE id = v_user_id;
  
  -- Check if we need to lock
  SELECT failed_login_attempts INTO v_attempts FROM public.profiles WHERE id = v_user_id;
  
  IF v_attempts >= 5 THEN
    UPDATE public.profiles
    SET 
      account_locked = true,
      locked_at = now(),
      updated_at = now()
    WHERE id = v_user_id;
    v_locked := true;
  ELSE
    v_locked := false;
  END IF;
  
  RETURN QUERY SELECT v_locked, v_attempts;
END;
$$;

-- Create function to reset failed attempts on successful login
CREATE OR REPLACE FUNCTION public.reset_failed_login(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    failed_login_attempts = 0,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Create function to check if account is locked
CREATE OR REPLACE FUNCTION public.check_account_locked(p_email text)
RETURNS TABLE(is_locked boolean, locked_timestamp timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(account_locked, false),
    locked_at
  FROM public.profiles
  WHERE email = p_email;
END;
$$;

-- Create function to check if email exists
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email);
END;
$$;