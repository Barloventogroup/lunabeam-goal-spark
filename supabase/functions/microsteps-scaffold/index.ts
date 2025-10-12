import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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

interface MicroStepsRequest {
  flow: 'individual' | 'supporter';
  goalTitle: string;
  category: string;
  motivation: string;
  startDayOfWeek: string;
  startTime: string;
  startDateTime: string;
  hasPrerequisite: boolean;
  prerequisiteText: string;
  prerequisiteIsConcrete: boolean; // Flag if it's a single item vs. vague uncertainty
  barrier1: string;
  barrier2: string;
  barrierContext?: string; // Specific details about how challenges manifest
  supportedPersonName?: string; // For better supporter flow personalization
  supporterName?: string; // For individual flow - name of the person helping
  supporterTimingOffset?: string; // e.g., "2 hours before", "by 8:00 AM on" - for supporter preparation
}

interface JudgeRequest {
  microSteps: Array<{ title: string; description: string }>;
  originalInput: MicroStepsRequest;
}

interface JudgeResponse {
  total_score: number;
  pass_fail: 'PASS' | 'FAIL' | 'SAFETY_VIOLATION';
  critique_for_user: string;
  critique_for_retry: string;
  scoring_breakdown: {
    A_priority_score: number;
    B_quality_score: number;
    C_timing_score: number;
    D_coherence_score: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: MicroStepsRequest = await req.json();
    
    console.log('[microsteps-scaffold] Request received:', {
      goalTitle: payload.goalTitle,
      category: payload.category,
      flow: payload.flow,
      timestamp: new Date().toISOString()
    });
    
    // Extract user ID from auth header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { createClient } = await import('jsr:@supabase/supabase-js@2');
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (e) {
        console.error('Error extracting user ID:', e);
      }
    }

