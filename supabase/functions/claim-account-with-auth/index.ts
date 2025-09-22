import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimRequest {
  claimToken: string;
  passcode: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claimToken, passcode }: ClaimRequest = await req.json();

    if (!claimToken || !passcode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing claim token or passcode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for user management
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate claim token and passcode
    const { data: claimRecord, error: claimError } = await supabaseAdmin
      .from('account_claims')
      .select('*')
      .eq('claim_token', claimToken)
      .eq('claim_passcode', passcode.toUpperCase())
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

    // Generate email and password for the user
    const firstName = claimRecord.first_name || 'User';
    const userEmail = `${firstName.toLowerCase().replace(/\s+/g, '')}+${claimToken.slice(0, 8)}@temp.lunabeam.com`;
    const userPassword = `temp_${claimToken.slice(0, 12)}`;

    console.log('Creating auth user for:', userEmail);

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      user_metadata: {
        first_name: firstName
      },
      email_confirm: true // Auto-confirm email
    });

    if (authError || !authData.user) {
      console.error('Auth user creation failed:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;
    console.log('Created user with ID:', userId);

    // Update supporter relationships to point to the real user
    const { error: supporterUpdateError } = await supabaseAdmin
      .from('supporters')
      .update({ individual_id: userId })
      .eq('individual_id', claimRecord.individual_id);

    if (supporterUpdateError) {
      console.error('Failed to update supporter relationships:', supporterUpdateError);
    }

    // Update the account claim
    const { error: claimUpdateError } = await supabaseAdmin
      .from('account_claims')
      .update({
        status: 'accepted',
        claimed_at: new Date().toISOString(),
        individual_id: userId
      })
      .eq('id', claimRecord.id);

    if (claimUpdateError) {
      console.error('Failed to update claim status:', claimUpdateError);
    }

    // Update profile to reflect claimed status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: firstName,
        onboarding_complete: true, // Skip onboarding since admin already set up
        comm_pref: 'text',
        account_status: 'user_claimed',
        claimed_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) {
      console.error('Failed to update profile:', profileError);
    }

    // Remove provisioner flag
    const { error: provisionerError } = await supabaseAdmin
      .from('supporters')
      .update({ is_provisioner: false })
      .eq('individual_id', userId)
      .eq('supporter_id', claimRecord.provisioner_id);

    if (provisionerError) {
      console.error('Failed to remove provisioner flag:', provisionerError);
    }

    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true
    });

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
    }

    // Generate access token for immediate login
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: userEmail,
      password: userPassword
    });

    if (tokenError || !tokenData) {
      console.error('Failed to generate login token:', tokenError);
      // Don't fail the entire process, just don't provide session URL
    }

    console.log('Successfully claimed account for:', firstName);

    return new Response(
      JSON.stringify({
        success: true,
        firstName: firstName,
        userId: userId,
        email: userEmail,
        password: userPassword,
        sessionUrl: tokenData?.properties?.action_link
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