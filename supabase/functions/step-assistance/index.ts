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

    const { step, goal, userMessage, conversationHistory = [] } = requestBody;

    if (!step || !goal || !userMessage) {
      console.error('Missing required fields:', { step: !!step, goal: !!goal, userMessage: !!userMessage });
      return new Response(JSON.stringify({ error: 'Missing required fields: step, goal, or userMessage' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Step assistance request:', { 
      stepId: step?.id, 
      goalId: goal?.id, 
      userMessage: typeof userMessage === 'string' ? userMessage.substring(0, 100) : ''
    });

    // Count assistant responses in conversation history (ignore system and error messages)
    const assistantResponseCount = Array.isArray(conversationHistory)
      ? conversationHistory.filter((msg: any) => msg.role === 'assistant' && !(typeof msg.id === 'string' && msg.id.startsWith('error-'))).length
      : 0;
    console.log('assistantResponseCount:', assistantResponseCount);

    // Check for similar steps in prior weeks that have substeps
    const inheritedSubsteps = await checkForSimilarPriorSteps(step, goal);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Get completed and remaining steps for this goal to provide context
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment not configured');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Build context for the AI (avoid nested template literals)
    const isSubstep = !!(step.explainer && String(step.explainer).includes('This is a substep of'));

    const modeLine = isSubstep
      ? `SUBSTEP MODE: Only help with \"${step.title}\" - do not suggest breaking it down further or creating additional substeps`
      : `MAIN STEP MODE: Focus on \"${step.title}\" - may suggest substeps if needed`;

    const guidanceBlock = isSubstep
      ? `\nSUBSTEP GUIDANCE RULES:\n- DO NOT suggest breaking \"${step.title}\" into smaller pieces\n- Provide direct, actionable advice for completing this specific task\n- Keep responses under 100 words\n- Focus on HOW to do this specific thing\n`
      : `\nMAIN STEP GUIDANCE RULES:\nONLY suggest breaking THIS step into sub-steps if:\n- They ask for help with this step\n- They say this step feels overwhelming\n- They ask \"how do I start\" this step\n\nIf you do suggest sub-steps, they must ALL relate to \"${step.title}\" and format them like this:\n[SUB-STEPS]\n1. Sub-step Title | Brief description specific to \"${step.title}\" (estimated time)\n2. Another Sub-step | Another description for \"${step.title}\" (estimated time)\n[/SUB-STEPS]\n\nDE-DUPLICATION RULES (critical):\n- Do NOT include two sub-steps that achieve the same objective with different wording.\n- Merge near-duplicates into a single, clear action.\n- Examples of duplicates to avoid (pick only ONE phrasing):\n  - \"Choose a Simple Recipe\" vs \"Pick a Simple Recipe\"\n  - \"Follow the Steps\" vs \"Follow the Recipe Step-by-Step\"\n- Each title must represent a distinct action with a unique outcome.\n- Prefer concise, action-first titles; put nuance in the description.\n`;

    const systemPrompt = `You are Luna, a helpful AI assistant designed for teenagers and young adults (16-25) working on their goals.\n\nCurrent Goal: \"${goal.title}\"\nGoal Description: ${goal.description || 'No description provided'}\nGoal Domain: ${goal.domain || 'General'}\n\n${progressContext}\n\nCURRENT STEP FOCUS: \"${step.title}\"\nStep Description: ${step.notes || step.explainer || 'No description provided'}\nEstimated Time: ${step.estimated_effort_min ? `${step.estimated_effort_min} minutes` : 'Not specified'}\n\nYour communication style:\n- Be concise and focused - you have limited responses\n- Talk like a supportive friend who gets their struggles\n- Use relatable examples from their world: social media, gaming, apps\n- Keep responses under 150 words when possible\n\nUse quick analogies they'll connect with:\n- \"Like organizing your phone apps\"\n- \"Similar to learning a new game - start simple\"\n- \"Think of it like creating content - plan, create, share\"\n\nCRITICAL RULES:\n1. ${modeLine}\n2. Analyze what they've completed to understand their progress pattern\n3. ${isSubstep ? 'Provide direct action steps for this specific substep' : 'Provide sub-steps ONLY for the current step in question'}\n4. Stay laser-focused on the current ${isSubstep ? 'substep' : 'step'}\n\nYour role is to:\n1. Answer their specific questions about THIS ${isSubstep ? 'SUBSTEP' : 'STEP'} only\n2. ${isSubstep ? 'Give direct, specific guidance for completing this substep' : 'Break down THIS STEP into smaller, manageable sub-steps'}\n3. Give practical advice for completing THIS SPECIFIC ${isSubstep ? 'SUBSTEP' : 'STEP'}\n4. Stay laser-focused on the current ${isSubstep ? 'substep' : 'step'}\n\n${guidanceBlock}\n\nBe supportive but keep it brief and focused on THIS ${isSubstep ? 'SUBSTEP' : 'STEP'} ONLY.`;

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

    // Parse potential sub-steps from the response
    const suggestedSteps = dedupeSubSteps(parseSubSteps(assistantResponse, step, goal));

    // Combine AI suggested steps with inherited substeps from similar prior weeks
    let allSteps = [...suggestedSteps];
    if (inheritedSubsteps.length > 0 && suggestedSteps.length === 0) {
      // Only auto-inherit if no new steps were suggested by AI
      allSteps = inheritedSubsteps;
      console.log(`Auto-inheriting ${inheritedSubsteps.length} substeps from similar prior week steps`);
    }

    // Check if substeps already exist for this step
    const existingSubsteps = await checkExistingSubsteps(step.id);
    
    // If sub-steps were suggested or inherited, create them in the database (only if none exist)
    let createdSteps: any[] = [];
    if (allSteps.length > 0 && existingSubsteps.length === 0) {
      createdSteps = await createSubSteps(allSteps, step, goal);
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

  return lines.map((line) => {
    const match = line.match(/^\d+\.\s*(.+?)\s*\|\s*(.+?)(?:\s*\((\d+)\s*minutes?\))?$/);
    if (!match) return null;

    const [, title, description] = match;

    return {
      title: String(title).trim(),
      description: String(description).trim(),
      step_id: parentStep.id,
      is_planned: false,
    };
  }).filter(Boolean) as any[];
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

async function checkForSimilarPriorSteps(currentStep: any, goal: any): Promise<any[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) return [];
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Extract week info from current step title (e.g., "Week 3, Session 1: Walk")
  const weekMatch = String(currentStep.title).match(/Week (\d+)/);
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
    const baseActivity = String(currentStep.title).replace(/Week \d+, Session \d+:\s*/, '');
    const similarPriorSteps = (allSteps as any[]).filter((step: any) => {
      const stepWeekMatch = String(step.title).match(/Week (\d+)/);
      if (!stepWeekMatch) return false;
      
      const stepWeek = parseInt(stepWeekMatch[1]);
      const stepActivity = String(step.title).replace(/Week \d+, Session \d+:\s*/, '');
      
      return stepWeek < currentWeek && stepActivity === baseActivity;
    });

    if (similarPriorSteps.length === 0) return [];

    // Find the most recent similar step that has substeps
    const mostRecentSimilar = similarPriorSteps.reduce((latest: any, s: any) => {
      const stepWeek = parseInt(String(s.title).match(/Week (\d+)/)?.[1] || '0');
      const latestWeek = parseInt(String(latest.title).match(/Week (\d+)/)?.[1] || '0');
      return stepWeek > latestWeek ? s : latest;
    });

    // Get substeps for the most recent similar step
    const { data: substeps, error: substepsError } = await supabase
      .from('steps')
      .select('*')
      .eq('goal_id', goal.id)
      .gt('order_index', mostRecentSimilar.order_index)
      .lt('order_index', mostRecentSimilar.order_index + 10)
      .order('order_index');

    if (substepsError || !substeps || substeps.length === 0) {
      return [];
    }

    // Filter out main milestone steps, keep only substeps
    const actualSubsteps = (substeps as any[]).filter((s: any) => 
      !String(s.title).match(/Week \d+, Session \d+:/) && 
      s.order_index > mostRecentSimilar.order_index
    );

    if (actualSubsteps.length === 0) return [];

    console.log(`Found ${actualSubsteps.length} substeps from similar prior week step`);

    // Convert substeps to the format expected by createSubSteps
    return actualSubsteps.map((substep: any, index: number) => ({
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
