import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= SAFETY VIOLATION NOTIFICATION =============
async function notifySafetyViolation(
  supabase: any, 
  userId: string, 
  goalTitle: string, 
  layer: string, 
  reason: string
) {
  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, email, is_self_registered')
      .eq('user_id', userId)
      .single();
    
    // Get supporters (if any)
    const { data: supporters } = await supabase
      .from('supporters')
      .select('supporter_id, is_admin')
      .eq('individual_id', userId)
      .eq('is_admin', true);
    
    // Update log with notification status
    await supabase
      .from('safety_violations_log')
      .update({
        compliance_notified: true,
        supporter_notified: supporters && supporters.length > 0,
        user_email: profile?.email
      })
      .eq('user_id', userId)
      .eq('goal_title', goalTitle)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // Send in-app notification to supporters
    if (supporters && supporters.length > 0) {
      for (const supporter of supporters) {
        await supabase.from('notifications').insert({
          user_id: supporter.supporter_id,
          type: 'safety_violation',
          title: '⚠️ Safety Alert',
          message: `${profile?.first_name || 'An individual'} attempted to create a goal that violated safety guidelines. The goal has been blocked.`,
          data: {
            individual_id: userId,
            individual_name: profile?.first_name,
            goal_title: goalTitle,
            layer: layer,
            reason: reason
          }
        });
      }
    }
    
    // Send email to compliance team and supporters
    try {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'safety_violation',
          userId: userId,
          userName: profile?.first_name || 'Unknown',
          userEmail: profile?.email || 'No email',
          goalTitle: goalTitle,
          layer: layer,
          reason: reason,
          supporterIds: supporters?.map(s => s.supporter_id) || []
        }
      });
    } catch (emailError) {
      console.error('Failed to send safety violation email:', emailError);
    }
    
  } catch (error) {
    console.error('Error sending safety violation notification:', error);
    // Don't throw - notification failure shouldn't block the safety response
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      question, 
      mode = 'assist',
      userSnapshot = {},
      currentGoals = [],
      userMessage,
      context 
    } = await req.json();
    
    // Extract user ID from auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    // Get user ID
    const { data: { user } } = await supabase.auth.getUser(token);
    const userId = user?.id;
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`AI Coach request - Mode: ${mode}, Has question: ${!!question}`);

    // ============= LAYER 1: FAST KEYWORD REJECTION =============
    const dangerousKeywords = [
      'kill', 'suicide', 'self-harm', 'self harm', 'cut myself', 'hurt myself',
      'trafficking', 'illegal', 'steal', 'theft', 'fraud', 'scam',
      'cocaine', 'heroin', 'meth', 'methamphetamine', 'weed', 'marijuana', 
      'sell drugs', 'buy drugs', 'drug deal', 'black market',
      'hack', 'bypass security', 'break into', 'weapon', 'bomb', 'gun',
      'sexually explicit', 'porn', 'xxx', 'sex tape',
      'revenge', 'harm someone', 'hurt someone', 'get back at'
    ];

    const combinedInput = `${question || ''} ${userMessage || ''} ${JSON.stringify(context || {})}`.toLowerCase();
    const triggeredKeywords = dangerousKeywords.filter(kw => combinedInput.includes(kw));

    if (triggeredKeywords.length > 0 && userId) {
      console.error('⚠️ LAYER 1 SAFETY VIOLATION:', triggeredKeywords);
      
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseService.from('safety_violations_log').insert({
        user_id: userId,
        violation_layer: 'layer_1_keywords',
        goal_title: question || userMessage || 'Unknown',
        triggered_keywords: triggeredKeywords,
        violation_reason: `Explicit keywords: ${triggeredKeywords.join(', ')}`
      });
      
      await notifySafetyViolation(supabaseService, userId, question || userMessage, 'layer_1_keywords', triggeredKeywords.join(', '));
      
      return new Response(JSON.stringify({ 
        error: "I'm sorry, I cannot process that request. Please try rephrasing your goal, focusing on positive, legal, and healthy outcomes.",
        safety_violation: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For onboarding, use a simpler conversational approach
    if (mode === 'onboarding') {
      const systemPrompt = `SYSTEM INSTRUCTION: CRITICAL SAFETY AND INTEGRITY AGENT

FAILURE PROTOCOL: If any content violates safety rules, output only: [SAFETY_VIOLATION_SIGNAL]

RULE 1: ABSOLUTE EXPLICIT CONTENT REFUSAL
Refuse to engage with: illegal activities, self-harm/violence, prohibited substances, sexually explicit content.

RULE 2: NUANCE AUDIT
Analyze for code words, emojis (🤫💰💊🚬), unethical goals, or high-risk suggestions.

---

You are Lune, a friendly AI assistant helping teenagers and young adults (16-25) get started.

Your job: Have a casual, natural conversation to learn about them - their name, what they're good at, what they're into, and what challenges they face.

Communication style:
- Talk like a supportive friend, not a counselor
- Be genuinely curious about their interests (gaming, music, social media, school, work, hobbies)
- Use language they'd actually use - no corporate speak
- Keep it light and conversational

Rules:
- Ask ONE question at a time
- Build on what they tell you naturally
- Don't repeat questions you've already asked
- Reference their age group's experiences (school stress, social media, part-time jobs, college decisions, etc.)

Current conversation context:
- User's name: ${userSnapshot?.preferred_name || 'not provided yet'}
- Strengths mentioned: ${userSnapshot?.strengths?.join(', ') || 'none yet'}
- Interests mentioned: ${userSnapshot?.interests?.join(', ') || 'none yet'}
- Challenges mentioned: ${userSnapshot?.challenges?.join(', ') || 'none yet'}

Keep it real and relatable to their world.`;

      const userPrompt = `User said: "${question || userMessage}"

Please respond warmly and ask the next helpful question to learn about them.`;

      console.log('Making OpenAI request for onboarding');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 300,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const guidance = data.choices[0].message.content;

      // ============= LAYER 2: SAFETY SIGNAL DETECTION =============
      if (guidance.includes('[SAFETY_VIOLATION_SIGNAL]') && userId) {
        console.error('⚠️ LAYER 2 SAFETY VIOLATION (onboarding)');
        
        const supabaseService = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseService.from('safety_violations_log').insert({
          user_id: userId,
          violation_layer: 'layer_2_generation',
          goal_title: question || userMessage,
          ai_response: guidance,
          violation_reason: 'AI detected nuanced violation during onboarding'
        });
        
        await notifySafetyViolation(supabaseService, userId, question || userMessage, 'layer_2_generation', 'Nuanced violation');
        
        return new Response(JSON.stringify({ 
          error: "I'm sorry, I cannot process that request. Please try rephrasing your goal, focusing on positive, legal, and healthy outcomes.",
          safety_violation: true
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        guidance,
        response_text: guidance,
        mode: 'onboarding',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle step generation requests for any goal
    if (mode === 'assist' && question && (question.includes('Generate') && (question.includes('milestone steps') || question.includes('steps for')))) {
      const stepSystemPrompt = `You are an expert AI that creates specific, actionable steps for any goal.

Your job: Generate 4-6 concrete, goal-specific steps that directly help achieve the stated goal.

CRITICAL RULES:
- Make steps HIGHLY SPECIFIC to the actual goal (never use generic steps like "Break it down" or "Plan first step")
- Each step should be a concrete action someone can immediately take
- Steps should be practical and achievable 
- Use clear, motivating language that relates to the specific goal
- Include brief explanations of WHY each step matters
- Order steps logically (setup → action → tracking/maintenance)

EXAMPLES:

For "Learn Guitar":
- "Choose your first song" (not "Break it down")
- "Set up practice space with guitar stand" 
- "Learn 3 basic chords: G, C, D"
- "Practice chord transitions 10 min daily"
- "Record yourself playing to track progress"

For "Save Money":
- "Set specific savings target amount"
- "Open a separate savings account" 
- "Track expenses for one week"
- "Set up automatic transfer to savings"
- "Find one subscription to cancel"

For "Get Organized":
- "Pick one room/area to focus on first"
- "Get storage containers and labels"
- "Sort items: keep, donate, trash"
- "Create homes for frequently used items"
- "Set 10-minute daily tidying routine"

For "Drink Water":
- "Set daily water goal (8 glasses)"
- "Choose a water bottle to use consistently"
- "Set phone reminders every 2 hours"
- "Start each day with one full glass"
- "Track intake with simple tally marks"

AVOID generic steps like:
- "Break it down"
- "Plan first step" 
- "Take first action"
- "Check your progress"

Return a JSON array of step objects with:
- title: "[specific actionable step related to the goal]"
- notes: Brief explanation of why this step helps achieve the goal
- points: 2-3 (most steps are worth 2-3 points)
- estimated_effort_min: Realistic time estimate in minutes`;

      console.log('Making OpenAI request for goal-specific step generation');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: stepSystemPrompt },
            { role: 'user', content: question }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const guidance = data.choices[0].message.content;

      console.log('Generated goal-specific steps successfully');

      return new Response(JSON.stringify({ 
        guidance,
        response_text: guidance,
        mode: 'assist',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For other modes, use the original structured approach
    const globalSystemPrompt = `SYSTEM INSTRUCTION: CRITICAL SAFETY AND INTEGRITY AGENT

FAILURE PROTOCOL: If any content violates safety rules, output only: [SAFETY_VIOLATION_SIGNAL]

RULE 1: ABSOLUTE EXPLICIT CONTENT REFUSAL
Refuse to engage with: illegal activities, self-harm/violence, prohibited substances, sexually explicit content.

RULE 2: NUANCE AUDIT
Analyze for code words, emojis, unethical goals, or high-risk suggestions.

---

You are Lune, a supportive AI guide for teenagers and young adults aged 16-25.

Communication style:
- Casual but respectful tone - like talking to a friend who gets it
- Use examples from social media, gaming, streaming, school/work life
- Reference things like TikTok trends, Discord servers, Netflix shows, part-time jobs, college stress
- Keep it real - acknowledge that life can be messy and overwhelming
- ANALYZE PROGRESS: Always consider what steps have been completed and what's next in your guidance
- Celebrate small wins and progress, not just perfection

Your vibe:
- Encouraging without being preachy
- Understanding of modern teen/young adult challenges (social media pressure, financial stress, academic/career uncertainty)
- Use relatable analogies (like leveling up in games, building playlists, organizing your phone apps)
- Acknowledge that everyone's path is different

Boundaries:
- Life guidance only — not medical, legal, or emergency advice
- If someone mentions self-harm or crisis: respond with care, suggest 988 Suicide & Crisis Lifeline or Crisis Text Line (text HOME to 741741)
- Keep it age-appropriate and supportive`;

    let modePrompt = `You are in Assist mode. Help users reflect on their progress and work through challenges.

Use examples they can relate to:
- "Like when you're stuck on a level in a game - sometimes you need to try a different approach"
- "Think of it like organizing your Spotify playlists - start with what you know you like"
- "It's like when you're learning a new TikTok dance - break it down move by move"
- "Similar to group projects at school/work - some parts depend on finishing other parts first"

Be supportive and real about the challenges of being their age.`;

    let contextInfo = '';
    if (userSnapshot && Object.keys(userSnapshot).length > 0) {
      contextInfo += `User Info:
- Name: ${userSnapshot.preferred_name || 'Not set'}
- Strengths: ${userSnapshot.strengths?.join(', ') || 'Not specified'}
- Interests: ${userSnapshot.interests?.join(', ') || 'Not specified'}
- Challenges: ${userSnapshot.challenges?.join(', ') || 'Not specified'}

`;
    }

    if (currentGoals?.length > 0) {
      contextInfo += `Current Goals:
${currentGoals.map((goal: any) => {
        let goalInfo = `- ${goal.title} (${goal.status})`;
        if (goal.steps) {
          const completedSteps = goal.steps.filter((step: any) => step.status === 'done');
          const totalSteps = goal.steps.length;
          goalInfo += ` - Progress: ${completedSteps.length}/${totalSteps} steps completed`;
          if (completedSteps.length > 0) {
            goalInfo += `\n  Recently completed: ${completedSteps.slice(-3).map((s: any) => s.title).join(', ')}`;
          }
          const nextSteps = goal.steps.filter((step: any) => step.status === 'not_started').slice(0, 2);
          if (nextSteps.length > 0) {
            goalInfo += `\n  Up next: ${nextSteps.map((s: any) => s.title).join(', ')}`;
          }
        }
        return goalInfo;
      }).join('\n')}

`;
    }

    const userPrompt = `${contextInfo}User message: "${question || userMessage}"

Please respond supportively according to your role as Lune.`;

    console.log('Making OpenAI request for general guidance');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: globalSystemPrompt },
          { role: 'system', content: modePrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const guidance = data.choices[0].message.content;

    // ============= LAYER 2: SAFETY SIGNAL DETECTION =============
    if (guidance.includes('[SAFETY_VIOLATION_SIGNAL]') && userId) {
      console.error('⚠️ LAYER 2 SAFETY VIOLATION (general)');
      
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseService.from('safety_violations_log').insert({
        user_id: userId,
        violation_layer: 'layer_2_generation',
        goal_title: question || userMessage,
        ai_response: guidance,
        violation_reason: 'AI detected nuanced violation during guidance'
      });
      
      await notifySafetyViolation(supabaseService, userId, question || userMessage, 'layer_2_generation', 'Nuanced violation');
      
      return new Response(JSON.stringify({ 
        error: "I'm sorry, I cannot process that request. Please try rephrasing your goal, focusing on positive, legal, and healthy outcomes.",
        safety_violation: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Generated guidance successfully');

    return new Response(JSON.stringify({
      guidance,
      response_text: guidance,
      mode,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-coach:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate guidance',
      details: error.message,
      response_text: "I'm having trouble right now. Let me know if you'd like to try again or take a break."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});