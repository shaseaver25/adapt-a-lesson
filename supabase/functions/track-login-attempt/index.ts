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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: LoginAttemptRequest = await req.json();
    const { email, success, userId, failureReason, userAgent } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get IP address from headers (Supabase edge functions have this)
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    console.log(`Tracking login attempt for ${email}: success=${success}`);

    // Insert login attempt record
    const { error: insertError } = await supabase
      .from('login_attempts')
      .insert({
        email,
        success,
        user_id: userId || null,
        failure_reason: failureReason || null,
        user_agent: userAgent || null,
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
        console.log(`Failed attempts for ${email} in last 15 minutes: ${failedCount}`);
        
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
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
