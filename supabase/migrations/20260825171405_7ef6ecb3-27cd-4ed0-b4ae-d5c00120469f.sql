-- Switch caller-scoped helpers from SECURITY DEFINER to SECURITY INVOKER so
-- they run under the caller's RLS instead of bypassing it.

CREATE OR REPLACE FUNCTION public.update_login_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.profiles
  SET last_login_at = now(), login_count = login_count + 1, updated_at = now()
  WHERE id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_time_stats(p_user_id uuid, p_duration_seconds integer)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.user_time_stats (user_id, total_time_seconds, last_session_duration_seconds, last_updated)
  VALUES (auth.uid(), p_duration_seconds, p_duration_seconds, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_time_seconds = user_time_stats.total_time_seconds + p_duration_seconds,
    last_session_duration_seconds = p_duration_seconds,
    last_updated = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  DELETE FROM public.user_sessions
  WHERE user_id = auth.uid()
    AND last_active_at < now() - interval '12 hours'
$function$;

CREATE OR REPLACE FUNCTION public.count_active_sessions(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer FROM public.user_sessions
  WHERE user_id = auth.uid() AND last_active_at > now() - interval '12 hours'
$function$;

-- Ticket numbers no longer need to read other users' rows: use a sequence.
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_number_seq;
GRANT USAGE, SELECT ON SEQUENCE public.support_ticket_number_seq TO authenticated;
GRANT ALL ON SEQUENCE public.support_ticket_number_seq TO service_role;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'TICKET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
         LPAD((nextval('public.support_ticket_number_seq'))::text, 3, '0');
END;
$function$;