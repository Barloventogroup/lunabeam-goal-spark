import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';




const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'check_in' | 'step_complete' | 'goal_created' | 'goal_assigned' | 'goal_completed' | 'chat_locked' | 'safety_violation';
  userId: string;
  goalId?: string;
  stepId?: string;
  substepId?: string;
  supporterIds?: string[];
  userName?: string;
  userEmail?: string;
  goalTitle?: string;
  layer?: string;
  reason?: string;
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
    console.log('Fetching supporters for user:', userId, 'type:', type);
    
    if (supporterIds && supporterIds.length > 0) {
      console.log('Using provided supporter IDs:', supporterIds);
      const { data, error } = await supabase
        .from('supporters')
        .select('supporter_id')
        .in('supporter_id', supporterIds);
      
      if (error) {
        console.error('Error fetching specific supporters:', error);
      }
      supporters = data || [];
    } else {
      console.log('Fetching all supporters for individual:', userId);
      const { data, error } = await supabase
        .from('supporters')
        .select('supporter_id')
        .eq('individual_id', userId)
        .eq('is_admin', true);
      
      if (error) {
        console.error('Error fetching all supporters:', error);
      }
      supporters = data || [];
    }
    
    console.log('Found supporters:', supporters?.length || 0);

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
            ${goalInfo?.description ? `<p style=\"margin: 5px 0; color: #6b7280;\">${goalInfo.description}</p>` : ''}
          </div>
          <p>Help ${userName} get started on this important goal! 🚀</p>
        `;
        break;

      case 'goal_completed':
        subject = `${userName} completed a goal!`;
        htmlContent = `
          <h2>🏁 Goal Completed</h2>
          <p><strong>${userName}</strong> has completed the goal:</p>
          <div style="background: #eef2ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #6366f1;">
            <h3 style="margin: 0 0 10px 0; color: #4f46e5;">${goalInfo?.title || 'A Goal'}</h3>
            ${goalInfo?.description ? `<p style=\"margin: 5px 0; color: #6b7280;\">${goalInfo.description}</p>` : ''}
          </div>
          <p>Celebrate this milestone with ${userName}! 🎉</p>
        `;
        break;

      case 'chat_locked':
        subject = `${userName} needs assistance with a step`;
        htmlContent = `
          <h2>🔒 Coaching Session Locked</h2>
          <p><strong>${userName}</strong> has reached the coaching limit on:</p>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #d97706;">${stepInfo?.title || 'A step'}</h3>
            ${goalInfo ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Goal:</strong> ${goalInfo.title}</p>` : ''}
          </div>
          <p>${userName} may need hands-on support to complete this task. Consider checking in with them! 💛</p>
        `;
        break;

      case 'safety_violation':
        const { userName: safetyUserName, userEmail, goalTitle, layer, reason } = req.body as any;
        subject = `[SAFETY ALERT] Violation detected - ${layer}`;
        
        // Email for compliance team
        const complianceHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Safety Violation Detected</h2>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626;">
              <p><strong>User:</strong> ${safetyUserName || 'Unknown'} (${userEmail || 'No email'})</p>
              <p><strong>User ID:</strong> ${userId}</p>
              <p><strong>Layer:</strong> ${layer}</p>
              <p><strong>Goal Title:</strong> ${goalTitle}</p>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #d97706;">This requires manual review. Please check the safety_violations_log table for full details.</p>
          </div>
        `;
        
        // Send to compliance team
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'LunaBeam Safety <safety@lunabeam.app>',
            to: ['lunabeambeta@gmail.com'],
            subject: subject,
            html: complianceHtml
          })
        });
        
        if (!emailResponse.ok) {
          console.error('Failed to send compliance email:', await emailResponse.text());
        }
        
        // Send notification to supporters with different message
        htmlContent = `
          <h2 style="color: #d97706;">⚠️ Safety Alert</h2>
          <p><strong>${safetyUserName || userName}</strong> attempted to create a goal that violated safety guidelines.</p>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0;"><strong>Goal:</strong> ${goalTitle}</p>
            <p style="margin: 5px 0; color: #6b7280;">The goal has been blocked automatically by our safety system.</p>
          </div>
          <p>Please check in with ${safetyUserName || userName} if you have concerns. 💛</p>
        `;
        break;
    }

    // Send emails to all supporters
    const emailPromises = supporters.map(async (supporter: any) => {
      // Get supporter's email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(supporter.supporter_id);
      if (!authUser.user?.email) {
        console.log(`No email found for supporter ${supporter.supporter_id}`);
        return false;
      }

      const supporterName = 'there';
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
        return false;
      }

      const sendWithFrom = async (from: string) => {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from,
            to: [authUser.user.email],
            subject,
            html: personalizedContent,
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.error('Resend HTTP error:', resp.status, errText);
          return { ok: false, errText } as const;
        }
        return { ok: true } as const;
      };

      const primaryFrom = Deno.env.get('RESEND_FROM_EMAIL') || 'LuneBeam <notifications@resend.dev>';
      let result = await sendWithFrom(primaryFrom);

      // Retry with resend.dev sender if domain not verified
      if (!result.ok && (result.errText?.includes('domain is not verified') || result.errText?.includes('domain') )) {
        console.log('Retrying email send with resend.dev sender');
        result = await sendWithFrom('LuneBeam <onboarding@resend.dev>');
      }

      return result.ok;
    });

    const results = await Promise.all(emailPromises);
    const successes = results.filter(Boolean).length;
    console.log(`Email notifications: ${successes}/${results.length} sent for ${type} event`);

    return new Response(
      JSON.stringify({ 
        success: successes > 0,
        emailsSent: successes
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