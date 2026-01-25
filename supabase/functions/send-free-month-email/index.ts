import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FreeMonthEmailRequest {
  email: string;
  userName: string | null;
  trialEndDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, trialEndDate }: FreeMonthEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const displayName = userName || "Valued User";
    const formattedDate = new Date(trialEndDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #166534 0%, #15803d 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Thank You! 🎉</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${displayName},</p>
    
    <p style="margin-bottom: 20px;">
      We truly appreciate you taking the time to share your feedback with us! Your insights help us make 
      <strong>REAL Path Learning</strong> better for educators everywhere.
    </p>
    
    <div style="background: #dcfce7; border-left: 4px solid #166534; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 16px; color: #166534;">
        <strong>🎁 As a thank you, we've added a FREE MONTH to your subscription!</strong>
      </p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #15803d;">
        Your access now extends through <strong>${formattedDate}</strong>
      </p>
    </div>
    
    <p style="margin-bottom: 20px;">
      Continue creating amazing differentiated lessons, authentic assessments, and rubrics for your students. 
      We're here to support you every step of the way!
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://adapt-a-lesson.lovable.app/studio" 
         style="background: #166534; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Continue Creating →
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Questions? Visit our <a href="https://adapt-a-lesson.lovable.app/help" style="color: #166534;">Help Center</a> 
      or reply to this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
      REAL Path Learning | Empowering Educators with AI
    </p>
  </div>
</body>
</html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "REAL Path Learning <noreply@realpathlearning.com>",
        to: [email],
        subject: "Thank You for Your Feedback! 🎉 Enjoy Your Free Month",
        html: htmlContent,
      }),
    });

    const emailResponse = await response.json();

    if (!response.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Free month thank-you email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-free-month-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
