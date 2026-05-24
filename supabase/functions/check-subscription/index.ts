import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product IDs for tier mapping
const PRODUCT_IDS = {
  monthly: "prod_TlY3S8sEWv59zN",
  yearly: "prod_TlY3dIKgwPbSyJ",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    // Retry getUser to tolerate transient "Connection reset by peer" from auth endpoint
    let userData: { user: { id: string; email?: string } | null } | null = null;
    let userError: { message: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabaseClient.auth.getUser(token);
      userData = result.data as typeof userData;
      userError = result.error as typeof userError;
      if (!userError) break;
      logStep("getUser failed, retrying", { attempt: attempt + 1, error: userError.message });
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // FIRST: Check for database subscription overrides
    const { data: override, error: overrideError } = await supabaseClient
      .from('subscription_overrides')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (overrideError) {
      logStep("Error checking override", { error: overrideError.message });
    }

    if (override) {
      logStep("Found subscription override", { type: override.override_type, trialEnd: override.trial_end_date });

      if (override.override_type === 'permanent') {
        // Permanent access - always subscribed
        return new Response(JSON.stringify({
          subscribed: true,
          tier: "yearly", // Treat permanent as yearly equivalent
          productId: null,
          subscriptionEnd: null,
          isTrialing: false,
          trialEnd: null,
          daysRemaining: null,
          isPermanent: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (override.override_type === 'trial' && override.trial_end_date) {
        const trialEnd = new Date(override.trial_end_date);
        const now = new Date();
        
        if (trialEnd > now) {
          // Trial still valid
          const diffTime = trialEnd.getTime() - now.getTime();
          const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

          return new Response(JSON.stringify({
            subscribed: true,
            tier: "monthly", // Treat trial as monthly equivalent
            productId: null,
            subscriptionEnd: trialEnd.toISOString(),
            isTrialing: true,
            trialEnd: trialEnd.toISOString(),
            daysRemaining,
            isOverride: true,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          logStep("Database trial has expired", { trialEnd: override.trial_end_date });
          // Trial expired - continue to check Stripe
        }
      }
    }

    // SECOND: Check Stripe for subscriptions
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: null,
        subscriptionEnd: null,
        isTrialing: false,
        trialEnd: null,
        daysRemaining: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active OR trialing subscriptions (monthly plan)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    // Find subscription that is active or trialing
    const validSubscription = subscriptions.data.find(
      (sub: { status: string }) => sub.status === "active" || sub.status === "trialing"
    );

    if (validSubscription) {
      const subscription = validSubscription;
      const productId = subscription.items.data[0]?.price.product as string;
      const isTrialing = subscription.status === "trialing";
      
      // For trialing, use trial_end; for active, use current_period_end
      const endTimestamp = isTrialing && subscription.trial_end 
        ? subscription.trial_end 
        : subscription.current_period_end;
      const subscriptionEnd = new Date(endTimestamp * 1000).toISOString();
      
      // Calculate days remaining
      const now = new Date();
      const endDate = new Date(endTimestamp * 1000);
      const diffTime = endDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      let tier: "monthly" | "yearly" = "monthly";
      if (productId === PRODUCT_IDS.yearly) {
        tier = "yearly";
      }

      logStep("Valid subscription found", { 
        subscriptionId: subscription.id, 
        productId,
        tier,
        status: subscription.status,
        isTrialing,
        endDate: subscriptionEnd,
        daysRemaining,
      });

      return new Response(JSON.stringify({
        subscribed: true,
        tier,
        productId,
        subscriptionEnd,
        isTrialing,
        trialEnd: isTrialing ? subscriptionEnd : null,
        daysRemaining,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check for successful one-time payments (yearly plan)
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 10,
    });

    // Look for successful payments for the yearly product
    for (const intent of paymentIntents.data) {
      if (intent.status === "succeeded" && intent.metadata?.product_id === PRODUCT_IDS.yearly) {
        const paymentDate = new Date(intent.created * 1000);
        const expiryDate = new Date(paymentDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        // Check if still valid
        if (expiryDate > new Date()) {
          const now = new Date();
          const diffTime = expiryDate.getTime() - now.getTime();
          const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

          logStep("Valid yearly payment found", {
            paymentIntentId: intent.id,
            expiryDate: expiryDate.toISOString(),
            daysRemaining,
          });

          return new Response(JSON.stringify({
            subscribed: true,
            tier: "yearly",
            productId: PRODUCT_IDS.yearly,
            subscriptionEnd: expiryDate.toISOString(),
            isTrialing: false,
            trialEnd: null,
            daysRemaining,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    // Also check checkout sessions for one-time payments
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 10,
    });

    for (const session of sessions.data) {
      if (session.payment_status === "paid" && session.mode === "payment") {
        const paymentDate = new Date(session.created * 1000);
        const expiryDate = new Date(paymentDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        // Check if still valid
        if (expiryDate > new Date()) {
          const now = new Date();
          const diffTime = expiryDate.getTime() - now.getTime();
          const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

          logStep("Valid yearly checkout session found", {
            sessionId: session.id,
            expiryDate: expiryDate.toISOString(),
            daysRemaining,
          });

          return new Response(JSON.stringify({
            subscribed: true,
            tier: "yearly",
            productId: PRODUCT_IDS.yearly,
            subscriptionEnd: expiryDate.toISOString(),
            isTrialing: false,
            trialEnd: null,
            daysRemaining,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    logStep("No active subscription or valid payment found");
    return new Response(JSON.stringify({ 
      subscribed: false,
      tier: null,
      subscriptionEnd: null,
      isTrialing: false,
      trialEnd: null,
      daysRemaining: null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
