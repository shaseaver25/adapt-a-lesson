-- Fix: Replace overly permissive service policies with proper service_role checks

-- Fix usage_analytics: Replace "Service can insert analytics" with proper service_role check
DROP POLICY IF EXISTS "Service can insert analytics" ON public.usage_analytics;
CREATE POLICY "Service role can insert analytics" 
ON public.usage_analytics FOR INSERT 
WITH CHECK (auth.role() = 'service_role'::text);

-- Fix ai_cost_logs: Replace "Service can insert AI costs" with proper service_role check
DROP POLICY IF EXISTS "Service can insert AI costs" ON public.ai_cost_logs;
CREATE POLICY "Service role can insert AI costs" 
ON public.ai_cost_logs FOR INSERT 
WITH CHECK (auth.role() = 'service_role'::text);