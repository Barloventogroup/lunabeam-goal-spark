import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const {
      goalTitle,
      category,
      startDayOfWeek,
      startTime,
      hasPrerequisite,
      prerequisiteText,
      barrier1,
      barrier2
    } = payload;

    if (!goalTitle) {
      return new Response(JSON.stringify({ error: 'goalTitle is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let attempt = 0;
    const maxAttempts = 2;
    let bestSteps: any = null;
    let bestValidation: any = { valid: false, errors: [] };

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`Attempt ${attempt}: Generating individual micro-steps`);

      const prompt = attempt === 1 
        ? buildUserPrompt(payload)
        : buildRefinementPrompt(payload, bestSteps, bestValidation.errors);

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: prompt }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'generate_individual_microsteps',
              description: 'Generate 3 actionable micro-steps for an individual to achieve their goal',
              parameters: {
                type: 'object',
                properties: {
                  microSteps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Short, action-oriented title (5-8 words max)' },
                        description: { type: 'string', description: 'Clear description of what they will do' }
                      },
                      required: ['title', 'description'],
                      additionalProperties: false
                    },
                    minItems: 3,
                    maxItems: 3
                  }
                },
                required: ['microSteps'],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'generate_individual_microsteps' } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Insufficient credits. Please add funds to continue.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        throw new Error(`AI Gateway failed: ${response.status}`);
      }

      const aiResponse = await response.json();
      console.log(`Attempt ${attempt} - AI response received`);

      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        throw new Error('No tool call in AI response');
      }

      const parsedArgs = JSON.parse(toolCall.function.arguments);
      const steps = parsedArgs.microSteps;

      if (!steps || !Array.isArray(steps) || steps.length !== 3) {
        throw new Error('Invalid steps format from AI');
      }

      const validation = validateMicroSteps(steps, payload);
      
      if (validation.valid) {
        console.log(`Attempt ${attempt}: Validation passed`);
        return new Response(JSON.stringify({ microSteps: steps }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!bestSteps || validation.errors.length < bestValidation.errors.length) {
        bestSteps = steps;
        bestValidation = validation;
      }

      console.log(`Attempt ${attempt}: Validation failed with ${validation.errors.length} errors:`, validation.errors);
    }

    // After max attempts, accept best result if minor issues
    if (bestValidation.errors.length <= 2) {
      console.log('Accepting best attempt with minor issues');
      return new Response(JSON.stringify({ microSteps: bestSteps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // No fallback - return error
    return new Response(JSON.stringify({ 
      error: 'Unable to generate quality steps after refinement. Please try rephrasing your goal.',
      validationErrors: bestValidation.errors
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in individual-microsteps:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildSystemPrompt(): string {
  return `You are a micro-step generator for individuals with executive function challenges.

FRAMEWORK RULES:
- Generate EXACTLY 3 steps
- Use first-person perspective ("I will...", "Set timer...", "Work for...")
- Each step must be immediately actionable
- Include specific time references (minutes, not seconds)
- Focus on executive function scaffolding

STEP STRUCTURE:
Step 1: Prerequisite check or activation cue
- If prerequisite is uncertain: "Check if [prerequisite] is ready"
- If prerequisite is concrete: Start with activation cue

Step 2: Brief focused work session
- Must include time limit in MINUTES (e.g., "5 minutes", "10 minutes")
- Must be measurable and concrete

Step 3: Measurable outcome check
- Must specify duration/quantity
- Must include specific time reference in MINUTES
- Must have clear completion criteria

CRITICAL QUALITY RULES:
1. NO clinical jargon (avoid: "executive function", "working memory", "cognitive load")
2. NO vague language (avoid: "as needed", "when ready", "if possible")
3. Time references must be in MINUTES only (not seconds, not hours unless very long tasks)
4. Titles must be 5-8 words maximum
5. Steps must flow logically and build on each other`;
}

function buildUserPrompt(payload: any): string {
  return `Generate 3 actionable micro-steps for this goal:

Goal: ${payload.goalTitle}
Category: ${payload.category}
Start: ${payload.startDayOfWeek} at ${payload.startTime}
${payload.hasPrerequisite ? `Prerequisites: ${payload.prerequisiteText}` : 'No prerequisites mentioned'}
Challenges: ${payload.barrier1}, ${payload.barrier2}

Focus on what the INDIVIDUAL will do themselves. Use first-person language.`;
}

function buildRefinementPrompt(payload: any, failedSteps: any[], errors: string[]): string {
  return `The previous steps had these issues:
${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Previous attempt:
${failedSteps.map((s, i) => `Step ${i + 1}: ${s.title}\n${s.description}`).join('\n\n')}

Generate 3 NEW actionable micro-steps for this goal, fixing the issues above:

Goal: ${payload.goalTitle}
Category: ${payload.category}
Start: ${payload.startDayOfWeek} at ${payload.startTime}
${payload.hasPrerequisite ? `Prerequisites: ${payload.prerequisiteText}` : 'No prerequisites mentioned'}
Challenges: ${payload.barrier1}, ${payload.barrier2}`;
}

function validateMicroSteps(steps: any[], payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const jargonTerms = [
    'executive function', 'working memory', 'cognitive load', 'attentional control',
    'self-regulation', 'metacognition', 'inhibitory control', 'task initiation',
    'planning and organization', 'emotional regulation'
  ];

  steps.forEach((step, idx) => {
    const combined = `${step.title} ${step.description}`.toLowerCase();
    
    // Check for jargon
    jargonTerms.forEach(term => {
      if (combined.includes(term)) {
        errors.push(`Step ${idx + 1}: Contains clinical jargon "${term}"`);
      }
    });

    // Title length check
    const titleWords = step.title.trim().split(/\s+/).length;
    if (titleWords > 8) {
      errors.push(`Step ${idx + 1}: Title too long (${titleWords} words, max 8)`);
    }

    // Step 1 specific validation
    if (idx === 0 && payload.hasPrerequisite) {
      const prerequisiteIsUncertain = !payload.prerequisiteText || 
        payload.prerequisiteText.toLowerCase().includes('not sure') ||
        payload.prerequisiteText.toLowerCase().includes('maybe') ||
        payload.prerequisiteText.toLowerCase().includes('might need');
      
      if (prerequisiteIsUncertain && !combined.includes('check')) {
        errors.push('Step 1: Should start with "Check if" when prerequisite is uncertain');
      }
    }

    // Step 3 specific validation (time + measurable outcome)
    if (idx === 2) {
      const hasMinutes = /\d+\s*(?:min|minute)/i.test(combined);
      const hasSeconds = /\d+\s*(?:sec|second)/i.test(combined);
      
      if (hasSeconds) {
        errors.push('Step 3: Use minutes instead of seconds');
      }
      if (!hasMinutes) {
        errors.push('Step 3: Must include specific duration in minutes');
      }

      const hasMeasurableOutcome = /\d+/.test(combined) && 
        (combined.includes('complete') || combined.includes('finish') || 
         combined.includes('done') || combined.includes('achieve'));
      
      if (!hasMeasurableOutcome) {
        errors.push('Step 3: Must have measurable outcome (e.g., "Complete 3 problems in 10 minutes")');
      }
    }
  });

  return { valid: errors.length === 0, errors };
}
