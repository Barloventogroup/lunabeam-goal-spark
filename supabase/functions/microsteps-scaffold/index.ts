import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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
  supportedPersonName?: string; // For better supporter flow personalization
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: MicroStepsRequest = await req.json();

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

    // Build system prompt based on flow
    const systemPrompt = buildSystemPrompt(payload.flow);

    // Build user prompt with goal context
    const userPrompt = buildUserPrompt(payload);

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
            description: "Generate exactly 3 theory-aligned micro-steps for the goal",
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
                  minItems: 3,
                  maxItems: 3
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
      console.error('AI Gateway error:', response.status, errorText);
      
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

      return new Response(
        JSON.stringify({ error: 'AI generation failed', useFallback: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_microsteps') {
      console.error('No valid tool call in response');
      return new Response(
        JSON.stringify({ error: 'Invalid AI response', useFallback: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const microSteps = JSON.parse(toolCall.function.arguments).microSteps;

    if (!Array.isArray(microSteps) || microSteps.length !== 3) {
      console.error('Invalid microSteps format:', microSteps);
      return new Response(
        JSON.stringify({ error: 'Invalid micro-steps format', useFallback: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate quality of generated steps
    const validation = validateMicroSteps(microSteps, payload);
    if (!validation.valid) {
      console.error('Quality validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ error: 'Quality validation failed', useFallback: true }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ microSteps }),
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
  return `You are a highly specialized micro-step generator for neurodivergent individuals. Your task is to generate exactly three, specific, non-judgmental action steps designed to compensate for Executive Function deficits.

FRAMEWORK RULES:
1. **Goal**: Reduce cognitive load and friction.
2. **Language**: Use clear, user-facing, encouraging language. DO NOT use clinical terms like 'initiation,' 'barrier,' or 'scaffolding.'
3. **Anchoring**: Use the provided [startTime] and [startDayOfWeek] to create external anchors.

**CRITICAL REQUIREMENT FOR ALL STEPS:**
Every step must explicitly reference the goal title or specific goal action. DO NOT use generic language like "your work", "the task", or "your materials."

Examples:
- ❌ "Prepare your workspace" → ✅ "Gather your Spanish flashcards and notebook"
- ❌ "Tap the app icon" → ✅ "Tap the Duolingo app icon"
- ❌ "Work for 20 minutes" → ✅ "Practice 10 Spanish verbs for 20 minutes"

---
${flow === 'individual' ? `
[INDIVIDUAL FLOW STRUCTURE] (Focus: Trivial Activation & Focused Work)

Step 1: PREPARATION (BEFORE [startTime])
- **Purpose**: Address the [Prerequisite Text] if it exists, otherwise, generate a simple, non-mandatory organization step.
- **Action**: 1-2 CONCRETE actions to obtain/prepare the workspace *before* the start time.
- **MUST REFERENCE**: Specific tools, materials, or resources needed for [Goal Title]

**PREREQUISITE HANDLING RULES:**

**IF [prerequisiteIsConcrete] = true** (Single concrete item like "guitar picks", "textbook"):
  - Step 1 should focus on OBTAINING that specific item
  - Include WHERE to get it (store name, online, location)
  - Include WHEN (by [specific day before start day])
  - Examples:
    * "guitar picks" → "By Thursday, buy guitar picks at Guitar Center or order online from Amazon ($5-10)"
    * "algebra textbook" → "By Wednesday, borrow algebra textbook from school library or ask teacher for a copy"
    * "clear desk space" → "By Thursday evening, clear your desk: move 3 items to storage box, place the box on shelf"

**IF [prerequisiteIsConcrete] = false** (Vague/uncertain like "not sure where to find..."):
  - Step 1 becomes a RESEARCH/DISCOVERY step
  - MUST include specific search actions + specific people to ask
  - MUST result in a list/decision
  - Examples:
    * "not sure where to find guitar teacher" → "By Wednesday, ask your music teacher AND search 'guitar lessons near me'. Write down 3 options with prices."
    * "don't know what equipment I need" → "By Thursday, text 2 people who do [activity] and ask: 'What do I need to start?' Make a list."

- **Examples**: 
  * Goal: "Practice Spanish" + Concrete: "Spanish flashcards" → "By Thursday, buy Spanish verb flashcards at Target or order from Amazon. Place them on your desk."
  * Goal: "Learn guitar" + Uncertain: "not sure what type of guitar" → "By Wednesday, watch 1 YouTube video: 'Beginner guitars for teens'. Write down 2 guitar types that interest you."

Step 2: ACTIVATION CUE (AT EXACTLY [startTime])
- **Purpose**: Trivial activation to defeat the inertia barrier.
- **Constraint**: The physical action must take **< 15 seconds** to complete. It must be an initial touch, tap, or switch.
- **MUST REFERENCE**: The specific tool, app, or material for [Goal Title]
- **Allowed actions**: touch, open, unlock, tap (app icon), grab, hold, place, put on
- **Examples**: 
  * Goal: "Practice Spanish" → "At 7:00 PM Friday, tap the Duolingo app icon."
  * Goal: "Study algebra" → "At 8:00 AM Friday, open your algebra textbook to chapter 3."
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
` : `
[SUPPORTER FLOW STRUCTURE] (Focus: Environmental Control & Accountability)

Step 1: ENVIRONMENTAL SETUP (BEFORE [startTime])
- **Purpose**: Remove all potential physical and material obstacles.
- **Action**: What the supporter must do to ensure the workspace is ready (charging, clearing, providing materials).
- **MUST REFERENCE**: Specific materials for [Goal Title]

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

Step 2: CUE DELIVERY (AT EXACTLY [startTime])
- **Purpose**: Serve as the human prompt to initiate the activation step.
- **Action**: What the supporter says or does to trigger the individual's Step 2. Use language appropriate for the [Supporter Role].
- **MUST REFERENCE**: The specific tool/app/material for [Goal Title]
- **Examples**: 
  * Goal: "Study algebra" + Parent: "At 6:30 PM, hand them the pencil and say: 'Just touch the algebra textbook for 15 seconds.'"
  * Goal: "Practice Spanish" + Coach: "At 7:00 PM, text them: 'Time to tap the Duolingo app icon!'"
  * Goal: "Write a story" + Friend: "At 8:00 AM, send a message: 'Hey! Just open your writing notebook real quick.'"

Step 3: REINFORCEMENT (DURING WORK/AFTER COMPLETION)
- **Purpose**: Deliver positive, value-based reinforcement based on the [Motivation].
- **Action**: Specific action for monitoring progress and providing reinforcement.
- **MUST REFERENCE**: The specific goal action to connect praise to concrete accomplishment
- **NATURAL LANGUAGE**: Write in conversational, grammatically correct sentences. Avoid rigid template prefixes like "Your Action (Framing):". Use natural phrasing that flows well when read aloud.
- **Examples**: 
  * Goal: "Study algebra" → "After 25 minutes, check in and ensure they take a 5-minute movement break. Say: 'You worked through 10 algebra problems—solid effort!'"
  * Goal: "Practice Spanish" → "When they complete the task, connect it to their motivation: 'You practiced those Spanish verbs! This brings you closer to speaking confidently with your Spanish-speaking friends.'"
  * Goal: "Learn guitar" → "After 20 minutes, check in and say: 'You practiced those chords! You're getting closer to playing your favorite songs.'"
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

3. **No Clinical Jargon**: 
   - **FORBIDDEN WORDS**: "initiation", "barrier", "scaffolding", "activation cue"
   - **USE INSTEAD**: "start", "begin", "prepare", "work on", "focus", "search", "browse", "find"

4. **Grammatical Sense**:
   - Every sentence must be a complete, grammatically correct imperative
   - Read each step aloud—if it sounds awkward or confusing, rewrite it

5. **Logical Coherence**:
   - Step 1: Must happen BEFORE start time (prep actions)
   - Step 2: Must reference [startTime] exactly and be trivial workspace setup (< 15 sec)
   - Step 3: Must be substantive work (15+ min) with measurable outcome aligned to [Secondary Challenge]

6. **Action Specificity**:
   - Use concrete verbs: "write down", "solve", "call", "text" (in Step 1 or 3), "search" (Step 3 only), "browse" (Step 3 only)
   - Include measurable outcomes: "2-3 teams", "problems 1-10", "15 minutes", "3 names"

7. **Goal Action Specificity**:
   - Every step must reference the specific goal title or action
   - Never use generic language like "your work", "the task", "your materials"
   - Use domain-specific terms from the goal (e.g., "Spanish verbs", "algebra problems", "guitar chords")

8. **Supporter Flow - Use Individual's Name**:
   - When [supportedPersonName] is provided, use it consistently
   - Replace generic "them", "they" with the person's name in Step 1 and Step 3
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

function buildUserPrompt(payload: MicroStepsRequest): string {
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

  return `Generate 3 micro-steps for this goal:

**Goal**: ${payload.goalTitle}
**Category**: ${payload.category}
**Motivation**: ${payload.motivation || 'Not specified'}
**Start Day (startDayOfWeek)**: ${payload.startDayOfWeek}
**Start Time (startTime)**: ${payload.startTime}
**Flow**: ${payload.flow}
${payload.flow === 'supporter' && payload.supportedPersonName ? `**Individual's Name**: ${payload.supportedPersonName}` : ''}
${prerequisiteContext}
**Primary Challenge**: ${payload.barrier1}
**Secondary Challenge (IMPORTANT - use this for Step 3 Logic Mapping)**: ${payload.barrier2}

Generate exactly 3 micro-steps following the ${payload.flow.toUpperCase()} FLOW structure. Pay special attention to the [Secondary Challenge] when creating Step 3.`;
}

function validateMicroSteps(steps: { title: string; description: string }[], payload?: MicroStepsRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const forbiddenWords = ['initiation', 'barrier', 'scaffolding', 'activation cue'];
  const step2BannedVerbs = ['search', 'browse', 'research', 'find', 'read', 'write', 'call', 'text', 'login', 'boot'];
  const step2BannedPhrases = ['power button', 'press the power', 'turn on', 'boot up', 'reboot'];
  
  steps.forEach((step, i) => {
    const text = (step.title + ' ' + step.description).toLowerCase();
    
    // Check for jargon
    forbiddenWords.forEach(word => {
      if (text.includes(word)) {
        errors.push(`Step ${i+1} contains clinical jargon: "${word}"`);
      }
    });
    
    // NEW: Validate Step 1 if prerequisite involves uncertainty
    if (i === 0 && payload?.prerequisiteText) {
      const prereqLower = payload.prerequisiteText.toLowerCase();
      const uncertaintyKeywords = ['not sure', 'don\'t know', 'need to find', 'where to', 'how to', 'unsure'];
      const hasUncertainty = uncertaintyKeywords.some(kw => prereqLower.includes(kw));
      
      if (hasUncertainty) {
        // Step 1 should be a research/discovery step
        const researchVerbs = ['ask', 'text', 'search', 'google', 'look up', 'find out', 'watch', 'read', 'visit', 'call', 'email'];
        const hasResearchAction = researchVerbs.some(verb => text.includes(verb));
        
        if (!hasResearchAction) {
          errors.push('Step 1 must include a research/discovery action when prerequisite is uncertain (e.g., "ask 2 people", "search online")');
        }
        
        // Should include measurable outcome for research
        const hasMeasurableResearch = /\d+\s?(people|person|option|website|video|article|store|location)/i.test(text);
        if (!hasMeasurableResearch) {
          errors.push('Research step should include quantity (e.g., "ask 2 people", "find 3 options")');
        }
        
        // Should NOT use vague terms
        const vagueTerms = ['figure out', 'look into', 'explore options', 'do research'];
        const hasVagueTerm = vagueTerms.some(term => text.includes(term));
        if (hasVagueTerm) {
          errors.push('Research step is too vague - use specific actions like "ask [role]", "search [specific term]", "watch [specific content]"');
        }
      }
    }
    
    
    // Step 3 validations
    if (i === 2) {
      // Must reference minutes, not seconds
      if (step.description.match(/\d+\s?seconds/i)) {
        errors.push('Step 3 should not use "seconds" - use minutes (15+) for substantive work');
      }
      
      // Must mention minutes
      if (!step.description.match(/\d+\s?minut/i)) {
        errors.push('Step 3 must specify duration in minutes (e.g., "Set a 20-minute timer")');
      }
      
      // Check for measurable outcome (duration, quantity, or completion indicator)
      const hasDuration = /\d+[- ]minute/i.test(text);
      const hasQuantity = /\d+\s+(verb|problem|step|task|item|name|team|page|question|chapter|lesson|chord|word|phrase|exercise|set|rep|minute)/i.test(text);
      const hasCompletionVerb = /complete|finish|review|practice|identify|work through|analyze|study|solve|write down/i.test(text);
      
      if (!hasDuration && !hasQuantity && !hasCompletionVerb) {
        errors.push('Step 3 must include measurable outcome (duration, quantity, or completion indicator)');
      }
      
      // Suggestion (not requirement) based on secondary challenge
      if (payload?.barrier2) {
        const barrier2Lower = payload.barrier2.toLowerCase();
        const hasTimer = /timer|alarm|countdown/.test(text);
        const hasSequencing = /write|list|break.*into|sub-task|smaller task/.test(text);
        const hasTimeGoal = /\d+\s?minut.*complete|finish.*\d+\s?minut/.test(text);
        
        // Log suggestions for improvement, but don't reject
        if ((barrier2Lower.includes('focus') || barrier2Lower.includes('attention')) && !hasTimer) {
          console.log(`Suggestion: Step 3 could include a timed work sprint with movement break for Focus/Attention challenge`);
        }
        if (barrier2Lower.includes('planning') && !hasSequencing) {
          console.log(`Suggestion: Step 3 could include sequencing or breakdown task for Planning challenge`);
        }
        if (barrier2Lower.includes('time') && !hasTimeGoal) {
          console.log(`Suggestion: Step 3 could include a specific sub-task with time limit for Time Blindness challenge`);
        }
      }
    }
    
    // Check title length
    const titleWords = step.title.split(/\s+/).length;
    if (titleWords > 10) {
      errors.push(`Step ${i+1} title too long (${titleWords} words) - keep under 8 words`);
    }
    
    // Check sentence count (1-2 sentences)
    const sentenceCount = step.description.split(/[.!?]+/).filter(s => s.trim()).length;
    if (sentenceCount > 3) {
      errors.push(`Step ${i+1} has ${sentenceCount} sentences - keep to 1-2 imperative sentences`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}
