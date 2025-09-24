import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";




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

      console.log(`claim-lookup: generating auth link for ${claim.invitee_email}`);
      
      let linkData: any | null = null;
      let linkErr: any | null = null;

      // For account claims, we need to create the user first if they don't exist
      // Try invite link which can create new users
      try {
        console.log('claim-lookup: attempting invite link generation');
        const inviteResp = await supabase.auth.admin.generateLink({
          type: 'invite',
          email: claim.invitee_email,
          options: { redirectTo },
        });
        
        if (inviteResp.error) {
          console.error('claim-lookup: invite link failed', inviteResp.error);
          linkErr = inviteResp.error;
        } else {
          linkData = inviteResp.data;
          console.log('claim-lookup: invite link generated successfully');
        }
      } catch (e) {
        console.error('claim-lookup: invite link threw', e);
        linkErr = e;
      }

      // If invite link failed, try magic link as fallback
      if (!linkData && linkErr) {
        try {
          console.log('claim-lookup: attempting magic link as fallback');
          const magicResp = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: claim.invitee_email,
            options: { redirectTo },
          });
          if (magicResp.error) {
            console.error('claim-lookup: magic link also failed', magicResp.error);
            linkErr = magicResp.error;
          } else {
            linkData = magicResp.data;
            linkErr = null;
            console.log('claim-lookup: magic link generated successfully');
          }
        } catch (e) {
          console.error('claim-lookup: magic link also threw', e);
          linkErr = e;
        }
      }

      // If both failed, return error but with 200 status
      if (!linkData || linkErr) {
        console.error('claim-lookup: both invite and magic link generation failed');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Unable to generate authentication link. Please contact support.`
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const actionLink = (linkData as any)?.properties?.action_link || (linkData as any)?.properties?.email_otp_link;


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
