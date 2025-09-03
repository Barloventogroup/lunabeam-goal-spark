import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { step, goal, userMessage, conversationHistory } = await req.json();
    
    console.log('Step assistance request:', { 
      stepId: step.id, 
      goalId: goal.id, 
      userMessage: userMessage.substring(0, 100) 
    });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Build context for the AI
    const systemPrompt = `You are a helpful AI assistant that specializes in breaking down goals and tasks into manageable, actionable steps. 

Current Goal: "${goal.title}"
Goal Description: ${goal.description || 'No description provided'}
Goal Domain: ${goal.domain || 'General'}

Current Step: "${step.title}"
Step Description: ${step.notes || step.explainer || 'No description provided'}
Estimated Time: ${step.estimated_effort_min ? `${step.estimated_effort_min} minutes` : 'Not specified'}

Your role is to:
1. Help users understand what exactly needs to be done for this step
2. Explain WHY each step is important and how it contributes to their goal
3. Break down complex steps into smaller, more manageable sub-steps
4. Provide specific, actionable guidance
5. Suggest concrete examples or resources when helpful
6. If the user is struggling with the step, offer to create additional sub-steps

When suggesting new sub-steps, provide them in a structured format at the end of your response like this:
[SUB-STEPS]
1. Step Title | Brief description explaining what to do and why it matters (2-3 minutes)
2. Another Step | Another description with clear reasoning for its importance (5 minutes)
[/SUB-STEPS]

Be encouraging, practical, and focused on making progress achievable. Always explain the "why" behind actions to help users understand the purpose and stay motivated.`;

    // Prepare conversation history for context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-4).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    // Parse potential sub-steps from the response
    const suggestedSteps = parseSubSteps(assistantResponse, step, goal);

    // If sub-steps were suggested, create them in the database
    let createdSteps = [];
    if (suggestedSteps.length > 0) {
      createdSteps = await createSubSteps(suggestedSteps, step, goal);
    }

    return new Response(JSON.stringify({
      response: assistantResponse.replace(/\[SUB-STEPS\][\s\S]*?\[\/SUB-STEPS\]/g, '').trim(),
      suggestedSteps: createdSteps
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in step-assistance function:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred while processing your request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseSubSteps(response: string, parentStep: any, goal: any): any[] {
  const subStepsMatch = response.match(/\[SUB-STEPS\]([\s\S]*?)\[\/SUB-STEPS\]/);
  if (!subStepsMatch) return [];

  const subStepsText = subStepsMatch[1].trim();
  const lines = subStepsText.split('\n').filter(line => line.trim());

  return lines.map((line, index) => {
    const match = line.match(/^\d+\.\s*(.+?)\s*\|\s*(.+?)(?:\s*\((\d+)\s*minutes?\))?$/);
    if (!match) return null;

    const [, title, description, timeStr] = match;
    const estimatedTime = timeStr ? parseInt(timeStr) : undefined;

    return {
      title: title.trim(),
      notes: description.trim(),
      estimated_effort_min: estimatedTime,
      goal_id: goal.id,
      is_required: true,
      order_index: (parentStep.order_index || 0) + index + 1
    };
  }).filter(Boolean);
}

async function createSubSteps(subSteps: any[], parentStep: any, goal: any) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Creating ${subSteps.length} sub-steps for step ${parentStep.id}`);

  const createdSteps = [];
  
  for (const subStep of subSteps) {
    try {
      const { data, error } = await supabase
        .from('steps')
        .insert(subStep)
        .select()
        .single();

      if (error) {
        console.error('Error creating sub-step:', error);
        continue;
      }

      createdSteps.push(data);
      console.log('Created sub-step:', data.title);
    } catch (error) {
      console.error('Error inserting sub-step:', error);
    }
  }

  return createdSteps;
}