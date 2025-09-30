import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { userId, count = 15 } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    const notifications = [];
    const notificationTypes = [
      { type: 'check_in', title: '📚 Started Working', message: 'User checked in and started working on a step' },
      { type: 'step_complete', title: 'Step Completed! 🎉', message: 'User completed a step in their goal' },
      { type: 'goal_complete', title: 'Goal Completed! 🎯', message: 'User completed their entire goal' },
      { type: 'invite_accepted', title: 'Supporter Joined!', message: 'A new supporter accepted the invitation' },
      { type: 'approval_request', title: 'New Supporter Request', message: 'Someone wants to invite a new supporter' }
    ];

    for (let i = 0; i < count; i++) {
      const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      notifications.push({
        user_id: userId,
        type: randomType.type,
        title: randomType.title,
        message: `${randomType.message} (Test notification #${i + 1})`,
        data: { test: true, index: i + 1 },
        created_at: new Date(Date.now() - (i * 3600000)).toISOString() // Spread out over hours
      });
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (error) {
      throw error;
    }

    console.log(`Created ${count} test notifications for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${count} test notifications`,
        count: notifications.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating test notifications:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});