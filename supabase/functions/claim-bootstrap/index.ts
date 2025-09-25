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

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
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

    const emailLog = email ? email : '(none)';
    console.log(`🔍 Validating claim token: ${token} for email: ${emailLog}`);

    // Validate claim token and get claim details (email optional)
    let query = supabaseAdmin
      .from('account_claims')
      .select('*')
      .eq('claim_token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    if (email) {
      query = query.eq('invitee_email', email.toLowerCase().trim());
    }

    const { data: claim, error: claimError } = await query.single();

    if (claimError || !claim) {
      console.log('❌ Invalid or expired claim token');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired claim token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Valid claim found for individual: ${claim.individual_id}`);

    // Determine email to use
    const emailToUse = (email?.toLowerCase().trim()) || (claim.invitee_email?.toLowerCase().trim());
    if (!emailToUse) {
      console.error('❌ No invitee email available on claim');
      return new Response(
        JSON.stringify({ error: 'No invitee email associated with this claim' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate temporary password
    const tempPassword = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    // Ensure there's a valid auth user to update; if missing, create and remap
    let userIdToUse = claim.individual_id as string;

    // Check if auth user exists
    const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userIdToUse);

    if (getUserError || !existingUser?.user) {
      console.warn(`⚠️ Auth user ${userIdToUse} not found. Creating a new user and remapping data...`, getUserError);

      // Create a new auth user
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: emailToUse,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          ...claim,
          temp_password_set: true,
          temp_password_expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        }
      });

      if (createError || !created?.user?.id) {
        console.error('❌ Failed to create auth user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userIdToUse = created.user.id;
      console.log(`✅ Created new auth user: ${userIdToUse}. Remapping related records...`);

      // Remap profile to new user id and update status
      const { error: remapProfileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: userIdToUse,
          email: emailToUse,
          account_status: 'user_claimed',
          authentication_status: 'pending',
          first_name: claim.first_name ?? 'User',
          password_set: false,
          onboarding_complete: true, // Skip onboarding since admin already configured account
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (remapProfileError) console.error('❌ Failed to upsert profile:', remapProfileError);
      else console.log('✅ Profile configured for claimed account with onboarding bypassed');

      // Remap supporters (individual side)
      const { error: remapSupportersIndError } = await supabaseAdmin
        .from('supporters')
        .update({ individual_id: userIdToUse })
        .eq('individual_id', claim.individual_id);
      if (remapSupportersIndError) console.error('❌ Failed to remap supporters (individual):', remapSupportersIndError);

      // Remap supporters (supporter side) - best effort
      const { error: remapSupportersSupError } = await supabaseAdmin
        .from('supporters')
        .update({ supporter_id: userIdToUse })
        .eq('supporter_id', claim.individual_id);
      if (remapSupportersSupError) console.warn('⚠️ Failed to remap supporters (supporter side) - may be expected:', remapSupportersSupError);

      // Remap this specific claim to point to the new user id
      const { error: remapClaimError } = await supabaseAdmin
        .from('account_claims')
        .update({ individual_id: userIdToUse })
        .eq('id', claim.id);
      if (remapClaimError) console.error('❌ Failed to remap claim record:', remapClaimError);

    } else {
      // Auth user exists - update with confirmed email and temporary password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userIdToUse,
        {
          email: emailToUse,
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

      // Update profile status for existing user
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: userIdToUse,
          email: emailToUse,
          account_status: 'user_claimed',
          authentication_status: 'pending',
          first_name: claim.first_name ?? 'User',
          onboarding_complete: true, // Skip onboarding since admin already configured account
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (profileError) {
        console.error('❌ Failed to upsert profile:', profileError);
      } else {
        console.log('✅ Existing profile updated for claimed account with onboarding bypassed');
      }
    }

    console.log(`🎉 Claim bootstrap completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        email: emailToUse,
        tempPassword,
        individualId: userIdToUse,
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