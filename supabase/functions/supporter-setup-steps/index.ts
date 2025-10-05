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
      motivation,
      supportedPersonName,
      startDayOfWeek,
      startTime,
      hasPrerequisite,
      prerequisiteText,
      barrier1,
      barrier2
    } = payload;

    if (!goalTitle || !motivation) {
      return new Response(JSON.stringify({ error: 'goalTitle and motivation are required' }), {
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
      console.log(`Attempt ${attempt}: Generating supporter setup steps`);

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
              name: 'generate_supporter_setup_steps',
              description: 'Generate 3 setup/facilitation steps for a supporter',
              parameters: {
                type: 'object',
                properties: {
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Short, action-oriented title (5-8 words max)' },
                        description: { type: 'string', description: 'Clear description of supporter action' }
                      },
                      required: ['title', 'description'],
                      additionalProperties: false
                    },
                    minItems: 3,
                    maxItems: 3
                  }
                },
                required: ['steps'],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'generate_supporter_setup_steps' } }
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
      const steps = parsedArgs.steps;

      if (!steps || !Array.isArray(steps) || steps.length !== 3) {
        throw new Error('Invalid steps format from AI');
      }

      const validation = validateSupporterSteps(steps, payload);
      
      if (validation.valid) {
        console.log(`Attempt ${attempt}: Validation passed`);
        return new Response(JSON.stringify({ steps }), {
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
      return new Response(JSON.stringify({ steps: bestSteps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // No fallback - return error
    return new Response(JSON.stringify({ 
      error: 'Unable to generate quality supporter steps after refinement. Please try breaking down the goal into smaller pieces.',
      validationErrors: bestValidation.errors
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in supporter-setup-steps:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildSystemPrompt(): string {
  return `You are generating setup/facilitation steps for a SUPPORTER helping someone achieve a goal.

FRAMEWORK RULES:
- Generate EXACTLY 3 steps
- Use supporter perspective ("Hand them...", "Stay nearby...", "Check in...")
- Focus on environmental setup, scaffolding, and encouragement
- Connect actions to the WHY/motivation

STEP STRUCTURE:
Step 1: WHY this support matters
- Reference the motivation
- Explain the connection to the goal
- Set the supportive tone

Step 2: Environmental setup / preparation
- What materials/space to prepare
- How to reduce barriers
- Concrete setup actions

Step 3: When and how to provide support
- Specific timing for check-ins
- How to encourage without taking over
- When to celebrate progress

CRITICAL QUALITY RULES:
1. NO clinical jargon (avoid: "executive function", "scaffolding", "cognitive support")
2. Use natural, supportive language
3. Reference the motivation/WHY in at least one step
4. Use third-person facilitation language ("Hand them...", not "I will...")
5. Titles must be 5-8 words maximum
6. Focus on support actions, not the individual's actions`;
}

function buildUserPrompt(payload: any): string {
  return `Generate 3 setup/facilitation steps for a SUPPORTER helping ${payload.supportedPersonName || 'the individual'} with this goal:

Goal: ${payload.goalTitle}
Category: ${payload.category}
WHY this matters (motivation): ${payload.motivation}
Start: ${payload.startDayOfWeek} at ${payload.startTime}
${payload.hasPrerequisite ? `Prerequisites needed: ${payload.prerequisiteText}` : 'No prerequisites mentioned'}
Challenges to address: ${payload.barrier1}, ${payload.barrier2}

Focus on what the SUPPORTER will do to facilitate success. Use third-person language.
Include WHY this support matters based on the motivation.`;
}

function buildRefinementPrompt(payload: any, failedSteps: any[], errors: string[]): string {
  return `The previous steps had these issues:
${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Previous attempt:
${failedSteps.map((s, i) => `Step ${i + 1}: ${s.title}\n${s.description}`).join('\n\n')}

Generate 3 NEW supporter setup steps, fixing the issues above:

Goal: ${payload.goalTitle}
Category: ${payload.category}
WHY this matters (motivation): ${payload.motivation}
Start: ${payload.startDayOfWeek} at ${payload.startTime}
${payload.hasPrerequisite ? `Prerequisites needed: ${payload.prerequisiteText}` : 'No prerequisites mentioned'}
Challenges to address: ${payload.barrier1}, ${payload.barrier2}`;
}

function validateSupporterSteps(steps: any[], payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const jargonTerms = [
    'executive function', 'working memory', 'cognitive load', 'scaffolding',
    'attentional control', 'self-regulation', 'metacognition', 'inhibitory control'
  ];

  const combinedText = steps.map(s => `${s.title} ${s.description}`.toLowerCase()).join(' ');

  // Check for jargon
  jargonTerms.forEach(term => {
    if (combinedText.includes(term)) {
      errors.push(`Contains clinical jargon "${term}" - use natural language`);
    }
  });

  // Check for motivation reference
  const motivationKeywords = payload.motivation.toLowerCase().split(/\s+/);
  const hasMotivationReference = motivationKeywords.some(keyword => 
    keyword.length > 3 && combinedText.includes(keyword)
  );
  
  if (!hasMotivationReference) {
    errors.push('Should reference the motivation/WHY in at least one step');
  }

  // Check for supporter perspective
  const supporterPhrases = ['hand them', 'check in', 'stay nearby', 'prepare', 'set up', 
                            'celebrate', 'encourage', 'help them', 'provide', 'ensure'];
  const hasSupporterPerspective = supporterPhrases.some(phrase => combinedText.includes(phrase));
  
  if (!hasSupporterPerspective) {
    errors.push('Steps should use supporter perspective (e.g., "Hand them...", "Check in...")');
  }

  steps.forEach((step, idx) => {
    // Title length check
    const titleWords = step.title.trim().split(/\s+/).length;
    if (titleWords > 8) {
      errors.push(`Step ${idx + 1}: Title too long (${titleWords} words, max 8)`);
    }
  });

  return { valid: errors.length === 0, errors };
}
