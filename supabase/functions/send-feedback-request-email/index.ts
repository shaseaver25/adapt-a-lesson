import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequestEmailRequest {
  email: string;
  userName: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName }: FeedbackRequestEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Sending feedback request email to ${email}`);

    const displayName = userName || "there";

    const emailResponse = await resend.emails.send({
      from: "RealPath Learning <support@realpathlearning.com>",
      to: [email],
      subject: "How's Your Experience So Far? Share Your Thoughts",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We'd Love Your Feedback</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2F4F2F 0%, #4F7F4F 100%); padding: 40px 40px 30px 40px; text-align: center;">
              <img src="https://realpathlearning.com/real-logo.png" alt="RealPath Learning" width="180" style="max-width: 180px; height: auto;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 20px 0 0 0; line-height: 1.3;">
                We Value Your Voice 💬
              </h1>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0; line-height: 1.6;">
                Hi ${displayName}!
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 20px 0; line-height: 1.6;">
                You've been using RealPath Learning, and we'd love to hear from you!
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 25px 0; line-height: 1.6;">
                Your feedback shapes our roadmap and helps us build better tools for educators everywhere.
              </p>
              
              <div style="background-color: #f0f9f0; border: 2px solid #2F4F2F; padding: 20px; margin: 0 0 30px 0; border-radius: 8px; text-align: center;">
                <p style="font-size: 16px; color: #2F4F2F; margin: 0; font-weight: 600;">
                  ✨ As a thank you, complete our 3-minute survey or let us know if we can have a 1:1 discussion with you to influence our building roadmap!
                </p>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://realpathlearning.com/feedback" 
                       style="display: inline-block; background: #2F4F2F; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 600; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(47, 79, 47, 0.3);">
                      Share Your Feedback
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #888888; margin: 20px 0 0 0; line-height: 1.6; text-align: center;">
                Takes only 3 minutes · Your insights matter to us
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 30px 0 10px 0; line-height: 1.6; text-align: center;">
                Questions? We're <a href="mailto:support@realpathlearning.com" style="color: #2F4F2F; text-decoration: underline; font-weight: 500;">just a click away</a>.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 15px 0;">
                Thank you for being part of our community!<br>
                <strong style="color: #2F4F2F;">The RealPath Learning Team</strong>
              </p>
              
              <div style="margin: 20px 0;">
                <a href="https://www.linkedin.com/company/realpathlearning" style="display: inline-block; margin: 0 8px;">
                  <img src="https://cdn-icons-png.flaticon.com/32/174/174857.png" alt="LinkedIn" width="24" height="24" style="border: 0;">
                </a>
              </div>
              
              <p style="font-size: 12px; color: #9ca3af; margin: 15px 0 0 0;">
                © ${new Date().getFullYear()} RealPath Learning. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log("Feedback request email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-feedback-request-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
