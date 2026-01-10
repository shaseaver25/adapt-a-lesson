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
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: null,
        subscriptionEnd: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions (monthly plan)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const productId = subscription.items.data[0]?.price.product as string;
      const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      let tier = "monthly";
      if (productId === PRODUCT_IDS.yearly) {
        tier = "yearly";
      }

      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        productId,
        tier,
        endDate: subscriptionEnd 
      });

      return new Response(JSON.stringify({
        subscribed: true,
        tier,
        productId,
        subscriptionEnd,
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
          logStep("Valid yearly payment found", {
            paymentIntentId: intent.id,
            expiryDate: expiryDate.toISOString(),
          });

          return new Response(JSON.stringify({
            subscribed: true,
            tier: "yearly",
            productId: PRODUCT_IDS.yearly,
            subscriptionEnd: expiryDate.toISOString(),
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
          logStep("Valid yearly checkout session found", {
            sessionId: session.id,
            expiryDate: expiryDate.toISOString(),
          });

          return new Response(JSON.stringify({
            subscribed: true,
            tier: "yearly",
            productId: PRODUCT_IDS.yearly,
            subscriptionEnd: expiryDate.toISOString(),
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
