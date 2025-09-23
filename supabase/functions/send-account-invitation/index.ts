import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccountInvitationRequest {
  invitee_email: string;
  invitee_name: string;
  inviter_name: string;
  claim_token: string;
  magic_link_token: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      invitee_email, 
      invitee_name, 
      inviter_name, 
      claim_token, 
      magic_link_token, 
      message 
    }: AccountInvitationRequest = await req.json();

    if (!invitee_email || !claim_token || !magic_link_token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create the claim URL with the site URL from environment
    const siteUrl = Deno.env.get('SUPABASE_URL')?.replace('https://soyiqjdwnhtvopvwvfkq.supabase.co', 'https://your-site.lovable.app') || 'https://your-site.lovable.app';
    const claimUrl = `${siteUrl}/claim-account?token=${claim_token}`;

    const subject = `${inviter_name} has set up an account for you`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Welcome to LunaBeam!</h1>
        
        <p>Hi ${invitee_name || 'there'},</p>
        
        <p><strong>${inviter_name}</strong> has set up a LunaBeam account for you and invited you to get started with goal tracking and achievement.</p>
        
        ${message ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${claimUrl}" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Accept Invitation & Set Up Account
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This invitation link will expire in 24 hours. If you have any questions, you can reply to this email.
        </p>
        
        <p>Best regards,<br>The LunaBeam Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you're having trouble with the button above, copy and paste this URL into your web browser:<br>
          <a href="${claimUrl}" style="color: #999;">${claimUrl}</a>
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: `${Deno.env.get("RESEND_FROM_NAME")} <${Deno.env.get("RESEND_FROM_EMAIL")}>`,
      to: [invitee_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Account invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-account-invitation function:", error);
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