import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEducatorEmailRequest {
  recipientEmail: string;
  inviterName: string;
  personalMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      });
    }

    const { recipientEmail, inviterName, personalMessage }: InviteEducatorEmailRequest = await req.json();

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    if (!inviterName) {
      throw new Error("Inviter name is required");
    }

    console.log(`Sending invite educator email to ${recipientEmail} from ${inviterName}`);

    const personalMessageHtml = personalMessage 
      ? `
        <div style="background-color: #f9fafb; border-left: 4px solid #2F4F2F; padding: 15px 20px; margin: 0 0 25px 0; border-radius: 0 8px 8px 0;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 5px 0; font-style: italic;">Personal message from ${inviterName}:</p>
          <p style="font-size: 16px; color: #333333; margin: 0; line-height: 1.6;">
            "${personalMessage}"
          </p>
        </div>
      `
      : '';

    const emailResponse = await resend.emails.send({
      from: "RealPath Learning <support@realpathlearning.com>",
      to: [recipientEmail],
      subject: `${inviterName} Thinks You'll Love RealPath Learning`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to RealPath Learning</title>
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
                You're Invited! 🌟
              </h1>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="font-size: 18px; color: #333333; margin: 0 0 20px 0; line-height: 1.6;">
                Hi there!
              </p>
              
              <p style="font-size: 16px; color: #555555; margin: 0 0 20px 0; line-height: 1.6;">
                <strong>${inviterName}</strong> invited you to try RealPath Learning — the AI-powered platform that helps educators create differentiated lessons in minutes.
              </p>
              
              ${personalMessageHtml}
              
              <p style="font-size: 16px; color: #333333; margin: 0 0 15px 0; font-weight: 600;">
                With RealPath Learning, you can:
              </p>
              
              <ul style="font-size: 16px; color: #555555; margin: 0 0 30px 0; padding-left: 20px; line-height: 1.8;">
                <li>Differentiate any lesson for multiple reading levels</li>
                <li>Generate authentic assessments and rubrics</li>
                <li>Support multilingual learners with audio features</li>
                <li>Create lessons according to students' IEPs</li>
              </ul>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://realpathlearning.com/register" 
                       style="display: inline-block; background: #2F4F2F; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 600; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(47, 79, 47, 0.3);">
                      Try It Free
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 16px; color: #555555; margin: 30px 0 10px 0; line-height: 1.6; text-align: center;">
                Questions? Reply to this email — we're here to help.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 15px 0;">
                Join the community of educators transforming their classrooms!<br>
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

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: emailResponse.error.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Invite educator email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invite-educator-email function:", error);
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
