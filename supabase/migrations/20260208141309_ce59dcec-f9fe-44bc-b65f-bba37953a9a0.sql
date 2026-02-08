-- Create function to send welcome email via edge function
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  request_id bigint;
BEGIN
  -- Only send for new users (not updates)
  IF TG_OP = 'INSERT' THEN
    -- Build payload with user email and name
    payload := jsonb_build_object(
      'email', NEW.email,
      'userName', NEW.full_name
    );
    
    -- Call the edge function via pg_net extension
    SELECT net.http_post(
      url := CONCAT(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1),
        '/functions/v1/send-welcome-email'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', CONCAT('Bearer ', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1))
      ),
      body := payload
    ) INTO request_id;
    
    RAISE LOG 'Welcome email request sent for user: %, request_id: %', NEW.email, request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_new_user_send_welcome_email ON public.profiles;

CREATE TRIGGER on_new_user_send_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email();