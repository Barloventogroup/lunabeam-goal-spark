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

    // Check for similar steps in prior weeks that have substeps
    const inheritedSubsteps = await checkForSimilarPriorSteps(step, goal);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Build context for the AI
    const systemPrompt = `You are Luna, a helpful AI assistant designed for teenagers and young adults (16-25) working on their goals.

Current Goal: "${goal.title}"
Goal Description: ${goal.description || 'No description provided'}
Goal Domain: ${goal.domain || 'General'}

Current Step: "${step.title}"
Step Description: ${step.notes || step.explainer || 'No description provided'}
Estimated Time: ${step.estimated_effort_min ? `${step.estimated_effort_min} minutes` : 'Not specified'}

Your communication style:
- Talk like a knowledgeable friend who gets the struggles of being their age
- Use relatable examples from their world: social media, streaming, gaming, school/work, apps they use
- Be encouraging but realistic about challenges

Use analogies and examples they'll connect with:
- "Think of it like creating a good Instagram post - you plan, draft, edit, then post"
- "It's like when you're binge-watching a series - some episodes set up what happens next"
- "Similar to learning a new game - start with the tutorial before jumping into harder levels"
- "Like organizing your phone apps - group similar things together to find them easier"
- "Think of dependencies like group chat messages - some responses only make sense after reading earlier ones"

Your role is to:
1. Answer their specific questions in a relatable way
2. Give practical advice using examples from their daily life
3. Explain things clearly without being condescending
4. Provide encouragement that acknowledges their real challenges

ONLY suggest breaking a step into sub-steps if:
- They explicitly ask for help breaking it down
- They say they're overwhelmed or the step feels too big
- They ask "how do I start" or "what do I do first"

If you do suggest sub-steps, format them like this at the end:
[SUB-STEPS]
1. Step Title | Brief description (estimated time)
2. Another Step | Another description (estimated time)
[/SUB-STEPS]

Be conversational and supportive. Use their language and references they'll actually understand.`;

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

    // Combine AI suggested steps with inherited substeps from similar prior weeks
    let allSteps = [...suggestedSteps];
    if (inheritedSubsteps.length > 0 && suggestedSteps.length === 0) {
      // Only auto-inherit if no new steps were suggested by AI
      allSteps = inheritedSubsteps;
      console.log(`Auto-inheriting ${inheritedSubsteps.length} substeps from similar prior week steps`);
    }

    // If sub-steps were suggested or inherited, create them in the database
    let createdSteps = [];
    if (allSteps.length > 0) {
      createdSteps = await createSubSteps(allSteps, step, goal);
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

async function checkForSimilarPriorSteps(currentStep: any, goal: any): Promise<any[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Extract week info from current step title (e.g., "Week 3, Session 1: Walk")
  const weekMatch = currentStep.title.match(/Week (\d+)/);
  if (!weekMatch) return [];

  const currentWeek = parseInt(weekMatch[1]);
  if (currentWeek <= 1) return []; // No prior weeks to check

  try {
    // Get all steps for this goal
    const { data: allSteps, error } = await supabase
      .from('steps')
      .select('*')
      .eq('goal_id', goal.id)
      .order('order_index');

    if (error || !allSteps) {
      console.error('Error fetching steps for similarity check:', error);
      return [];
    }

    // Find similar steps from prior weeks
    const baseActivity = currentStep.title.replace(/Week \d+, Session \d+:\s*/, '');
    const similarPriorSteps = allSteps.filter(step => {
      const stepWeekMatch = step.title.match(/Week (\d+)/);
      if (!stepWeekMatch) return false;
      
      const stepWeek = parseInt(stepWeekMatch[1]);
      const stepActivity = step.title.replace(/Week \d+, Session \d+:\s*/, '');
      
      return stepWeek < currentWeek && stepActivity === baseActivity;
    });

    if (similarPriorSteps.length === 0) return [];

    // Find the most recent similar step that has substeps
    const mostRecentSimilar = similarPriorSteps.reduce((latest, step) => {
      const stepWeek = parseInt(step.title.match(/Week (\d+)/)?.[1] || '0');
      const latestWeek = parseInt(latest.title.match(/Week (\d+)/)?.[1] || '0');
      return stepWeek > latestWeek ? step : latest;
    });

    // Get substeps for the most recent similar step
    const { data: substeps, error: substepsError } = await supabase
      .from('steps')
      .select('*')
      .eq('goal_id', goal.id)
      .gt('order_index', mostRecentSimilar.order_index)
      .lt('order_index', mostRecentSimilar.order_index + 10) // Reasonable range for substeps
      .order('order_index');

    if (substepsError || !substeps || substeps.length === 0) {
      return [];
    }

    // Filter out main milestone steps, keep only substeps
    const actualSubsteps = substeps.filter(step => 
      !step.title.match(/Week \d+, Session \d+:/) && 
      step.order_index > mostRecentSimilar.order_index
    );

    if (actualSubsteps.length === 0) return [];

    console.log(`Found ${actualSubsteps.length} substeps from similar prior week step`);

    // Convert substeps to the format expected by createSubSteps
    return actualSubsteps.map((substep, index) => ({
      title: substep.title,
      notes: substep.notes || substep.explainer,
      estimated_effort_min: substep.estimated_effort_min,
      goal_id: goal.id,
      is_required: substep.is_required,
      order_index: (currentStep.order_index || 0) + index + 1
    }));

  } catch (error) {
    console.error('Error in checkForSimilarPriorSteps:', error);
    return [];
  }
}