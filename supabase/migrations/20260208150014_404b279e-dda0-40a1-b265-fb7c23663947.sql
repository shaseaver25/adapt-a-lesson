-- Drop the existing trigger that uses pg_net (which isn't available)
DROP TRIGGER IF EXISTS on_first_lesson_send_email ON public.generated_lessons;

-- Update the trigger function to just track the first lesson without calling pg_net
-- The frontend will handle calling the edge function
CREATE OR REPLACE FUNCTION public.send_first_lesson_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_lesson_count integer;
  already_sent boolean;
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
    
    -- Mark for email sending (frontend will pick this up)
    -- This prevents duplicate sends if the same user creates multiple lessons quickly
    IF already_sent IS NOT TRUE THEN
      UPDATE public.profiles
      SET first_lesson_email_sent = TRUE
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger with the simpler function
CREATE TRIGGER on_first_lesson_send_email
  AFTER INSERT ON public.generated_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.send_first_lesson_email();