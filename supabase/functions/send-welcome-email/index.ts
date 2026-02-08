import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  userName: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName }: WelcomeEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Sending welcome email to ${email}`);

    const displayName = userName || "there";

    const emailResponse = await resend.emails.send({
      from: "RealPath Learning <support@realpathlearning.com>",
      to: [email],
      subject: "Welcome to RealPath Learning : Let's Build Your First Lesson",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RealPath Learning</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 40px 40px 30px 40px; text-align: center;">
              <img src="https://realpathlearning.com/real-logo.png" alt="RealPath Learning" width="180" style="max-width: 180px; height: auto;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 20px 0 0 0; line-height: 1.3;">
                Welcome to RealPath Learning!
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
                We're thrilled to have you join the RealPath Learning community! You're now part of a growing network of educators who are transforming how they create differentiated lessons for their students.
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 30px 0; line-height: 1.6;">
                With RealPath Learning, you can:
              </p>
              
              <ul style="font-size: 16px; color: #555555; margin: 0 0 30px 0; padding-left: 20px; line-height: 1.8;">
                <li>Create personalized student groups based on reading levels and learning needs</li>
                <li>Generate differentiated lessons with AI-powered content adaptation</li>
                <li>Build authentic assessments with FERPA-compliant privacy protection</li>
                <li>Access audio support for multilingual learners</li>
              </ul>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://realpathlearning.com/studio" 
                       style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 600; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                      Create your first student group and lesson now
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 16px; color: #555555; margin: 30px 0 10px 0; line-height: 1.6; text-align: center;">
                Need help getting started? We're <a href="mailto:support@realpathlearning.com" style="color: #2d5a87; text-decoration: underline; font-weight: 500;">just a click away</a>.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 15px 0;">
                Happy Teaching!<br>
                <strong style="color: #1e3a5f;">The RealPath Learning Team</strong>
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

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
