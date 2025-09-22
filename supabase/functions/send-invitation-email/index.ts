import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "no-reply@invites.lunabeam.app"; // Use Lunabeam invites subdomain
const FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "Lunabeam Invitations";

interface InvitationEmailRequest {
  type: 'family_circle' | 'supporter';
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  message?: string;
  inviteLink: string;
  roleName?: string;
  circeName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      type,
      inviteeName,
      inviteeEmail,
      inviterName,
      message,
      inviteLink,
      roleName,
      circeName
    }: InvitationEmailRequest = await req.json();

    console.log('Sending invitation email:', { type, inviteeName, inviteeEmail, inviterName });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteeEmail)) {
      console.error('Invalid email format:', inviteeEmail);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid email format: ${inviteeEmail}. Please provide a valid email address.` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let subject: string;
    let htmlContent: string;

    // Use display name or fallback to friendly greeting
    const displayName = inviteeName && inviteeName.trim() ? inviteeName.trim() : null;
    const greeting = displayName ? `Hi ${displayName},` : 'Hello there,';

    if (type === 'family_circle') {
      subject = `You're invited to join ${circeName || 'a family circle'}!`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Family Circle Invitation</h2>
          <p>${greeting}</p>
          <p><strong>${inviterName}</strong> has invited you to join their family circle${circeName ? ` "${circeName}"` : ''} on LuneBeam!</p>
          ${message ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><em>"${message}"</em></p></div>` : ''}
          <p>Click the link below to accept the invitation:</p>
          <a href="${inviteLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Accept Invitation</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; word-break: break-all;">${inviteLink}</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">This invitation was sent by ${inviterName} through LuneBeam. If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `;
    } else {
      subject = `You're invited to join Lunabeam!`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Supporter Invitation</h2>
          <p>${greeting}</p>
          <p><strong>${inviterName}</strong> has invited you to join them on Lunabeam${roleName ? ` as a ${roleName}` : ''}!</p>
          ${message ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><em>"${message}"</em></p></div>` : ''}
          <p>As a supporter, you'll be able to help track progress and provide encouragement on their goals.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${inviteLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Accept Invitation</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; word-break: break-all;">${inviteLink}</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">This invitation was sent by ${inviterName} through Lunabeam. If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `;
    }

    // Clean up the name and email for proper formatting
    const cleanedEmail = inviteeEmail.trim();
    
    const { data: sent, error: resendError } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [displayName ? `${displayName} <${cleanedEmail}>` : cleanedEmail],
      subject: subject,
      html: htmlContent,
    });

    if (resendError) {
      console.error("Resend error:", resendError);
      return new Response(
        JSON.stringify({ success: false, error: resendError.message || 'Failed to send via Resend' }),
        { status: resendError.statusCode || 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", sent);

    return new Response(JSON.stringify({ success: true, emailId: sent?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send invitation email' 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);