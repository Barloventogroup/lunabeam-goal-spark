import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';




const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'check_in' | 'step_complete' | 'goal_created' | 'goal_assigned';
  userId: string;
  goalId?: string;
  stepId?: string;
  substepId?: string;
  supporterIds?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, userId, goalId, stepId, substepId, supporterIds }: NotificationRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', userId)
      .single();

    const userName = userProfile?.first_name || 'User';

    // Get supporters if not provided
    let supporters = [];
    if (supporterIds && supporterIds.length > 0) {
      const { data } = await supabase
        .from('supporters')
        .select(`
          supporter_id,
          profiles!supporters_supporter_id_fkey(first_name)
        `)
        .in('supporter_id', supporterIds);
      supporters = data || [];
    } else {
      const { data } = await supabase
        .from('supporters')
        .select(`
          supporter_id,
          profiles!supporters_supporter_id_fkey(first_name)
        `)
        .eq('individual_id', userId);
      supporters = data || [];
    }

    // Get goal information if provided
    let goalInfo = null;
    if (goalId) {
      const { data } = await supabase
        .from('goals')
        .select('title, description')
        .eq('id', goalId)
        .single();
      goalInfo = data;
    }

    // Get step information if provided
    let stepInfo = null;
    if (stepId) {
      const { data } = await supabase
        .from('steps')
        .select('title, notes')
        .eq('id', stepId)
        .single();
      stepInfo = data;
    }

    // Get substep information if provided
    let substepInfo = null;
    if (substepId) {
      const { data } = await supabase
        .from('substeps')
        .select('title, description')
        .eq('id', substepId)
        .single();
      substepInfo = data;
    }

    // Generate email content based on notification type
    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'check_in':
        subject = `${userName} started working on a step`;
        const itemName = substepInfo?.title || stepInfo?.title || 'a step';
        htmlContent = `
          <h2>📚 ${userName} has checked in!</h2>
          <p><strong>${userName}</strong> has started working on:</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2563eb;">${itemName}</h3>
            ${goalInfo ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Goal:</strong> ${goalInfo.title}</p>` : ''}
            ${substepInfo?.description || stepInfo?.notes ? 
              `<p style="margin: 5px 0; color: #6b7280;">${substepInfo?.description || stepInfo?.notes}</p>` : ''}
          </div>
          <p>Keep encouraging ${userName} on their journey! 🌟</p>
        `;
        break;

      case 'step_complete':
        subject = `${userName} completed a step!`;
        const completedItem = substepInfo?.title || stepInfo?.title || 'a step';
        htmlContent = `
          <h2>🎉 Great progress from ${userName}!</h2>
          <p><strong>${userName}</strong> has completed:</p>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin: 0 0 10px 0; color: #16a34a;">✅ ${completedItem}</h3>
            ${goalInfo ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Goal:</strong> ${goalInfo.title}</p>` : ''}
            ${substepInfo?.description || stepInfo?.notes ? 
              `<p style="margin: 5px 0; color: #6b7280;">${substepInfo?.description || stepInfo?.notes}</p>` : ''}
          </div>
          <p>Celebrate this achievement with ${userName}! 🎊</p>
        `;
        break;

      case 'goal_created':
        subject = `New goal created for ${userName}`;
        htmlContent = `
          <h2>🎯 New Goal Created</h2>
          <p>A new goal has been created for <strong>${userName}</strong>:</p>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #d97706;">${goalInfo?.title || 'New Goal'}</h3>
            ${goalInfo?.description ? `<p style="margin: 5px 0; color: #6b7280;">${goalInfo.description}</p>` : ''}
          </div>
          <p>Support ${userName} as they work towards this new goal! 💪</p>
        `;
        break;

      case 'goal_assigned':
        subject = `Goal assigned to ${userName}`;
        htmlContent = `
          <h2>📋 Goal Assignment</h2>
          <p>A goal has been assigned to <strong>${userName}</strong>:</p>
          <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #0284c7;">
            <h3 style="margin: 0 0 10px 0; color: #0369a1;">${goalInfo?.title || 'Assigned Goal'}</h3>
            ${goalInfo?.description ? `<p style="margin: 5px 0; color: #6b7280;">${goalInfo.description}</p>` : ''}
          </div>
          <p>Help ${userName} get started on this important goal! 🚀</p>
        `;
        break;
    }

    // Send emails to all supporters
    const emailPromises = supporters.map(async (supporter: any) => {
      // Get supporter's email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(supporter.supporter_id);
      
      if (!authUser.user?.email) {
        console.log(`No email found for supporter ${supporter.supporter_id}`);
        return null;
      }

      const supporterName = supporter.profiles?.first_name || 'there';
      
      const personalizedContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Hi ${supporterName},</p>
          ${htmlContent}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            You're receiving this because you're supporting ${userName} on their goals.
            <br>Keep up the great work! 💙
          </p>
        </div>
      `;

      const apiKey = Deno.env.get('RESEND_API_KEY');
      if (!apiKey) {
        console.error('RESEND_API_KEY not configured');
        return null;
      }
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM_EMAIL') || 'LuneBeam <notifications@resend.dev>',
          to: [authUser.user.email],
          subject,
          html: personalizedContent,
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Resend HTTP error:', resp.status, errText);
        return null;
      }
      return await resp.json();
    });

    const results = await Promise.allSettled(emailPromises.filter(Boolean));
    
    console.log(`Sent ${results.length} notification emails for ${type} event`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: results.filter(r => r.status === 'fulfilled').length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error sending notification emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});