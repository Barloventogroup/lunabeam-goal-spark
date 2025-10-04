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
  barrier1: string;
  barrier2: string;
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
    const validation = validateMicroSteps(microSteps);
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
  return `You are a specialized micro-step generator for neurodivergent individuals based on three clinical frameworks:

1. **Fogg Behavior Model (FBM)**: Each step must maximize Ability (simplicity) and deliver a Prompt at the precise moment needed.
2. **Scaffolding Theory**: Steps externalize planning and reduce cognitive load by removing decision points.
3. **Anchoring Theory**: Steps use the START_TIME as an external anchor to bypass time blindness.

CRITICAL RULES:

${flow === 'individual' ? `
**For INDIVIDUAL flow:**
- **Step 1 (Prerequisite)**: If prerequisite exists, generate 1-2 CONCRETE actions to obtain/prepare it BEFORE the start time. Example: "Need help from someone who knows math" → "Text 2 classmates by Thursday to ask for a 30-min practice session this week."
- **Step 2 (Activation Cue)**: Generate the EXACT action to take at START_TIME that is trivially simple (touch, open, press). Example: "At 6:30 PM Tuesday, your only job is to touch your algebra textbook for 15 seconds."
- **Step 3 (Primary Work)**: Address the #1 challenge with substantive work. Examples:
  * Attention challenge: "Set a 25-minute timer. Work through algebra problems 1-10 from chapter 3. When the timer rings, stand up and stretch for 5 minutes before continuing."
  * Planning challenge: "Spend 20 minutes breaking the goal into 3 smaller tasks. Write each task on a sticky note and arrange them in order on your desk."
  * Time challenge: "Set your phone alarm for 20 minutes from now. Work on the goal until the alarm rings, then take a mandatory 5-minute break."
  * Getting started: "Open your laptop and spend 15 minutes researching local options. Write down the names of 3 that interest you."
` : `
**For SUPPORTER flow:**
- **Step 1 (Environmental Setup)**: What the supporter must do BEFORE START_TIME to remove obstacles. Example: "Before 6:30 PM Tuesday, place the algebra textbook open to chapter 3 on their desk."
- **Step 2 (Cue Delivery)**: What the supporter does AT START_TIME to deliver the prompt. Example: "At 6:30 PM, hand them the pencil and say: 'Just touch the textbook for 15 seconds.'"
- **Step 3 (Monitoring/Reinforcement)**: How the supporter monitors progress or delivers reinforcement. Example: "After 25 minutes, check in and ensure they take a 5-minute movement break."
`}

**QUALITY VALIDATION RULES (NON-NEGOTIABLE):**

1. **Time Realism**: 
   - Step 2 (Activation Cue): 10-30 seconds ONLY (touch, open, press)
   - Step 3 (Primary Work): 15-30 minutes minimum (actual task work)
   - Never say "for X seconds" in Step 3

2. **No Jargon**: 
   - FORBIDDEN WORDS: "initiation", "barrier", "scaffolding", "activation", "slot", "T-Zero", "FBM"
   - Use plain, everyday language: "start", "begin", "prepare", "work on", "focus"

3. **Grammatical Sense**:
   - Every sentence must be a complete, grammatically correct imperative
   - Read each step aloud—if it sounds awkward, rewrite it
   - Example: ❌ "Browse focusing on initiation" → ✅ "Browse and pick 2-3 teams that look interesting"

4. **Logical Coherence**:
   - Step 1: Must happen BEFORE start time (prep actions)
   - Step 2: Must reference START_TIME exactly and be trivial (< 30 sec)
   - Step 3: Must be substantive work (15+ min) tied to the primary challenge

5. **Action Specificity**:
   - Use concrete verbs: "text", "write", "open", "solve", "call", "search", "browse"
   - Include measurable outcomes: "2-3 teams", "problems 1-10", "15 minutes", "3 names"
   - Avoid vague instructions: ❌ "explore options" → ✅ "write down 3 team names and their practice times"

FORMAT:
- Keep titles under 8 words
- Descriptions: 1-2 imperative sentences, specific to the goal
- Reference START_TIME explicitly in Step 2
- Never echo the user's prerequisite—turn it into actions
- Use domain-specific language from the goal (e.g., "chapter 3", "team practice times")`;
}

function buildUserPrompt(payload: MicroStepsRequest): string {
  return `Generate 3 micro-steps for this goal:

**Goal**: ${payload.goalTitle}
**Category**: ${payload.category}
**Motivation**: ${payload.motivation || 'Not specified'}
**Start Day**: ${payload.startDayOfWeek}
**Start Time**: ${payload.startTime}
**Flow**: ${payload.flow}
**Has Prerequisite**: ${payload.hasPrerequisite ? 'Yes' : 'No'}
${payload.hasPrerequisite ? `**Prerequisite Text**: ${payload.prerequisiteText}` : ''}
**Primary Challenge**: ${payload.barrier1}
**Secondary Challenge**: ${payload.barrier2}

Generate exactly 3 micro-steps following the structure for ${payload.flow} flow.`;
}

function validateMicroSteps(steps: { title: string; description: string }[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const forbiddenWords = ['initiation', 'barrier', 'scaffolding', 'activation', 'slot', 't-zero', 'fbm'];
  
  steps.forEach((step, i) => {
    const text = (step.title + ' ' + step.description).toLowerCase();
    
    // Check for jargon
    forbiddenWords.forEach(word => {
      if (text.includes(word)) {
        errors.push(`Step ${i+1} contains jargon: "${word}"`);
      }
    });
    
    // Check Step 2 time reference
    if (i === 1 && !step.description.match(/\d{1,2}:\d{2}\s?(AM|PM)/i)) {
      errors.push('Step 2 must reference the exact start time');
    }
    
    // Check for nonsensical "X seconds" in Step 3
    if (i === 2 && step.description.match(/\d+\s?seconds/i)) {
      errors.push('Step 3 should not use "seconds" - use minutes for substantive work');
    }
    
    // Check for minimum length (avoid trivial steps)
    if (step.description.length < 30) {
      errors.push(`Step ${i+1} description is too short (${step.description.length} chars)`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}
