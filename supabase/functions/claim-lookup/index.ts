import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LookupRequest {
  action: "lookup" | "send_magic_link";
  claim_token: string;
  redirect_to?: string;
}

function maskEmail(email: string): string {
  try {
    const [local, domain] = email.split("@");
    if (!local || !domain) return "***@***";
    return `${local[0]}***@${domain}`;
  } catch {
    return "***@***";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, claim_token, redirect_to }: LookupRequest = await req.json();
    if (!claim_token || !action) {
      return new Response(
        JSON.stringify({ error: "Missing claim_token or action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Always fetch the claim row first (service role bypasses RLS)
    const { data: claim, error: claimErr } = await supabase
      .from("account_claims")
      .select("id, first_name, invitee_email, status, expires_at, claim_token")
      .eq("claim_token", claim_token)
      .maybeSingle();

    if (claimErr) {
      console.error("claim-lookup: select error", claimErr);
      return new Response(
        JSON.stringify({ error: "Lookup failed" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const valid = !!claim && claim.status === "pending" && new Date(claim.expires_at) > new Date();
    console.log("claim-lookup: lookup", { token: claim_token, found: !!claim, status: claim?.status, expires_at: claim?.expires_at, valid });

    if (action === "lookup") {
      if (!claim) {
        return new Response(
          JSON.stringify({ valid: false, reason: "not_found" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (claim.status !== "pending") {
        return new Response(
          JSON.stringify({ valid: false, reason: "status_not_pending" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (new Date(claim.expires_at) <= new Date()) {
        return new Response(
          JSON.stringify({ valid: false, reason: "expired" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          first_name: claim.first_name,
          masked_email: maskEmail(claim.invitee_email || ""),
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "send_magic_link") {
      if (!valid) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid or expired claim" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const appUrl = Deno.env.get("SITE_URL") || "https://lunabeam.app";
      const redirectTo = redirect_to || `${appUrl.replace(/\/$/, "")}/claim-complete?token=${claim_token}`;

      // For new users, prefer invite link which creates the user. For existing users, use magic link.
      console.log(`claim-lookup: generating link for ${claim.invitee_email}`);
      
      let linkData: any | null = null;
      let linkErr: any | null = null;

      // Try magic link first; if it fails (e.g., user doesn't exist), fall back to invite link
      try {
        const magicResp = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: claim.invitee_email,
          options: { redirectTo },
        });
        if (magicResp.error) {
          console.error('claim-lookup: magic link failed', magicResp.error);
          linkErr = magicResp.error;
        } else {
          linkData = magicResp.data;
          console.log('claim-lookup: magic link generated successfully');
        }
      } catch (e) {
        console.error('claim-lookup: magic link threw', e);
        linkErr = e;
      }
      
      // If magic link failed, try invite link
      if (!linkData || linkErr) {
        console.log('claim-lookup: generating invite link');
        const inviteResp = await supabase.auth.admin.generateLink({
          type: 'invite',
          email: claim.invitee_email,
          options: { redirectTo },
        });
        
        if (inviteResp.error) {
          console.error('claim-lookup: invite link generation failed', inviteResp.error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to generate authentication link: ${inviteResp.error.message}` 
            }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        } else {
          linkData = inviteResp.data;
          linkErr = null;
          console.log('claim-lookup: invite link generated successfully');
        }
      }

      const actionLink = (linkData as any)?.properties?.action_link || (linkData as any)?.properties?.email_otp_link;

      // Try to send via Resend, but still succeed even if email send fails
      try {
        if (actionLink) {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center;">Sign in to LunaBeam</h1>
              <p>Click the secure link below to access your account.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${actionLink}"
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                  Access Your Account
                </a>
              </div>
              <p style="font-size: 12px; color: #666;">If the button doesn’t work, copy and paste this URL into your browser:<br />
                <span style="word-break: break-all;">${actionLink}</span>
              </p>
            </div>`;

          const sendResp = await resend.emails.send({
            from: 'LunaBeam <invites@invites.lunabeam.app>',
            to: [claim.invitee_email],
            subject: 'Access your LunaBeam account',
            html,
          });
          console.log('claim-lookup: resend result', sendResp);
        }
      } catch (e) {
        console.error('claim-lookup: resend send failed (continuing with action link)', e);
      }

      return new Response(
        JSON.stringify({ success: true, action_link: actionLink }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e: any) {
    console.error("claim-lookup: unexpected error", e);
    return new Response(
      JSON.stringify({ error: e?.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
