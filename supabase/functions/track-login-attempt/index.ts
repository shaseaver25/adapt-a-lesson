import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginAttemptRequest {
  email: string;
  success: boolean;
  userId?: string;
  failureReason?: string;
  userAgent?: string;
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per IP per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  record.count++;
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  return false;
}

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get IP address for rate limiting
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    // Check rate limit
    if (isRateLimited(ipAddress)) {
      console.warn(`Rate limit exceeded for IP: ${ipAddress}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: LoginAttemptRequest = await req.json();
    const { email, success, userId, failureReason, userAgent } = body;

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitize string inputs (prevent injection)
    const sanitizedFailureReason = failureReason ? String(failureReason).slice(0, 500) : null;
    const sanitizedUserAgent = userAgent ? String(userAgent).slice(0, 500) : null;

    // Login attempt tracking (silent in production)

    // Insert login attempt record
    const { error: insertError } = await supabase
      .from('login_attempts')
      .insert({
        email,
        success,
        user_id: userId || null,
        failure_reason: sanitizedFailureReason,
        user_agent: sanitizedUserAgent,
        ip_address: ipAddress,
      });

    if (insertError) {
      console.error('Error inserting login attempt:', insertError);
      throw insertError;
    }

    // Check for recent failed attempts (for potential account locking)
    if (!success) {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data: recentAttempts, error: countError } = await supabase
        .from('login_attempts')
        .select('id')
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', fifteenMinutesAgo);

      if (!countError && recentAttempts) {
        const failedCount = recentAttempts.length;
        // Check if approaching lockout threshold
        
        // Return warning if approaching lockout threshold
        if (failedCount >= 5) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              warning: 'Account may be locked due to multiple failed attempts',
              failedAttempts: failedCount,
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error tracking login attempt:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
