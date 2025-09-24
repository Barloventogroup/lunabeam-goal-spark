import { serve } from "https://deno.land/std@0.190.0/http/server.ts";




const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "no-reply@invites.lunabeam.app"; // Use Lunabeam invites subdomain
const FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "Lunabeam Invitations";

interface InvitationEmailRequest {
  type: 'family_circle' | 'supporter' | 'individual';
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  message?: string;
  inviteLink: string;
  roleName?: string;
  circeName?: string;
  passcode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Edge function invoked:', req.method, req.url);
  
  if (req.method === "OPTIONS") {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📩 Processing invitation email request...');
    const {
      type,
      inviteeName,
      inviteeEmail,
      inviterName,
      message,
      inviteLink,
        roleName,
        circeName,
        passcode
      }: InvitationEmailRequest = await req.json();

    console.log('📋 Request data:', { type, inviteeName, inviteeEmail, inviterName });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteeEmail)) {
      console.error('❌ Invalid email format:', inviteeEmail);
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
    } else if (type === 'individual') {
      subject = `Welcome to Lunabeam - Claim Your Account`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Lunabeam Account is Ready!</h2>
          <p>${greeting}</p>
          <p><strong>${inviterName}</strong> has set up a Lunabeam account for you to help track and achieve your goals!</p>
          ${message ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><em>"${message}"</em></p></div>` : ''}
          <p><strong>Your passcode:</strong></p>
          <div style="background:#f4f4f4;border:1px solid #eee;border-radius:6px;padding:14px 16px;display:inline-block;font-family:monospace;font-size:18px;letter-spacing:2px;">
            {{PASSCODE}}
          </div>
          <p style="color:#666;font-size:12px;margin-top:6px;">Keep this code safe. You'll enter it on the claim page to verify your identity.</p>
          <p>With your Lunabeam account, you can:</p>
          <ul style="margin: 15px 0; padding-left: 25px;">
            <li>Set and track personal goals</li>
            <li>Break down goals into manageable steps</li>
            <li>Celebrate achievements and earn points</li>
            <li>Get support from your network</li>
          </ul>
          <p>Click the link below to claim your account and start tracking your goals:</p>
          <a href="${inviteLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Claim Your Account</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; word-break: break-all;">${inviteLink}</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">This account was created for you by ${inviterName} through Lunabeam. If you have any questions, please contact them directly.</p>
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

    // Replace passcode placeholder if provided
    if (type === 'individual' && typeof htmlContent === 'string') {
      htmlContent = htmlContent.replace('{{PASSCODE}}', (passcode || '******').toString());
    }
    
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      console.error('Resend not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [displayName ? `${displayName} <${cleanedEmail}>` : cleanedEmail],
        subject,
        html: htmlContent,
      }),
    });

    const sent = await resp.json();

    if (!resp.ok) {
      console.error('Resend error:', sent);
      return new Response(
        JSON.stringify({ success: false, error: sent?.message || 'Failed to send via Resend' }),
        { status: resp.status || 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // success path continues below

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