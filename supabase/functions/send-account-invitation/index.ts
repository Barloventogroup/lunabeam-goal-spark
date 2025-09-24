import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AccountInvitationRequest {
  individual_id: string;
  invitee_email: string;
  invitee_name?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { individual_id, invitee_email, invitee_name, message }: AccountInvitationRequest = await req.json();

    if (!individual_id || !invitee_email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: individual_id, invitee_email" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Call the database function to update email and generate magic link
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.55.0');
    
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) {
      console.warn('Missing Authorization header on invitation request');
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: assignResult, error: assignError } = await supabase
      .rpc('assign_email_and_invite', {
        p_individual_id: individual_id,
        p_real_email: invitee_email,
        p_invitee_name: invitee_name
      });

    if (assignError) {
      console.error('Error assigning email:', assignError);
      return new Response(
        JSON.stringify({ error: `Failed to assign email: ${assignError.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!assignResult || assignResult.length === 0) {
      return new Response(
        JSON.stringify({ error: "No result from email assignment" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { magic_link_token, claim_token } = assignResult[0];

    // Resolve site URL from request origin first (best), then env fallbacks
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const siteUrl = origin || Deno.env.get('SITE_URL') || (Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')) || 'https://your-site.com';

    // Use claim_token directly from database response
    const magicLinkUrl = claim_token ? 
      `${siteUrl.replace(/\/$/, '')}/claim?token=${claim_token}` :
      `${siteUrl.replace(/\/$/, '')}/auth/callback?token=${magic_link_token}&type=magiclink&redirect_to=${encodeURIComponent(siteUrl)}`;

    const subject = "Your LunaBeam Account is Ready!";
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Welcome to LunaBeam!</h1>
        
        <p>Hi ${invitee_name || 'there'},</p>
        
        <p>Your LunaBeam account has been set up and is ready to use! Someone has created an account for you and you can now access it.</p>
        
        ${message ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLinkUrl}" 
             style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Access Your Account
          </a>
        </div>
        
        <p><strong>Important:</strong> This magic link will expire in 24 hours for security reasons.</p>
        
        <p>Once you access your account, you can:</p>
        <ul>
          <li>View and work on your goals</li>
          <li>Track your progress</li>
          <li>Set your own password</li>
          <li>Update your profile</li>
        </ul>
        
        <p>If you have any questions or need help, don't hesitate to reach out!</p>
        
        <p>Best regards,<br>The LunaBeam Team</p>
        
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: 'LunaBeam <invites@invites.lunabeam.app>',
      to: [invitee_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Magic link email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account invitation sent successfully",
        email_sent: true 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
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