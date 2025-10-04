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
    const { 
      individualName, 
      prerequisiteDetail, 
      primaryMotivation, 
      startTime, 
      startDay, 
      supporterRole,
      goalTitle 
    } = await req.json();

    console.log('Supporter scaffold request:', { individualName, goalTitle, supporterRole });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a specialized coach micro-step generator for parents/supporters of neurodivergent individuals.

FRAMEWORK: Generate exactly 3 mandatory setup steps that prepare the SUPPORTER to facilitate the individual's success.

**CRITICAL REQUIREMENT:**
Every step must explicitly reference the goal title "${goalTitle}" and the individual's name "${individualName}."

**3-STEP STRUCTURE (MANDATORY):**

Step 1: LOGISTICAL & ENVIRONMENTAL SETUP (BEFORE ${startDay} morning)
- **Purpose**: Remove physical/structural barriers for ${individualName}
- **Logic**: Use prerequisite "${prerequisiteDetail}" if provided, otherwise general workspace prep
- **Format**: "Your Action (Set Up): Ensure the workspace is ready for ${individualName}'s ${goalTitle}. Handle the missing item: ${prerequisiteDetail} and place it near the start location by ${startDay} morning."
- **Example**: "Your Action (Set Up): Ensure Sarah's workspace is ready for her algebra homework. Handle the missing item: a fresh, clean folder for her notes and place it on her desk by Tuesday morning."

Step 2: ACCOUNTABILITY & SUPPORT CUE (5 minutes before ${startTime})
- **Purpose**: Anchor your support action to the scheduled time
- **Logic**: Use supporter role "${supporterRole}" to define your presence
- **Format**: "Your Action (Support): Set a calendar reminder for 5 minutes before ${startTime} to execute your role of ${supporterRole} with ${individualName}. Your physical presence/check-in is the cue!"
- **Example**: "Your Action (Support): Set a calendar reminder for 5 minutes before 17:00 to execute your role of Active Co-working (Side-by-side) with Sarah. Your physical presence is the cue!"

Step 3: FRAMING & REINFORCEMENT STRATEGY (During/After completion)
- **Purpose**: Define how to praise ${individualName}'s effort based on their motivation
- **Logic**: Use motivation "${primaryMotivation}" to frame reinforcement
- **Format**: "Your Action (Framing): Use your chosen frame (${primaryMotivation}) to praise ${individualName}'s effort with ${goalTitle} (even just starting!), not just completion, in the first 72 hours."
- **Example**: "Your Action (Framing): Use your chosen frame (Focus on Independence) to praise Sarah's effort with her algebra homework (even just starting!), not just completion, in the first 72 hours."

VALIDATION RULES:
- Must generate exactly 3 steps
- Each step must reference ${individualName} and ${goalTitle}
- Step 1 must include prerequisite handling
- Step 2 must include exact time and supporter role
- Step 3 must connect to primary motivation`;

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
          { 
            role: 'user', 
            content: `Generate 3 supporter micro-steps for helping ${individualName} with "${goalTitle}". Use the context provided.` 
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_supporter_microsteps",
            description: "Generate 3 coach/parent support actions",
            parameters: {
              type: "object",
              properties: {
                supporterSteps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", maxLength: 80 },
                      description: { type: "string", maxLength: 350 }
                    },
                    required: ["title", "description"]
                  },
                  minItems: 3,
                  maxItems: 3
                }
              },
              required: ["supporterSteps"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_supporter_microsteps" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      // Return fallback
      const fallbackSteps = [
        {
          title: `Your Action (Set Up): Prepare ${individualName}'s workspace`,
          description: `Before ${startDay} morning, ensure all materials for "${goalTitle}" are ready and accessible. Remove any obstacles or distractions from their workspace.`
        },
        {
          title: `Your Action (Support): Check in at ${startTime}`,
          description: `Set a calendar reminder for 5 minutes before ${startTime} to provide your ${supporterRole} support. Your physical presence or check-in is the cue for ${individualName} to start.`
        },
        {
          title: `Your Action (Framing): Praise effort, not just results`,
          description: `When ${individualName} completes their "${goalTitle}" session, connect it to their motivation (${primaryMotivation}). Focus on celebrating the effort of starting and working, not just the final outcome.`
        }
      ];

      return new Response(
        JSON.stringify({ supporterSteps: fallbackSteps }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function) {
      const args = JSON.parse(toolCall.function.arguments);
      console.log('Generated supporter steps:', args.supporterSteps);
      
      return new Response(
        JSON.stringify({ supporterSteps: args.supporterSteps }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback if no tool call
    const fallbackSteps = [
      {
        title: `Your Action (Set Up): Prepare ${individualName}'s workspace`,
        description: `Before ${startDay} morning, ensure all materials for "${goalTitle}" are ready and accessible.`
      },
      {
        title: `Your Action (Support): Check in at ${startTime}`,
        description: `Set a calendar reminder for 5 minutes before ${startTime} to provide your ${supporterRole} support.`
      },
      {
        title: `Your Action (Framing): Praise effort, not just results`,
        description: `When ${individualName} works on "${goalTitle}", connect it to their motivation (${primaryMotivation}).`
      }
    ];

    return new Response(
      JSON.stringify({ supporterSteps: fallbackSteps }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in supporter-microsteps-scaffold:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});