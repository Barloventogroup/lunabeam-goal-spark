import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return new Response(
        JSON.stringify({ error: 'Token and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log(`🔍 Validating claim token: ${token} for email: ${email}`);

    // Validate claim token and get claim details
    const { data: claim, error: claimError } = await supabaseAdmin
      .from('account_claims')
      .select('*')
      .eq('claim_token', token)
      .eq('invitee_email', email.toLowerCase().trim())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (claimError || !claim) {
      console.log('❌ Invalid or expired claim token');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired claim token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Valid claim found for individual: ${claim.individual_id}`);

    // Generate temporary password
    const tempPassword = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    // Update the existing auth user with confirmed email and temporary password
    const { data: authUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      claim.individual_id,
      {
        email: email.toLowerCase().trim(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          ...claim,
          temp_password_set: true,
          temp_password_expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        }
      }
    );

    if (updateError) {
      console.error('❌ Failed to update auth user:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Auth user updated successfully`);

    // Update profile status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        email: email.toLowerCase().trim(),
        account_status: 'user_claimed',
        authentication_status: 'temp_password',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', claim.individual_id);

    if (profileError) {
      console.error('❌ Failed to update profile:', profileError);
    }

    console.log(`🎉 Claim bootstrap completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        email: email.toLowerCase().trim(),
        tempPassword,
        individualId: claim.individual_id,
        firstName: claim.first_name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Claim bootstrap error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});