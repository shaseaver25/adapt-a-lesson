-- 1. Harden user-scoped helper functions to act on the caller only
CREATE OR REPLACE FUNCTION public.update_login_stats(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.profiles
  SET last_login_at = now(), login_count = login_count + 1, updated_at = now()
  WHERE id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_time_stats(p_user_id uuid, p_duration_seconds integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
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
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $function$
  DELETE FROM public.user_sessions
  WHERE user_id = auth.uid()
    AND last_active_at < now() - interval '12 hours'
$function$;

CREATE OR REPLACE FUNCTION public.count_active_sessions(p_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT COUNT(*)::integer FROM public.user_sessions
  WHERE user_id = auth.uid() AND last_active_at > now() - interval '12 hours'
$function$;

-- 2. Revoke blanket EXECUTE on all public functions, then re-grant narrowly
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Trigger functions: no direct EXECUTE needed by API roles.

-- Role checks are used inside RLS policies evaluated as the caller.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Caller-scoped helpers, signed-in users only.
GRANT EXECUTE ON FUNCTION public.update_login_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_time_stats(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_inactive_sessions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_sessions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_ticket_number() TO authenticated;

-- Account-lockout / email-enumeration helpers: server-side (edge function) only.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. error_logs: scope insert to signed-in users, let users read their own
DROP POLICY IF EXISTS "Authenticated users can insert errors" ON public.error_logs;
CREATE POLICY "Authenticated users can insert own errors"
  ON public.error_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view own errors" ON public.error_logs;
CREATE POLICY "Users can view own errors"
  ON public.error_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. rubric_verifications: admin oversight read access
DROP POLICY IF EXISTS "Admins can view rubric verifications" ON public.rubric_verifications;
CREATE POLICY "Admins can view rubric verifications"
  ON public.rubric_verifications FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));