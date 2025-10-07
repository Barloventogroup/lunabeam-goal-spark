import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= HELPER FUNCTIONS =============

// Get or create cooldown state for user/step
async function getCooldownState(supabase: any, userId: string, stepId: string) {
  const { data, error } = await supabase
    .from('chat_cooldown_state')
    .select('*')
    .eq('user_id', userId)
    .eq('step_id', stepId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching cooldown state:', error);
  }
  
  return data || {
    user_id: userId,
    step_id: stepId,
    irrelevance_count: 0,
    cooldown_level: 0,
    cooldown_attempts_total: 0,
    is_locked: false,
    reflection_submitted: false
  };
}

// Update cooldown state
async function updateCooldownState(supabase: any, state: any) {
  const { error } = await supabase
    .from('chat_cooldown_state')
    .upsert({
      ...state,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,step_id'
    });
  
  if (error) {
    console.error('Error updating cooldown state:', error);
  }
}

// Log cooldown event for analytics
async function logCooldownEvent(
  supabase: any, 
  userId: string, 
  stepId: string, 
  goalId: string | null,
  eventType: string, 
  metadata?: any
) {
  await supabase
    .from('cooldown_event_log')
    .insert({
      user_id: userId,
      step_id: stepId,
      goal_id: goalId,
      event_type: eventType,
      metadata: metadata || {}
    });
}