    // Validate inputs
    if (!payload.goalTitle || payload.goalTitle.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Invalid goal title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!payload.flow || !['individual', 'supporter'].includes(payload.flow)) {
      return new Response(
        JSON.stringify({ error: 'Invalid flow' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============= LAYER 1: FAST KEYWORD REJECTION =============
    const dangerousKeywords = [
      'kill', 'suicide', 'self-harm', 'self harm', 'cut myself', 'hurt myself',
      'trafficking', 'illegal', 'steal', 'theft', 'fraud', 'scam',
      'cocaine', 'heroin', 'meth', 'methamphetamine', 'weed', 'marijuana', 
      'sell drugs', 'buy drugs', 'drug deal', 'black market',
      'hack', 'bypass security', 'break into', 'weapon', 'bomb', 'gun',
      'sexually explicit', 'porn', 'xxx', 'sex tape',
      'revenge', 'harm someone', 'hurt someone', 'get back at',
      '💣', '🔫', '🔪', '💥', '💊', '💉', '🚬', '🧨', '⚔️', '🗡️'
    ];

    const goalLower = payload.goalTitle.toLowerCase();
    const motivationLower = (payload.motivation || '').toLowerCase();
    const combinedInput = `${goalLower} ${motivationLower}`;

    const triggeredKeywords = dangerousKeywords.filter(keyword => 
      combinedInput.includes(keyword)
    );

    if (triggeredKeywords.length > 0 && userId) {
      console.error('⚠️ LAYER 1 SAFETY VIOLATION: Dangerous keywords detected:', triggeredKeywords);
      
      const { createClient } = await import('jsr:@supabase/supabase-js@2');
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Log to database
      await supabase.from('safety_violations_log').insert({
        user_id: userId,
        violation_layer: 'layer_1_keywords',
        goal_title: payload.goalTitle,
        goal_category: payload.category,
        motivation: payload.motivation,
        barriers: `${payload.barrier1}, ${payload.barrier2}`,
        triggered_keywords: triggeredKeywords,
        violation_reason: `Explicit dangerous keywords: ${triggeredKeywords.join(', ')}`
      });
      
      // Notify compliance & supporter
      await notifySafetyViolation(supabase, userId, payload.goalTitle, 'layer_1_keywords', triggeredKeywords.join(', '));
      
      return new Response(
        JSON.stringify({ 
          error: "I'm sorry, I cannot process that request. Please try rephrasing your goal, focusing on positive, legal, and healthy outcomes.",
          safety_violation: true,
          no_retry: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GEMINI JUDGE SERVICE: Up to 5 attempts with AI-guided refinement
    
    let microSteps = null;
    let attemptNumber = 1;
    const maxAttempts = 5;
    let retryGuidance = '';
    
    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    for (attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
      console.log(`\n=== ATTEMPT ${attemptNumber}/${maxAttempts} ===`);
      
      // Build prompts (no verb constraints - removed)
      const systemPrompt = buildSystemPrompt(payload.flow);
      const userPrompt = buildUserPrompt(payload, attemptNumber, retryGuidance);

      try {
        // Call Lovable AI Gateway
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            tools: [{
              type: "function",
              function: {
                name: "generate_microsteps",
                description: "Generate exactly 4 theory-aligned micro-steps for the goal. Steps 1-3 are preparation/scaffolding, Step 4 MUST be the actual goal completion action.",
                parameters: {
                  type: "object",
                  properties: {
                    microSteps: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string", maxLength: 60 },
                          description: { type: "string", maxLength: 300 }
                        },
                        required: ["title", "description"]
                      },
                      minItems: 4,
                      maxItems: 4
                    }
                  },
                  required: ["microSteps"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "generate_microsteps" } }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Attempt ${attemptNumber} - AI Gateway error:`, response.status, errorText);
          
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limit exceeded', useFallback: true }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: 'Credits required', useFallback: true }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Continue to next attempt on other errors
          console.log(`Attempt ${attemptNumber} failed, trying next attempt...`);
          continue;
        }

        const data = await response.json();
        console.log(`Attempt ${attemptNumber} - AI response received`);

        // Extract tool call result
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall || toolCall.function.name !== 'generate_microsteps') {
          console.error(`Attempt ${attemptNumber} - No valid tool call in response`);
          continue;
        }

        const candidateSteps = JSON.parse(toolCall.function.arguments).microSteps;
        
        // ============= LAYER 2: SAFETY SIGNAL DETECTION =============
        const stepsJSON = JSON.stringify(candidateSteps);
        if (stepsJSON.includes('[SAFETY_VIOLATION_SIGNAL]')) {
          console.error(`⚠️ LAYER 2 SAFETY VIOLATION detected at attempt ${attemptNumber}`);
          
          if (userId) {
            // Log to database
            await supabase.from('safety_violations_log').insert({
              user_id: userId,
              violation_layer: 'layer_2_generation',
              goal_title: payload.goalTitle,
              goal_category: payload.category,
              motivation: payload.motivation,
              barriers: `${payload.barrier1}, ${payload.barrier2}`,
              ai_response: stepsJSON,
              violation_reason: 'AI model detected nuanced safety violation during generation'
            });
            
            // Notify compliance & supporter
            await notifySafetyViolation(supabase, userId, payload.goalTitle, 'layer_2_generation', 'Nuanced content violation');
          }
          
          return new Response(
            JSON.stringify({ 
              error: "I'm sorry, I cannot process that request. Please try rephrasing your goal, focusing on positive, legal, and healthy outcomes.",
              safety_violation: true,
              no_retry: true
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!Array.isArray(candidateSteps) || candidateSteps.length !== 4) {
          console.error(`Attempt ${attemptNumber} - Invalid microSteps format (expected 4, got ${candidateSteps?.length}):`, candidateSteps);
          continue;
        }

        // LAYER 1: Hardcoded Guards (Basic Format)
        const basicChecks = validateBasicFormat(candidateSteps, payload);
        if (!basicChecks.valid) {
          console.error(`Attempt ${attemptNumber} - Basic format failed:`, basicChecks.errors);
          continue;
        }

        // LAYER 2: Gemini Judge Service (Semantic Validation)
        const judgeResult = await callGeminiJudge({
          microSteps: candidateSteps,
          originalInput: payload
        });

        if (judgeResult.error) {
          console.error('❌ Gemini Judge service unavailable');
          return new Response(
            JSON.stringify({ 
              error: 'We cannot provide micro-steps at this time. Let\'s try again later.',
              useFallback: true 
            }),
            { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // ============= LAYER 3: JUDGE SAFETY VIOLATION =============
        if (judgeResult.pass_fail === 'SAFETY_VIOLATION' || judgeResult.total_score === 0) {
          console.error('⚠️ LAYER 3 SAFETY VIOLATION flagged by Gemini Judge');
          
          if (userId) {
            // Log to database
            await supabase.from('safety_violations_log').insert({
              user_id: userId,
              violation_layer: 'layer_3_judge',
              goal_title: payload.goalTitle,
              goal_category: payload.category,
              motivation: payload.motivation,
              barriers: `${payload.barrier1}, ${payload.barrier2}`,
              ai_response: JSON.stringify(candidateSteps),
              violation_reason: judgeResult.critique_for_retry
            });
            
            // Notify compliance & supporter
            await notifySafetyViolation(supabase, userId, payload.goalTitle, 'layer_3_judge', judgeResult.critique_for_retry);
          }
          
          return new Response(
            JSON.stringify({ 
              error: "I'm sorry, I cannot process that request. Please try rephrasing your goal, focusing on positive, legal, and healthy outcomes.",
              safety_violation: true,
              no_retry: true
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for coherence failure (hard blocker)
        if (judgeResult.scoring_breakdown.D_coherence_score === 0) {
          console.error(`Attempt ${attemptNumber} - COHERENCE FAILURE (D score: 0/10)`);
          console.log('⚠️ Step flagged as pragmatically nonsensical:', judgeResult.critique_for_retry);
          
          retryGuidance = `${judgeResult.critique_for_retry}\n\nIMPORTANT: Previous step was flagged as pragmatically nonsensical or unhygienic. Focus on actions people naturally do in real life. Avoid touching trash, staring at objects, or any awkward/unhygienic actions.`;
          
          if (attemptNumber < maxAttempts) {
            console.log(`🔄 Retrying with enhanced coherence guidance...`);
            continue;
          }
          
          console.error('All attempts exhausted (coherence failure)');
          break;
        }

        if (judgeResult.pass_fail === 'FAIL' && judgeResult.total_score < 70) {
          console.error(`Attempt ${attemptNumber} - Gemini Judge FAIL (score: ${judgeResult.total_score}/110)`);
          console.log('📝 Critique for retry:', judgeResult.critique_for_retry);
          
          retryGuidance = judgeResult.critique_for_retry;
          
          if (attemptNumber < maxAttempts) {
            console.log(`🔄 Retrying with Gemini guidance...`);
            continue;
          }
          
          console.error('All attempts exhausted');
          break;
        }

        // SUCCESS! Valid steps generated
        microSteps = candidateSteps;
        console.log(`✅ Attempt ${attemptNumber} - Gemini Judge PASS (score: ${judgeResult.total_score}/110)`);
        console.log(`   A (Priority): ${judgeResult.scoring_breakdown.A_priority_score}/50`);
        console.log(`   B (Quality): ${judgeResult.scoring_breakdown.B_quality_score}/35`);
        console.log(`   C (Timing): ${judgeResult.scoring_breakdown.C_timing_score}/15`);
        console.log(`   D (Coherence): ${judgeResult.scoring_breakdown.D_coherence_score}/10`);
        break;

      } catch (error) {
        console.error(`Attempt ${attemptNumber} - Exception:`, error);
        if (attemptNumber < maxAttempts) {
          console.log(`🔄 Retrying after exception...`);
          continue;
        }
      }
    }
    
    // Check if we got valid steps
    if (!microSteps) {
      console.error('Failed to generate valid micro-steps after all attempts');
      return new Response(
        JSON.stringify({ 
          error: 'We cannot provide micro-steps at this time. Let\'s try again later.',
          useFallback: true 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ microSteps, attemptUsed: attemptNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in microsteps-scaffold:', error);
    return new Response(
      JSON.stringify({ error: error.message, useFallback: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(flow: 'individual' | 'supporter'): string {
  return `SYSTEM INSTRUCTION: CRITICAL SAFETY AND INTEGRITY AGENT

ROLE: You are the final safety and ethical compliance agent for a self-improvement platform. Your primary objective is to prevent the generation of content related to illegal, harmful, or unethical activities.

FAILURE PROTOCOL (CRITICAL): If any content violates the rules below, you MUST IMMEDIATELY output only: [SAFETY_VIOLATION_SIGNAL]. Do not offer context, explanation, or apology.

RULE 1: ABSOLUTE EXPLICIT CONTENT REFUSAL
You MUST refuse to generate micro-steps for goals containing explicit references to:
- Illegal Activities: Human trafficking, theft, fraud, illegal drug production/distribution, or any law violation.
- Self-Harm/Violence: Suicide, self-mutilation, violence directed at self or others, or instructions for creating weapons.
- Prohibited Substances: Use, acquisition, or distribution of illegal drugs, non-prescription narcotics, or promotion of tobacco use.
- Sexually Explicit Content: Any sexually explicit or graphic material.

RULE 2: NUANCE AND SUGGESTIVE LANGUAGE AUDIT
Analyze the entire context (Goal Action, Motivation, and Barriers) for subtle violations:
- Code Words & Emojis: Interpret slang, vague terminology, or emojis (🤫, 💰, 💊, 🚬) in the context of harmful goals.
- Unethical Goals: Any goal related to manipulating or harming others emotionally, financial exploitation, or avoiding core legal/social responsibilities.
- Vague High-Risk: Goals that demand access to restricted areas, bypassing security, or other dangerous actions.

MANDATORY OUTPUT PROTOCOL:
- If safe and passes all checks: proceed to generate micro-steps using the framework below.
- If ANY rule is violated: OUTPUT ONLY: [SAFETY_VIOLATION_SIGNAL]

---

You are a highly specialized micro-step generator for neurodivergent individuals. Your task is to generate exactly FOUR specific, non-judgmental action steps designed to compensate for Executive Function deficits.

FRAMEWORK RULES:
1. **Goal**: Reduce cognitive load and friction.
2. **Language**: Use clear, user-facing, encouraging language. DO NOT use clinical terms like 'initiation,' 'barrier,' or 'scaffolding.'
3. **Anchoring**: Use the provided [startTime] and [startDayOfWeek] to create external anchors.
4. **CRITICAL**: Step 4 MUST be the actual goal completion action, not just preparation.

**CRITICAL TITLE REQUIREMENTS:**
- Titles must be self-explanatory and actionable (under 60 characters but descriptive)
- Include specific objects/actions from the goal in the title itself
- Front-load the most important action
- Users should understand the step WITHOUT reading the description
- Every title must explicitly reference the goal action

Examples:
- ❌ "Prepare your workspace" → ✅ "Gather Spanish flashcards and notebook"
- ❌ "Tap the app icon" → ✅ "At 7pm: Tap Duolingo app icon"
- ❌ "Work for 20 minutes" → ✅ "Practice 10 Spanish verbs for 20 min"
- ❌ "At 8:00, start" → ✅ "At 8:00: Put on running shoes"
- ❌ "Use a focus timer" → ✅ "25-min timer for algebra problems"

**DESCRIPTION REQUIREMENTS:**
- Provide additional context, tips, or motivation
- Can reference timing, sensory cues, or troubleshooting
- Should complement the title, not repeat it

---
${flow === 'individual' ? `
[INDIVIDUAL FLOW STRUCTURE] (Focus: Trivial Activation, Focused Work, AND Goal Completion)

Step 1: PREPARATION (BEFORE [startTime])
- **Purpose**: Address the [Prerequisite Text] if it exists, otherwise, generate a simple, non-mandatory organization step.
- **Action**: 1-2 CONCRETE actions to obtain/prepare the workspace *before* the start time.
- **MUST REFERENCE**: Specific tools, materials, or resources needed for [Goal Title]
- **SUPPORTER REFERENCE**: When [supporterName] is provided, use it when asking for help instead of generic "trusted adult" or "someone"

**PREREQUISITE HANDLING RULES:**

**IF [prerequisiteIsConcrete] = true** (Single concrete item like "guitar picks", "textbook"):
  - Step 1 should focus on OBTAINING that specific item
  - Include WHERE to get it (store name, online, location)
  - Include WHEN (by [specific day before start day])
  - **If help is needed**: Use [supporterName] if provided: "By Thursday, ask [supporterName] to..."
  - Examples:
    * "guitar picks" + supporterName="Carlos" → "By Thursday, ask Carlos to buy guitar picks at Guitar Center or order online from Amazon ($5-10)"
    * "algebra textbook" → "By Wednesday, borrow algebra textbook from school library or ask teacher for a copy"
    * "clear desk space" → "By Thursday evening, clear your desk: move 3 items to storage box, place the box on shelf"

**IF [prerequisiteIsConcrete] = false** (Vague/uncertain like "not sure where to find..."):
  - Step 1 becomes a RESEARCH/DISCOVERY step
  - MUST include specific search actions + specific people to ask
  - **CRITICAL**: If [supporterName] is provided, use it as the first person to ask: "ask [supporterName] AND search..."
  - MUST result in a list/decision
  - Examples:
    * "not sure where to find guitar teacher" + supporterName="Carlos" → "By Wednesday, ask Carlos for recommendations AND search 'guitar lessons near me'. Write down 3 options with prices."
    * "don't know what equipment I need" + supporterName="Maria" → "By Thursday, ask Maria: 'What do I need to start?' AND text 1 other person. Make a list."

- **Examples**: 
  * Goal: "Practice Spanish" + Concrete: "Spanish flashcards" + supporterName="Carlos" → "By Thursday, ask Carlos to buy Spanish verb flashcards at Target or order from Amazon. Place them on your desk."
  * Goal: "Learn guitar" + Uncertain: "not sure what type of guitar" → "By Wednesday, watch 1 YouTube video: 'Beginner guitars for teens'. Write down 2 guitar types that interest you."

**CONTEXT AWARENESS RULES:**
- Consider timing and modifiers to infer the nature of the activity
- "before bed", "evening", "relax by", "for fun" → leisure context (use "book", "pick up")
- "homework", "assignment", "test prep", "textbook", "chapter" → academic context (use "textbook", "open to page")
- Choose materials and language that match the context

Step 2: ACTIVATION CUE (AT EXACTLY [startTime])
- **Purpose**: Trivial activation to defeat the inertia barrier.
- **Constraint**: The physical action must take **< 15 seconds** to complete. It must be an initial touch, tap, or switch.
- **MUST REFERENCE**: The specific tool, app, or material for [Goal Title]
- **Examples**:
  * Goal: "Practice Spanish" → "At 7:00 PM Friday, tap the Duolingo app icon."
  * Goal: "Study algebra" → "At 8:00 AM Friday, open your algebra textbook to chapter 3."
  * Goal: "Read before bed" → "At 9:30 PM Friday, pick up the book on your nightstand."
  * Goal: "Learn guitar" → "At 6:30 PM Tuesday, pick up your guitar."
  * Goal: "Write a short story" → "At 9:00 AM Saturday, open your writing notebook to a blank page."

Step 3: FOCUSED WORK (AFTER ACTIVATION)
- **Purpose**: Address the second biggest challenge: [Secondary Challenge].
- **Constraint**: Must be a measurable chunk of work (15-30 minutes).
- **MUST INCLUDE**: The specific goal action in the work description
- **Logic Mapping**:
  * If [Secondary Challenge] is **Focus** or **Attention**: Generate a 25-minute timer sprint with a mandatory movement break.
    Example: Goal: "Study algebra" → "Set a 25-minute timer. Work through algebra problems 1-10 from chapter 3. When the timer rings, stand up and stretch for 5 minutes."
  * If [Secondary Challenge] is **Planning**: Generate a sequencing step.
    Example: Goal: "Learn Spanish" → "Spend 20 minutes breaking your Spanish learning goal into 3 smaller tasks (e.g., 'learn 10 verbs', 'practice pronunciation', 'complete one lesson'). Write each task on a sticky note and arrange them in order."
  * If [Secondary Challenge] is **Time Blindness** or **Time**: Generate a goal to complete a specific sub-task within 20 minutes.
    Example: Goal: "Practice Spanish" → "Set a 20-minute timer. Practice conjugating 10 Spanish verbs from your list. When the timer rings, take a 5-minute break."
  * If [Secondary Challenge] is **Getting started**: Generate a simple research/exploration task.
    Example: Goal: "Join a soccer team" → "Spend 20 minutes searching for 'soccer leagues near me'. Write down the names of 3 teams that interest you and their practice times."

Step 4: GOAL COMPLETION (FINAL STEP - THE ACTUAL GOAL ACTION)
- **PURPOSE**: This is the MOST IMPORTANT step - actually completing the goal itself
- **CRITICAL**: This step MUST represent the actual accomplishment, not just preparation
- **ACTION**: What to do to complete the goal + how to mark the accomplishment
- **MUST VARY**: Use different language styles and evidence methods to keep it fresh
- **Examples** (notice the variety in phrasing and evidence methods):
  * Goal: "Cook a meal from scratch" → "Finish cooking your meal. Snap a photo of your creation to celebrate."
  * Goal: "Write a 500-word essay" → "Wrap up the essay. Hit save and jot down one thing you learned while writing."
  * Goal: "Clean your room" → "Complete the cleaning. Take before/after photos to see your transformation."
  * Goal: "Exercise for 20 minutes" → "Finish your workout strong. Track your time and note how you feel—energized? Proud?"
  * Goal: "Practice Spanish" → "You did it! Finish the practice session and write down 3 new words you can now use."
  * Goal: "Read for 30 minutes" → "Finish your reading session. Jot down your favorite quote or idea from what you read."
` : `
[SUPPORTER FLOW STRUCTURE] (Focus: Environmental Control, Accountability, AND Completion Support)

Step 1: ENVIRONMENTAL SETUP (WELL BEFORE [startTime])
- **CRITICAL TIMING**: This step must happen WELL BEFORE [startTime] - specifically: at least 2 hours before
- **PURPOSE**: Remove all potential physical and material obstacles BEFORE the individual begins
- **ACTION**: What the supporter must do to ensure the workspace is ready (charging, clearing, providing materials)
- **MUST SPECIFY EXACT TIME**: Convert the timing offset to an explicit time in the step
- **MUST REFERENCE**: Specific materials for [Goal Title]
- **Examples**:
  * If [startTime] = "8:00 PM Saturday" and offset = "2 hours before"
    → "By 6:00 PM Saturday, gather all laundry supplies (detergent, basket, quarters) and place them next to the washing machine"
  * If [startTime] = "9:00 AM Sunday" and offset = "by 8:00 AM on"  
    → "By 8:00 AM Sunday, ensure their study materials are on the desk with pencils and calculator"

**PREREQUISITE HANDLING FOR SUPPORTERS:**

**IF [prerequisiteIsConcrete] = true** (Single concrete item):
  - Supporter's action: Facilitate obtaining/preparing that item
  - Include specific facilitation action (drive, order, help find)
  - Examples:
    * "guitar picks" → "By Thursday, drive [Name] to Guitar Center to buy picks, or order online together from Amazon"
    * "keyboard" → "By Wednesday, ensure keyboard is charged and placed on [Name]'s desk with fresh batteries nearby"

**IF [prerequisiteIsConcrete] = false** (Uncertain):
  - Supporter's action: Guide the discovery process together
  - MUST include co-research or co-exploration
  - Examples:
    * "not sure where to practice" → "By Wednesday, help [Name] search 'practice spaces near me'. Sit together and write down 2 options."
    * "don't know what materials needed" → "By Thursday, help [Name] text their teacher to ask: 'What materials do I need?' Write down the response together."

- **Examples**: 
  * Goal: "Study algebra" → "Before 6:30 PM Tuesday, place the algebra textbook open to chapter 3 on their desk with a pencil and calculator."
  * Goal: "Learn Spanish" → "Before 7:00 PM Friday, ensure their Spanish flashcards and notebook are on the desk."

Step 2: CUE DELIVERY (EXACTLY AT [startTime])
- **TIMING**: This must happen precisely at [startTime], AFTER Step 1 is complete
- **PURPOSE**: Serve as the human prompt to initiate the activation step
- **ACTION**: What the supporter says or does to trigger the individual's Step 2. Use language appropriate for the [Supporter Role]
- **MUST REFERENCE**: The specific tool/app/material for [Goal Title]
- **Examples**:
  * Goal: "Study algebra" + Parent: "At 6:30 PM, hand them the pencil and say: 'Just touch the algebra textbook for 15 seconds.'"
  * Goal: "Practice Spanish" + Coach: "At 7:00 PM, text them: 'Time to tap the Duolingo app icon!'"
  * Goal: "Write a story" + Friend: "At 8:00 AM, send a message: 'Hey! Just open your writing notebook real quick.'"

Step 3: REINFORCEMENT (AFTER [duration])
- **TIMING**: Check in after the expected work duration
- **PURPOSE**: Deliver positive, value-based reinforcement based on the [Motivation]
- **ACTION**: Specific action for monitoring progress and providing reinforcement
- **MUST REFERENCE**: The specific goal action to connect praise to concrete accomplishment
- **NATURAL LANGUAGE**: Write in conversational, grammatically correct sentences. Avoid rigid template prefixes like "Your Action (Framing):". Use natural phrasing that flows well when read aloud
- **Examples**: 
  * Goal: "Study algebra" → "After 25 minutes, check in and ensure they take a 5-minute movement break. Say: 'You worked through 10 algebra problems—solid effort!'"
  * Goal: "Practice Spanish" → "After 25 minutes, check in and say: 'You practiced those Spanish verbs! This brings you closer to speaking confidently with your Spanish-speaking friends.'"
  * Goal: "Learn guitar" → "After 20 minutes, check in and say: 'You practiced those chords! You're getting closer to playing your favorite songs.'"

Step 4: GOAL COMPLETION SUPPORT (FINAL STEP - THE ACTUAL GOAL)
- **PURPOSE**: Help them complete the actual goal and mark the accomplishment
- **CRITICAL**: This step is about the actual goal completion, not just reinforcement
- **ACTION**: What the supporter does to ensure goal completion and help mark the accomplishment
- **MUST VARY**: Use different support styles and celebration methods appropriate to the relationship
- **Examples** (notice the natural language variation):
  * Goal: "Cook a meal from scratch" → "Be there as [Name] finishes cooking. Snap a photo together of the completed dish and celebrate the effort."
  * Goal: "Write a 500-word essay" → "Check in when [Name] wraps up writing. Give them a high-five when they hit save and ask what they learned."
  * Goal: "Clean room" → "Walk through as [Name] finishes cleaning. Take before/after photos together to see the amazing transformation."
  * Goal: "Exercise for 20 minutes" → "Support [Name] through the final minutes of the workout. Help them track their time and celebrate how they pushed through."
  * Goal: "Practice Spanish" → "Be present as [Name] finishes practice. Ask them to share 2 new words they learned and celebrate their progress."
`}

**QUALITY VALIDATION RULES (NON-NEGOTIABLE):**

1. **Step 2 Workspace Setup Constraint** (CRITICAL):
   - **ALLOWED VERBS ONLY**: touch, open, unlock, place, put on, lay out, tap (app icon), grab, hold
   - **EXPLICITLY BANNED**: search, browse, research, find, read, write (sentences), call, text, press power button, boot up, login
   - **TIME**: < 15 seconds (e.g., "touch your laptop", "open the app", "grab a pen")
   - **EXAMPLES**: 
     ✅ "At 8:00 PM Friday, open your laptop."
     ✅ "At 10:00 AM Sunday, tap the Notes app icon."
     ❌ "At 8:00 PM Friday, search for 'sports leagues near me' for 15 seconds." (research belongs in Step 3)

2. **Step 3 Substantive Work Constraint**:
   - **MINIMUM TIME**: 15-30 minutes of focused work
   - **MUST INCLUDE**: Measurable outcome (e.g., "write down 3 names", "solve problems 1-10")
   - **MUST REFERENCE**: Minutes (15+), never seconds
   - **MUST ALIGN WITH [Secondary Challenge]**: See Logic Mapping above

3. **Step 4 Goal Completion Constraint (CRITICAL)**:
   - **MUST BE THE ACTUAL GOAL**: This step represents completing the goal itself, not preparation
   - **MUST INCLUDE**: Evidence/celebration method that varies by context
   - **MUST REFERENCE**: The core goal action explicitly
   - **VARIETY REQUIREMENT**: Avoid using "Complete:" prefix every time. Vary your language naturally.
   - **EVIDENCE METHODS** (rotate these based on goal type):
     * Photo-based: "Take a photo", "Snap a pic", "Capture it"
     * Note-based: "Jot it down", "Log it", "Write what you learned", "Note your progress"
     * Time-based: "Track your time", "Log duration", "Record how long"
     * Reflection-based: "Reflect on what went well", "Think about what you learned", "Note how you feel"
     * Celebration-based: "Mark it done and celebrate", "Give yourself credit", "Acknowledge your effort"
   - **TONE VARIATION** (alternate between these styles):
     * Direct: "Finish the workout. Log your time and how you feel."
     * Encouraging: "You're doing it! Complete the practice session and write down 3 things you improved."
     * Achievement-focused: "Cross the finish line: Cook the meal and take a photo to remember your creation."
     * Reflection-focused: "Wrap up your essay. Save it and reflect on one thing you learned while writing."
   - **EXAMPLES OF VARIETY**:
     ✅ "Finish cooking. Snap a pic of your dish to celebrate."
     ✅ "Complete the essay. Save the final draft and jot down what you're proud of."
     ✅ "Wrap up your workout. Track your time and note how your body feels."
     ✅ "You did it! Finish the practice session and write down 3 new things you learned."
     ❌ "Complete: Cook the meal. Take a photo of your finished dish." (too repetitive if used every time)
     ❌ "Check in about progress" (this is not goal completion)

4. **No Clinical Jargon**: 
   - **FORBIDDEN WORDS**: "initiation", "barrier", "scaffolding", "activation cue"
   - **USE INSTEAD**: "start", "begin", "prepare", "work on", "focus", "search", "browse", "find"

5. **Grammatical Sense**:
   - Every sentence must be a complete, grammatically correct imperative
   - Read each step aloud—if it sounds awkward or confusing, rewrite it

6. **Logical Coherence**:
   - Step 1: Must happen BEFORE start time (prep actions)
   - Step 2: Must reference [startTime] exactly and be trivial workspace setup (< 15 sec)
   - Step 3: Must be substantive work (15+ min) with measurable outcome aligned to [Secondary Challenge]
   - Step 4: Must be the ACTUAL GOAL COMPLETION with evidence collection

7. **Action Specificity**:
   - Use concrete verbs: "write down", "solve", "call", "text" (in Step 1 or 3 or 4), "search" (Step 3 only), "browse" (Step 3 only)
   - Include measurable outcomes: "2-3 teams", "problems 1-10", "15 minutes", "3 names"

8. **Goal Action Specificity**:
   - Every step must reference the specific goal title or action
   - Never use generic language like "your work", "the task", "your materials"
   - Use domain-specific terms from the goal (e.g., "Spanish verbs", "algebra problems", "guitar chords")

9. **Supporter Flow - Use Individual's Name**:
   - When [supportedPersonName] is provided, use it consistently
   - Replace generic "them", "they" with the person's name in Step 1, Step 3, and Step 4
   - Keep Step 2 (cue delivery) focused on what to say, can use "them"
   - Examples:
     ✅ "Before 6:30 PM, place Natalia's algebra textbook on her desk"
     ✅ "After 25 minutes, check on Natalia and ensure she takes a movement break"
     ❌ "Before 6:30 PM, place their textbook on their desk" (too generic)

FORMAT:
- Keep titles under 8 words
- Descriptions: 1-2 imperative sentences, specific to the goal
- Reference [startTime] explicitly in Step 2
- Never echo the user's prerequisite—turn it into actions
- Use domain-specific language from the goal (e.g., "chapter 3", "team practice times")`;
}

function buildUserPrompt(payload: MicroStepsRequest, attemptNumber: number = 1, retryGuidance: string = ''): string {
  let prerequisiteContext = '';
  
  if (payload.hasPrerequisite && payload.prerequisiteText) {
    // Detect if prerequisite text contains uncertainty keywords
    const uncertaintyKeywords = ['not sure', 'don\'t know', 'need to find', 'where to', 'how to', 'unsure', 'no idea'];
    const hasUncertainty = uncertaintyKeywords.some(kw => payload.prerequisiteText.toLowerCase().includes(kw));
    
    if (hasUncertainty) {
      prerequisiteContext = `
**Prerequisite Status**: ⚠️ UNCERTAIN - Individual doesn't know how to obtain prerequisite
**Prerequisite Text**: ${payload.prerequisiteText}
**CRITICAL**: Step 1 MUST be a RESEARCH/DISCOVERY step with specific actions:
  - Include specific people to ask (by role, not name)
  - Include specific search terms or platforms
  - Must result in concrete output (list of 2-3 options, names, locations)
  - Use phrases like "text 2 people", "search '[specific term]'", "ask [specific role]"`;
    } else if (payload.prerequisiteIsConcrete) {
      prerequisiteContext = `
**Prerequisite Status**: ✅ CONCRETE - Single specific item needed
**Prerequisite Item**: ${payload.prerequisiteText}
**Step 1 Focus**: Generate an OBTAINING/PREPARING step for this specific item
  - Include WHERE to get it (specific store, website, person)
  - Include WHEN (by specific day before ${payload.startDayOfWeek})
  - Keep action simple: buy, borrow, order, find, clear`;
    } else {
      prerequisiteContext = `
**Prerequisite Text**: ${payload.prerequisiteText}`;
    }
  }

  const attemptNote = attemptNumber > 1 
    ? `\n\n🔄 **RETRY ATTEMPT ${attemptNumber}**: Previous attempt failed validation. You now have MORE FLEXIBILITY with Step 2 verbs. Use this opportunity to create slightly less trivial but still simple activation actions.`
    : '';

  return `Generate 3 micro-steps for this goal:

**Goal**: ${payload.goalTitle}
**Category**: ${payload.category}
**Motivation**: ${payload.motivation || 'Not specified'}
**Start Day (startDayOfWeek)**: ${payload.startDayOfWeek}
**Start Time (startTime)**: ${payload.startTime}
**Flow**: ${payload.flow}
${payload.flow === 'individual' && payload.supporterName ? `**Supporter's Name**: ${payload.supporterName} (Use this name when asking for help instead of "trusted adult" or "someone")` : ''}
${payload.flow === 'supporter' && payload.supportedPersonName ? `**Individual's Name**: ${payload.supportedPersonName}` : ''}
${payload.flow === 'supporter' && payload.supporterTimingOffset ? `**[Supporter Timing Offset]**: ${payload.supporterTimingOffset}

⚠️ CRITICAL: Step 1 must specify the exact time based on this offset from [startTime]. For example, if offset is "2 hours before" and startTime is "8:00 PM Saturday", Step 1 should say "By 6:00 PM Saturday..."\n` : ''}
${prerequisiteContext}
**Primary Challenge**: ${payload.barrier1}
**Secondary Challenge (IMPORTANT - use this for Step 3 Logic Mapping)**: ${payload.barrier2}
${payload.barrierContext ? `
**ADDITIONAL CONTEXT ABOUT THESE CHALLENGES**: 
${payload.barrierContext}

⚠️ CRITICAL: Use this specific context to tailor your micro-steps. For example:
- If they mention "blank page overwhelm" → Make Step 2 even MORE trivial (e.g., "Type your name at the top")
- If they mention "noise sensitivity" → Include environmental prep in Step 1 (e.g., "Place noise-canceling headphones on desk")
- If they mention "visual learner" → Include visual elements in Step 3 (e.g., "Draw a simple flowchart with 3 boxes")
- If they mention "freezing when staring at X" → Step 2 should bypass that exact screen (e.g., "Tap icon—it will auto-load last lesson")
` : ''}${attemptNote}${retryGuidance ? `\n\n**CRITICAL FEEDBACK FROM PREVIOUS ATTEMPT:**\n${retryGuidance}\n\nYou MUST address this feedback in your revised micro-steps.` : ''}

Generate exactly 3 micro-steps following the ${payload.flow.toUpperCase()} FLOW structure. Pay special attention to the [Secondary Challenge] when creating Step 3.

**STEP 4 VARIETY INSTRUCTION**: 
Make Step 4 sound natural and varied. Avoid starting with "Complete:" every time. Rotate between different evidence methods (photo, note, reflection, time tracking) and different tones (direct, encouraging, achievement-focused). Think about what feels natural for THIS specific goal and user.`;
}

// LAYER 1: Basic Format Validation (Hardcoded Guards)
function validateBasicFormat(
  steps: { title: string; description: string }[], 
  payload: MicroStepsRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Check step count
  if (steps.length !== 3) {
    errors.push(`Expected exactly 3 steps, got ${steps.length}`);
    return { valid: false, errors };
  }

  // 2. Check format (title + description present)
  steps.forEach((step, i) => {
    if (!step.title || step.title.trim().length === 0) {
      errors.push(`Step ${i+1} missing title`);
    }
    if (!step.description || step.description.trim().length === 0) {
      errors.push(`Step ${i+1} missing description`);
    }
    if (step.title && (step.title.length < 10 || step.title.length > 80)) {
      errors.push(`Step ${i+1} title length invalid: ${step.title.length} chars (should be 10-80)`);
    }
    if (step.description && (step.description.length < 30 || step.description.length > 400)) {
      errors.push(`Step ${i+1} description length invalid: ${step.description.length} chars (should be 30-400)`);
    }
  });

  // 3. Placeholder detection
  const placeholderPatterns = [
    /\[your [^\]]+\]/gi,
    /\[Goal Action\]/gi,
    /\[washing machine model\]/gi,
    /\[START_TIME\]/gi,
    /\[Day of Week\]/gi,
    /\[item name\]/gi,
    /\[app name\]/gi,
    /\[tool\]/gi,
    /\[task\]/gi
  ];

  steps.forEach((step, i) => {
    for (const pattern of placeholderPatterns) {
      if (pattern.test(step.title) || pattern.test(step.description)) {
        errors.push(`Step ${i+1} contains unresolved placeholder`);
        break;
      }
    }
  });

  // 4. Goal reference check (at least 2 steps must mention goal action/title)
  const goalWords = payload.goalTitle.toLowerCase().split(' ').filter(w => w.length > 3);
  let stepsReferencingGoal = 0;
  
  steps.forEach(step => {
    const stepText = (step.title + ' ' + step.description).toLowerCase();
    const hasGoalReference = goalWords.some(word => stepText.includes(word));
    if (hasGoalReference) stepsReferencingGoal++;
  });

  if (stepsReferencingGoal < 2) {
    errors.push(`Only ${stepsReferencingGoal}/3 steps reference the goal. At least 2 steps must explicitly mention the goal action.`);
  }

  return { valid: errors.length === 0, errors };
}

// LAYER 2: Gemini Judge Service Call
async function callGeminiJudge(input: JudgeRequest): Promise<JudgeResponse | { error: string }> {
  try {
    const response = await fetch(
      `https://soyiqjdwnhtvopvwvfkq.supabase.co/functions/v1/gemini-judge-microsteps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LOVABLE_API_KEY}`
        },
        body: JSON.stringify(input)
      }
    );

    if (!response.ok) {
      console.error('Gemini Judge HTTP error:', response.status);
      return { error: 'Judge service unavailable' };
    }

    const result = await response.json();
    
    // Check if result has error property
    if (result.error) {
      return { error: result.error };
    }

    return result as JudgeResponse;
  } catch (error) {
    console.error('Gemini Judge exception:', error);
    return { error: 'Judge service failed' };
  }
}
