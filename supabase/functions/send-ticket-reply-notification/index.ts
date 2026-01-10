import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TicketReplyNotificationRequest {
  userEmail: string;
  userName: string;
  ticketNumber: string;
  ticketSubject: string;
  replyMessage: string;
  ticketId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userEmail, 
      userName, 
      ticketNumber, 
      ticketSubject, 
      replyMessage,
      ticketId 
    }: TicketReplyNotificationRequest = await req.json();

    console.log(`Sending ticket reply notification to ${userEmail} for ticket ${ticketNumber}`);

    // Get the app URL from environment or use a default
    const appUrl = Deno.env.get("APP_URL") || "https://yourapp.lovable.app";
    const ticketUrl = `${appUrl}/help/ticket/${ticketId}`;

    const emailResponse = await resend.emails.send({
      from: "Support <onboarding@resend.dev>",
      to: [userEmail],
      subject: `[${ticketNumber}] New Reply on Your Support Ticket`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Reply on Your Ticket</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin-top: 0;">Hi ${userName},</p>
              
              <p>You have a new reply on your support ticket:</p>
              
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
                  <strong>Ticket:</strong> ${ticketNumber}
                </p>
                <p style="margin: 0 0 15px 0; font-size: 14px; color: #6b7280;">
                  <strong>Subject:</strong> ${ticketSubject}
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                <div style="font-size: 15px; color: #374151; white-space: pre-wrap;">${replyMessage}</div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
                  View Full Conversation
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                You can reply directly from your support dashboard or respond to this ticket online.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">Best regards,<br>The Support Team</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-ticket-reply-notification function:", error);
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