// Get user authentication and profile
async function getUserContext(supabase: any, authHeader: string | null) {
  if (!authHeader) return null;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, is_self_registered, first_name')
      .eq('user_id', user.id)
      .single();
    
    return { user, profile };
  } catch (e) {
    console.error('Error getting user context:', e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Raw request received');
    let requestBody: any = {};
    try {
      requestBody = await req.json();
    } catch (_err) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { step, goal, userMessage, conversationHistory = [], action } = requestBody;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user context
    const authHeader = req.headers.get('authorization');
    const userContext = await getUserContext(supabase, authHeader);
    
    if (!userContext) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { user, profile } = userContext;
    const userId = user.id;
    const isSelfRegisteredAdmin = profile?.is_self_registered === true && profile?.user_type === 'admin';

    // ============= HANDLE SPECIAL ACTIONS =============
    
    // SUBMIT REFLECTION ACTION
    if (action === 'submit_reflection') {
      const { reflection_q1, reflection_q2, stepId } = requestBody;
      
      if (!reflection_q1 || !reflection_q2 || !stepId) {
        return new Response(
          JSON.stringify({ error: 'Missing reflection data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cooldownState = await getCooldownState(supabase, userId, stepId);
      
      // Generate reframing statement using OpenAI
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      const reframingPrompt = `Based on the user's reflection, generate a ONE-SENTENCE supportive reframing statement that helps them re-engage with the task.

**User's Reflections:**
Q1 (What felt hardest): ${reflection_q1}
Q2 (What would you change): ${reflection_q2}

**Current Task:**
Goal: ${goal?.title || 'Current goal'}
Step: ${step?.title || 'Current step'}

Generate a brief, actionable, supportive statement (max 30 words).`;

      const reframingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini-2025-04-14',
          messages: [{ role: 'user', content: reframingPrompt }],
          max_completion_tokens: 100
        })
      });
      
      const reframingData = await reframingResponse.json();
      const reframingStatement = reframingData.choices[0].message.content.trim();
      
      await updateCooldownState(supabase, {
        ...cooldownState,
        reflection_q1,
        reflection_q2,
        reflection_submitted: true,
        reframing_statement: reframingStatement
      });
      
      await logCooldownEvent(supabase, userId, stepId, goal?.id, 'reflection_submitted', {
        reflection_q1,
        reflection_q2,
        reframing_statement: reframingStatement
      });
      
      return new Response(JSON.stringify({
        response: reframingStatement,
        classification: 'REFLECTION_COMPLETE',
        can_unlock: true,
        reframing_statement: reframingStatement
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UNLOCK CHAT ACTION
    if (action === 'unlock_chat') {
      const { stepId } = requestBody;
      const cooldownState = await getCooldownState(supabase, userId, stepId);
      
      await updateCooldownState(supabase, {
        ...cooldownState,
        is_locked: false,
        cooldown_level: 0,
        cooldown_until: null,
        irrelevance_count: 0,
        cooldown_attempts_total: 0,
        unlocked_at: new Date().toISOString()
      });
      
      await logCooldownEvent(supabase, userId, stepId, goal?.id, 'chat_unlocked');
      
      return new Response(JSON.stringify({
        response: 'Chat unlocked! You can now continue with your task.',
        classification: 'UNLOCKED'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============= NORMAL CHAT FLOW =============

    if (!step || !goal || !userMessage) {
      console.error('Missing required fields:', { step: !!step, goal: !!goal, userMessage: !!userMessage });
      return new Response(JSON.stringify({ error: 'Missing required fields: step, goal, or userMessage' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get cooldown state
    const cooldownState = await getCooldownState(supabase, userId, step.id);

    // ENFORCE PERSISTENT LOCK
    if (cooldownState.is_locked && !cooldownState.reflection_submitted) {
      if (isSelfRegisteredAdmin) {
        return new Response(JSON.stringify({
          response: `This task is proving to be complex. We need to reset the plan.\n\nBefore we continue, please reflect on these questions:\n\n**Q1: What felt the hardest in the last 5 minutes?**\n\n**Q2: If you could change one thing about the original Micro-Step, what would it be?**`,
          classification: 'REQUIRES_REFLECTION',
          is_locked: true,
          lock_reason: cooldownState.lock_reason || 'Multiple decomposition attempts'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else {
        // Notify supporters
        const { data: supporters } = await supabase
          .from('supporters')
          .select('supporter_id, profiles!supporters_supporter_id_fkey(first_name)')
          .eq('individual_id', userId)
          .eq('is_admin', true);
        
        if (supporters && supporters.length > 0) {
          for (const supporter of supporters) {
            await supabase.from('notifications').insert({
              user_id: supporter.supporter_id,
              type: 'chat_locked',
              title: '🔒 Chat Session Locked',
              message: `${profile.first_name} has reached the coaching limit on step "${step.title}". They may need hands-on support.`,
              data: {
                individual_id: userId,
                individual_name: profile.first_name,
                step_id: step.id,
                step_title: step.title,
                goal_id: goal.id,
                goal_title: goal.title
              }
            });
          }
          
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'chat_locked',
              userId: userId,
              stepId: step.id,
              goalId: goal.id,
              supporterIds: supporters.map((s: any) => s.supporter_id)
            }
          });
        }
        
        return new Response(JSON.stringify({
          response: `This step might be too complex right now. It is time for a Supporter Check-in. Your plan has been paused.\n\nA notification has been sent to your supporter.`,
          classification: 'SUPPORTER_REQUIRED',
          is_locked: true,
          lock_reason: cooldownState.lock_reason || 'Multiple decomposition attempts'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ENFORCE ACTIVE COOLDOWN (1-min or 5-min)
    if (cooldownState.cooldown_until && new Date(cooldownState.cooldown_until) > new Date()) {
      const secondsRemaining = Math.ceil((new Date(cooldownState.cooldown_until).getTime() - Date.now()) / 1000);
      const minutesRemaining = Math.ceil(secondsRemaining / 60);
      
      let cooldownMessage = '';
      if (cooldownState.cooldown_level === 1) {
        cooldownMessage = `We've had a few questions outside of the goal, and that means we might be getting distracted. I need to terminate this session.\n\nPlease take ${secondsRemaining} seconds to look at your Micro-Step on the screen and try the action. I'll be back here in 1 minute if you're ready to focus on the task.`;
      } else if (cooldownState.cooldown_level === 2) {
        cooldownMessage = `Time for a quick physical reset. Step away, stretch, and come back in ${minutesRemaining} minutes after trying the step again.\n\nThis cooldown helps you refocus and prevents burnout.`;
      }
      
      return new Response(JSON.stringify({
        response: cooldownMessage,
        classification: 'COOLDOWN_ACTIVE',
        cooldown_until: cooldownState.cooldown_until,
        cooldown_level: cooldownState.cooldown_level,
        seconds_remaining: secondsRemaining
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Step assistance request:', { 
      stepId: step?.id, 
      goalId: goal?.id, 
      userMessage: typeof userMessage === 'string' ? userMessage.substring(0, 100) : ''
    });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    let progressContext = '';
    try {
      const { data: allSteps } = await supabase
        .from('steps')
        .select('title, status, notes')
        .eq('goal_id', goal.id)
        .order('order_index');
      
      if (allSteps) {
        const completedSteps = allSteps.filter((s: any) => s.status === 'done');
        const remainingSteps = allSteps.filter((s: any) => s.status !== 'done');
        
        progressContext = `\nGOAL PROGRESS CONTEXT:\n- Completed steps (${completedSteps.length}): ${completedSteps.slice(-3).map((s: any) => s.title).join(', ')}\n- Remaining steps (${remainingSteps.length}): ${remainingSteps.slice(0, 3).map((s: any) => s.title).join(', ')}\n- Current step position: ${allSteps.findIndex((s: any) => s.title === step.title) + 1} of ${allSteps.length}\n`;
      }
    } catch (error) {
      console.log('Could not fetch progress context:', error);
    }

    // CONTEXTUAL GATEKEEPER: Classify user intent before processing
    const classificationPrompt = `You are a contextual classifier.

FIXED CONTEXT:
- Goal: "${goal.title}"
- Current Step: "${step.title}"
- Original Barrier: ${goal.barrier_1 || 'Planning/Organization'}

CONVERSATION HISTORY:
${conversationHistory.slice(-3).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

USER'S LATEST QUERY: "${userMessage}"

Classify this query as ONE of:
- RELEVANT: Question is about the current step, goal, or how to complete it
- UNRELATED: General question unrelated to the goal (weather, jokes, trivia, random topics)
- GOAL_DRIFT: User wants to change, abandon, or switch goals

Respond with ONLY the classification word (RELEVANT, UNRELATED, or GOAL_DRIFT).`;

    console.log('Running classification check...');
    const classificationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [{ role: 'user', content: classificationPrompt }],
        max_completion_tokens: 10,
      }),
    });

    if (!classificationResponse.ok) {
      console.error('Classification API error:', await classificationResponse.text());
      throw new Error(`Classification API error: ${classificationResponse.status}`);
    }

    const classificationData = await classificationResponse.json();
    const classification = classificationData.choices?.[0]?.message?.content?.trim().toUpperCase() || 'RELEVANT';
    console.log('Classification result:', classification);

    // Handle UNRELATED queries - Increment irrelevance counter
    if (classification === 'UNRELATED') {
      const newIrrelevanceCount = cooldownState.irrelevance_count + 1;
      
      let redirectResponse = '';
      let newCooldownLevel = cooldownState.cooldown_level;
      let cooldownUntil = null;
      let eventType = '';
      
      if (newIrrelevanceCount === 1) {
        redirectResponse = `That's a fun question! I'm here to help you focus on "${step.title}" right now. Let's stick to the task at hand.`;
        eventType = 'unrelated_warning_1';
      } else if (newIrrelevanceCount === 2) {
        redirectResponse = `I'm strictly focused on making your goal successful. Please ask me a question about "${step.title}".`;
        eventType = 'unrelated_warning_2';
      } else if (newIrrelevanceCount >= 3) {
        redirectResponse = `We've had a few questions outside of the goal, and that means we might be getting distracted. I need to terminate this session.\n\nPlease take 60 seconds to look at your Micro-Step on the screen and try the action. I'll be back here in 1 minute if you're ready to focus on the task.`;
        newCooldownLevel = 1;
        cooldownUntil = new Date(Date.now() + 60 * 1000).toISOString();
        eventType = 'cooldown_1min_triggered';
      }
      
      await updateCooldownState(supabase, {
        ...cooldownState,
        irrelevance_count: newIrrelevanceCount,
        last_unrelated_at: new Date().toISOString(),
        cooldown_level: newCooldownLevel,
        cooldown_until: cooldownUntil,
        cooldown_attempts_total: newCooldownLevel > cooldownState.cooldown_level ? 
          cooldownState.cooldown_attempts_total + 1 : cooldownState.cooldown_attempts_total
      });
      
      await logCooldownEvent(supabase, userId, step.id, goal.id, eventType, {
        irrelevance_count: newIrrelevanceCount,
        user_message: userMessage
      });
      
      return new Response(JSON.stringify({
        response: redirectResponse,
        suggestedSteps: [],
        classification: 'UNRELATED',
        irrelevance_count: newIrrelevanceCount,
        cooldown_until: cooldownUntil
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Handle GOAL_DRIFT - offer to exit to Goals Wizard
    if (classification === 'GOAL_DRIFT') {
      const goalDriftResponse = `I see you want to change your goal! That's totally valid.

To make sure your new plan is set up for success, we need to restart the Goals Wizard to define:
- Your new goal and motivation
- Potential barriers
- Schedule and timing

Would you like to exit this coaching session and start fresh with a new goal?`;
      
      return new Response(JSON.stringify({
        response: goalDriftResponse,
        suggestedSteps: [],
        classification: 'GOAL_DRIFT',
        requiresGoalReset: true
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // If RELEVANT, proceed with normal coaching logic
    // Build context for the AI (avoid nested template literals)
    const isSubstep = !!(step.explainer && String(step.explainer).includes('This is a substep of'));

    const modeLine = isSubstep
      ? `SUBSTEP MODE: Only help with \"${step.title}\" - do not suggest breaking it down further or creating additional substeps`
      : `MAIN STEP MODE: Focus on \"${step.title}\" - may suggest substeps if needed`;

    const guidanceBlock = isSubstep
      ? `\nSUBSTEP GUIDANCE RULES:\n- DO NOT suggest breaking \"${step.title}\" into smaller pieces\n- Provide direct, actionable advice using Executive Function scaffolding principles\n- Keep responses under 100 words\n- If they're stuck, suggest a trivial activation cue (< 15 sec physical action) followed by a timed work sprint\n`
      : `\nMAIN STEP GUIDANCE RULES:\n
THEORETICAL FRAMEWORK (CRITICAL):
When suggesting sub-steps, they MUST follow the Executive Function scaffolding model (exactly 3 steps):

**3-STEP STRUCTURE (MANDATORY):**
1. PREPARATION (before work session) - Gather materials, set up workspace (no time estimate needed)
2. ACTIVATION CUE (< 15 seconds) - Trivial physical action at specific time: touch, open, tap, grab, place, hold
   - BANNED VERBS: search, browse, research, find, read, write, call, text, boot, login
   - MUST include exact time (e.g., "At 8:00 PM")
3. FOCUSED WORK (15-30 min) - Substantive work with measurable outcome
   - Must specify minutes (never seconds)
   - Must include clear completion criteria

**FORMAT (EXACTLY 3 STEPS):**
[SUB-STEPS]
1. Preparation Step | Gather/prepare materials for "${step.title}" before work session
2. Activation Step | At [HH:MM AM/PM], [trivial physical action < 15 sec] for "${step.title}"
3. Focused Work Step | [Substantive work with measurable outcome] for [15-30] minutes (CRITICAL: MUST include "minutes" in description)
[/SUB-STEPS]

EXAMPLE:
[SUB-STEPS]
1. Gather Materials | By 7:00 PM, place your biology textbook, notes, and highlighter on your desk
2. Start Work | At 7:30 PM, open your biology textbook to chapter 5
3. Active Review | Read and highlight key concepts from chapter 5 for 25 minutes. When timer rings, stand up and stretch
[/SUB-STEPS]

ONLY suggest sub-steps if:
- They ask for help with this step
- They say this step feels overwhelming
- They ask \"how do I start\" this step
`;

    const systemPrompt = `You are Luna, a helpful AI assistant designed for teenagers and young adults (16-25) working on their goals.

Current Goal: "${goal.title}"
Goal Description: ${goal.description || 'No description provided'}
Goal Domain: ${goal.domain || 'General'}
PRIMARY BARRIER: ${goal.barrier_1 || 'Not specified'}
SECONDARY BARRIER: ${goal.barrier_2 || 'Not specified'}
USER MOTIVATION: ${goal.motivation || 'Not specified'}

${progressContext}

CURRENT STEP FOCUS: "${step.title}"
Step Description: ${step.notes || step.explainer || 'No description provided'}
Estimated Time: ${step.estimated_effort_min ? `${step.estimated_effort_min} minutes` : 'Not specified'}

Your communication style:
- Be concise and focused - you have limited responses
- Talk like a supportive friend who gets their struggles
- Use relatable examples from their world: social media, gaming, apps
- Keep responses under 150 words when possible

Use quick analogies they'll connect with:
- "Like organizing your phone apps"
- "Similar to learning a new game - start simple"
- "Think of it like creating content - plan, create, share"

CRITICAL RULES:
1. ${modeLine}
2. Analyze what they've completed to understand their progress pattern
3. ${isSubstep ? 'Provide direct action steps for this specific substep' : 'Provide sub-steps ONLY for the current step in question'}
4. Stay laser-focused on the current ${isSubstep ? 'substep' : 'step'}

Your role is to:
1. Answer their specific questions about THIS ${isSubstep ? 'SUBSTEP' : 'STEP'} only
2. ${isSubstep ? 'Give direct, specific guidance for completing this substep' : 'Break down THIS STEP into smaller, manageable sub-steps'}
3. Give practical advice for completing THIS SPECIFIC ${isSubstep ? 'SUBSTEP' : 'STEP'}
4. Stay laser-focused on the current ${isSubstep ? 'substep' : 'step'}

${guidanceBlock}

Be supportive but keep it brief and focused on THIS ${isSubstep ? 'SUBSTEP' : 'STEP'} ONLY.`;

    // Prepare conversation history for context
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map((msg: any) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices?.[0]?.message?.content || '';

    // Parse potential sub-steps from the response (must be exactly 3 steps following EF framework)
    const suggestedSteps = dedupeSubSteps(parseSubSteps(assistantResponse, step, goal));

    // Check if substeps already exist for this step
    const existingSubsteps = await checkExistingSubsteps(step.id);

    // If sub-steps were suggested, create them in the database (only if none exist)
    let createdSteps: any[] = [];
    if (suggestedSteps.length > 0 && existingSubsteps.length === 0) {
      createdSteps = await createSubSteps(suggestedSteps, step, goal);
      
      // After successful substep generation: reset irrelevance counter and check for escalation
      const newCooldownAttemptsTotal = cooldownState.cooldown_attempts_total;
      
      let shouldLock = false;
      let newCooldownLevel = cooldownState.cooldown_level;
      let cooldownUntil = null;
      
      if (newCooldownAttemptsTotal >= 6) {
        shouldLock = true;
        await updateCooldownState(supabase, {
          ...cooldownState,
          irrelevance_count: 0,
          is_locked: true,
          locked_at: new Date().toISOString(),
          lock_reason: 'Exceeded 6 total cooldown attempts'
        });
        
        await logCooldownEvent(supabase, userId, step.id, goal.id, 'persistent_lock_triggered', {
          total_cooldown_attempts: newCooldownAttemptsTotal
        });
      } else if (newCooldownAttemptsTotal >= 3 && cooldownState.cooldown_level < 2) {
        newCooldownLevel = 2;
        cooldownUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        
        await updateCooldownState(supabase, {
          ...cooldownState,
          irrelevance_count: 0,
          cooldown_level: newCooldownLevel,
          cooldown_until: cooldownUntil
        });
        
        await logCooldownEvent(supabase, userId, step.id, goal.id, 'cooldown_5min_triggered', {
          total_cooldown_attempts: newCooldownAttemptsTotal
        });
      } else {
        await updateCooldownState(supabase, {
          ...cooldownState,
          irrelevance_count: 0
        });
      }
    } else if (existingSubsteps.length > 0) {
      console.log(`Skipping substep creation - ${existingSubsteps.length} substeps already exist for step ${step.id}`);
      createdSteps = existingSubsteps;
    }

    return new Response(JSON.stringify({
      response: assistantResponse.replace(/\[SUB-STEPS\][\s\S]*?\[\/SUB-STEPS\]/g, '').trim(),
      suggestedSteps: createdSteps
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in step-assistance function:', error);
    const details = typeof error?.message === 'string' ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: 'An error occurred while processing your request',
      details,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Similarity helpers to prevent duplicate/near-duplicate substeps
function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[—–-]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSemantic(s: string): string {
  let t = normalize(s);
  // Phrase-level unifications for common duplicates
  t = t.replace(/\bfollow the recipe step by step\b/g, 'follow recipe step');
  t = t.replace(/\bfollow the steps?\b/g, 'follow recipe step');
  t = t.replace(/\bgather ingredients\s*(and|\&)\s*tools\b/g, 'gather ingredients tools');
  t = t.replace(/\bplate(\s*(and|\&)\s*|\s*)clean up\b/g, 'plate clean');
  t = t.replace(/\bchoose\b/g, 'pick');
  t = t.replace(/\bselect\b/g, 'pick');
  t = t.replace(/\bsimple recipe\b/g, 'recipe');
  return t;
}

const STOPWORDS = new Set([
  'the','a','an','and','or','of','to','for','with','on','in','at','by','your','you','do','it','this','that','like','min','minutes'
]);

function tokenize(s: string): Set<string> {
  const t = normalizeSemantic(s);
  return new Set(
    t.split(' ')
     .filter(Boolean)
     .filter((w) => !STOPWORDS.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return inter.size / union.size;
}

function isNearDuplicate(a: any, b: any): boolean {
  const aTitle = normalizeSemantic(a.title || '');
  const bTitle = normalizeSemantic(b.title || '');
  if (aTitle === bTitle) return true;
  const aT = tokenize(a.title || '');
  const bT = tokenize(b.title || '');
  if (jaccard(aT, bT) >= 0.8) return true;
  const aAll = tokenize(`${a.title || ''} ${a.description || ''}`);
  const bAll = tokenize(`${b.title || ''} ${b.description || ''}`);
  return jaccard(aAll, bAll) >= 0.75;
}

function dedupeSubSteps(list: any[]): any[] {
  const kept: any[] = [];
  for (const item of list) {
    const dup = kept.some((k) => isNearDuplicate(k, item));
    if (!dup) kept.push(item);
  }
  return kept;
}

function parseSubSteps(response: string, parentStep: any, goal: any): any[] {
  const subStepsMatch = response.match(/\[SUB-STEPS\]([\s\S]*?)\[\/SUB-STEPS\]/);
  if (!subStepsMatch) return [];

  const subStepsText = subStepsMatch[1].trim();
  const lines = subStepsText.split('\n').filter((line) => line.trim());

  const parsedSteps = lines.map((line) => {
    const match = line.match(/^\d+\.\s*(.+?)\s*\|\s*(.+?)(?:\s*\((\d+)\s*minutes?\))?$/);
    if (!match) return null;

    const [, title, description] = match;

    return {
      title: String(title).trim(),
      description: String(description).trim(),
      step_id: parentStep.id,
      is_planned: false,
    };
  }).filter(Boolean);

  // CRITICAL: Must have exactly 3 steps
  if (parsedSteps.length !== 3) {
    console.warn(`Substeps must be exactly 3 steps (got ${parsedSteps.length}) - rejecting all`);
    return [];
  }

  // Validate each step against EF framework rules
  for (let index = 0; index < parsedSteps.length; index++) {
    const substep = parsedSteps[index];
    
    // Validate Step 2 (index 1) follows activation rules
    if (index === 1) {
      const bannedVerbs = ['search', 'browse', 'research', 'find', 'read', 'write', 'call', 'text', 'boot', 'login'];
      const hasTimeBound = /\d{1,2}:\d{2}\s?(AM|PM)/i.test(substep.description);
      const hasBannedVerb = bannedVerbs.some(verb => 
        new RegExp(`\\b${verb}\\b`, 'i').test(substep.description)
      );
      
      if (hasBannedVerb) {
        console.warn(`Step 2 contains banned verb - rejecting all substeps`);
        return [];
      }
      if (!hasTimeBound) {
        console.warn(`Step 2 missing exact time anchor (HH:MM AM/PM) - rejecting all substeps`);
        return [];
      }
    }
    
    // Validate Step 3 (index 2) is substantive work
    if (index === 2) {
      const hasMinutes = /\d+\s?minut/i.test(substep.description);
      const hasSeconds = /\d+\s?seconds/i.test(substep.description);
      
      if (hasSeconds) {
        console.warn(`Step 3 cannot use "seconds" - must be 15+ minutes - rejecting all substeps`);
        return [];
      }
      if (!hasMinutes) {
        console.warn(`Step 3 must specify duration in minutes - rejecting all substeps`);
        return [];
      }
    }
  }

  return parsedSteps as any[];
}

async function createSubSteps(subSteps: any[], parentStep: any, goal: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) return [];
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Creating ${subSteps.length} substeps for step ${parentStep.id}`);

  const createdSubsteps: any[] = [];
  
  for (const subStep of subSteps) {
    try {
      const { data, error } = await supabase
        .from('substeps')
        .insert(subStep)
        .select()
        .single();

      if (error) {
        console.error('Error creating substep:', error);
        continue;
      }

      createdSubsteps.push(data);
      console.log('Created substep:', data.title);
    } catch (error) {
      console.error('Error inserting substep:', error);
    }
  }

  return createdSubsteps;
}

async function checkExistingSubsteps(stepId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) return [];
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: existingSubsteps, error } = await supabase
      .from('substeps')
      .select('*')
      .eq('step_id', stepId);

    if (error) {
      console.error('Error checking existing substeps:', error);
      return [];
    }

    return existingSubsteps || [];
  } catch (error) {
    console.error('Error in checkExistingSubsteps:', error);
    return [];
  }
}
