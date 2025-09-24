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

    if (action === "lookup") {
      if (!valid) {
        return new Response(
          JSON.stringify({ valid: false }),
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

      const siteOrigin = req.headers.get("origin") || req.headers.get("referer") || Deno.env.get("SITE_URL") || "";
      const redirectTo = redirect_to || `${(siteOrigin || "").replace(/\/$/, "")}/claim-complete?token=${claim_token}`;

      // First, create the user account if it doesn't exist
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: claim.invitee_email,
        email_confirm: true,
        user_metadata: {
          first_name: claim.first_name,
          claim_token: claim_token
        }
      });

      if (signUpError && !signUpError.message.includes('already been registered')) {
        console.error("claim-lookup: createUser error", signUpError);
        return new Response(
          JSON.stringify({ success: false, error: signUpError.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Send magic link email to the invitee
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: claim.invitee_email,
        options: { emailRedirectTo: redirectTo },
      });

      if (otpErr) {
        console.error("claim-lookup: signInWithOtp error", otpErr);
        return new Response(
          JSON.stringify({ success: false, error: otpErr.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
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
