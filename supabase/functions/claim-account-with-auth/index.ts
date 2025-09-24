import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimRequest {
  claimToken: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claimToken, password }: ClaimRequest = await req.json();

    if (!claimToken || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing claim token or password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for user management
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://soyiqjdwnhtvopvwvfkq.supabase.co';
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!SERVICE_ROLE) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY in Edge Function environment');
      return new Response(
        JSON.stringify({ success: false, error: 'Server misconfiguration: missing service role key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SERVICE_ROLE
    );

    console.log('Looking up claim with token:', claimToken);
    
    // Validate claim token (no passcode needed anymore)
    const { data: claimRecord, error: claimError } = await supabaseAdmin
      .from('account_claims')
      .select('*')
      .eq('claim_token', claimToken)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (claimError || !claimRecord) {
      console.error('Claim validation failed:', claimError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired claim' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimRecord.individual_id; // Use the SAME user ID throughout
    console.log('Setting password for existing user:', userId, 'name:', claimRecord.first_name || 'User');

    // Get user's email from profile
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('email, first_name')
      .eq('user_id', userId)
      .single();

    if (!profileData) {
      console.error('No profile found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = profileData.email;
    if (!userEmail) {
      console.error('No email found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, error: 'User email not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the user's password in auth.users
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: password }
    );

    if (passwordError) {
      console.error('Failed to update user password:', passwordError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to set password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile to authenticated status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        authentication_status: 'authenticated',
        password_set: true,
        account_status: 'active',
        claimed_at: new Date().toISOString(),
        onboarding_complete: true
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
    }

    // Update the account claim
    const { error: claimUpdateError } = await supabaseAdmin
      .from('account_claims')
      .update({
        status: 'accepted',
        claimed_at: new Date().toISOString()
      })
      .eq('id', claimRecord.id);

    if (claimUpdateError) {
      console.error('Failed to update claim status:', claimUpdateError);
    }

    console.log('Successfully set password for user:', claimRecord.first_name || 'User');

    return new Response(
      JSON.stringify({
        success: true,
        firstName: profileData.first_name || claimRecord.first_name || 'User',
        userId: userId,
        email: userEmail
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in claim-account-with-auth function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);