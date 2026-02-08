-- Add tracking columns to profiles to prevent duplicate emails
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_lesson_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feedback_request_sent_at TIMESTAMP WITH TIME ZONE;

-- Create function to send first lesson email
CREATE OR REPLACE FUNCTION public.send_first_lesson_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_lesson_count integer;
  user_email text;
  user_name text;
  lesson_title text;
  already_sent boolean;
  payload jsonb;
  request_id bigint;
BEGIN
  -- Count user's lessons
  SELECT COUNT(*) INTO user_lesson_count
  FROM public.generated_lessons
  WHERE user_id = NEW.user_id;
  
  -- Only proceed if this is their first lesson
  IF user_lesson_count = 1 THEN
    -- Check if email already sent
    SELECT first_lesson_email_sent INTO already_sent
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    IF already_sent = TRUE THEN
      RETURN NEW;
    END IF;
    
    -- Get user email and name
    SELECT email, full_name INTO user_email, user_name
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Get lesson title
    lesson_title := NEW.lesson_title;
    
    IF user_email IS NOT NULL THEN
      -- Mark email as sent
      UPDATE public.profiles
      SET first_lesson_email_sent = TRUE
      WHERE id = NEW.user_id;
      
      -- Build payload
      payload := jsonb_build_object(
        'email', user_email,
        'userName', user_name,
        'lessonTitle', lesson_title
      );
      
      -- Call the edge function via pg_net extension
      SELECT net.http_post(
        url := CONCAT(
          (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1),
          '/functions/v1/send-first-lesson-email'
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', CONCAT('Bearer ', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1))
        ),
        body := payload
      ) INTO request_id;
      
      RAISE LOG 'First lesson email request sent for user: %, request_id: %', user_email, request_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on generated_lessons
DROP TRIGGER IF EXISTS on_first_lesson_send_email ON public.generated_lessons;
CREATE TRIGGER on_first_lesson_send_email
  AFTER INSERT ON public.generated_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.send_first_lesson_email();