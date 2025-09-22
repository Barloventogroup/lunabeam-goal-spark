import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimRequest {
  claimToken: string;
  passcode: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claimToken, passcode, password }: ClaimRequest = await req.json();

    if (!claimToken || !passcode || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing claim token, passcode, or password' }),
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

    // Get email from individual profile or generate one
    let userEmail;
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('user_id', claimRecord.individual_id)
      .single();
    
    if (profileData?.email) {
      userEmail = profileData.email;
    } else {
      // Generate email if none exists
      const firstName = claimRecord.first_name || 'User';
      userEmail = `${firstName.toLowerCase().replace(/\s+/g, '')}+${claimToken.slice(0, 8)}@temp.lunabeam.com`;
    }

    console.log('Creating auth user for:', userEmail);

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: password, // Use the password provided by the user
      user_metadata: {
        first_name: claimRecord.first_name || 'User'
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
    } else {
      console.log('Migrated supporter relationships from placeholder to real user');
    }

    // Safety net: fix any reversed relationship that might exist (new user as supporter of provisioner)
    const { data: reversedRel, error: reversedErr } = await supabaseAdmin
      .from('supporters')
      .select('id, permission_level, specific_goals')
      .eq('supporter_id', userId)
      .eq('individual_id', claimRecord.provisioner_id)
      .maybeSingle();

    if (reversedErr) {
      console.warn('Error checking for reversed relationship:', reversedErr);
    }
    if (reversedRel) {
      console.log('Found reversed relationship, correcting direction');
      // Ensure correct relationship exists
      const { data: hasCorrect } = await supabaseAdmin
        .from('supporters')
        .select('id')
        .eq('individual_id', userId)
        .eq('supporter_id', claimRecord.provisioner_id)
        .maybeSingle();
      if (!hasCorrect) {
        const { error: createCorrectErr } = await supabaseAdmin
          .from('supporters')
          .insert({
            individual_id: userId,
            supporter_id: claimRecord.provisioner_id,
            role: 'supporter',
            permission_level: 'admin',
            is_admin: true,
            is_provisioner: false,
            specific_goals: reversedRel.specific_goals || []
          });
        if (createCorrectErr) console.error('Failed to create corrected relationship:', createCorrectErr);
      }
      const { error: deleteReversedErr } = await supabaseAdmin
        .from('supporters')
        .delete()
        .eq('id', reversedRel.id);
      if (deleteReversedErr) {
        console.error('Failed to delete reversed relationship:', deleteReversedErr);
      } else {
        console.log('Deleted reversed relationship successfully');
      }
    }

    // If no existing supporter relationships were found to migrate, 
    // create the basic supporter relationship with the provisioner
    const { data: existingSupporter } = await supabaseAdmin
      .from('supporters')
      .select('id')
      .eq('individual_id', userId)
      .limit(1)
      .maybeSingle();
    
    if (!existingSupporter) {
      console.log('No existing supporter found, creating relationship with provisioner');
      const { error: createSupporterError } = await supabaseAdmin
        .from('supporters')
        .insert({
          individual_id: userId,
          supporter_id: claimRecord.provisioner_id,
          role: 'supporter',
          permission_level: 'admin',
          is_admin: true,
          is_provisioner: false // Remove provisioner flag since account is now claimed
        });
      
      if (createSupporterError) {
        console.error('Failed to create supporter relationship:', createSupporterError);
      } else {
        console.log('Successfully created supporter relationship');
      }
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
        first_name: claimRecord.first_name || 'User',
        email: userEmail, // Store the email in profile
        onboarding_complete: true, // Skip onboarding since admin already set up
        comm_pref: 'text',
        account_status: 'user_claimed',
        claimed_at: new Date().toISOString(),
        created_by_supporter: claimRecord.provisioner_id // Keep linkage to the provisioner for admin views
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

    console.log('Successfully claimed account for:', claimRecord.first_name || 'User');

    return new Response(
      JSON.stringify({
        success: true,
        firstName: claimRecord.first_name || 'User',
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