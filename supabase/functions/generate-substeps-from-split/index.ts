import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stepId, goalContext, userMessage } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get step details
    const { data: step, error: stepError } = await supabaseClient
      .from('steps')
      .select('*')
      .eq('id', stepId)
      .single();

    if (stepError || !step) {
      throw new Error('Step not found');
    }

    // Call AI to generate substeps using OpenAI
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that breaks down tasks into smaller, manageable substeps for neurodiverse individuals. You MUST return ONLY valid JSON in the format: {"substeps": [{"title": "...", "description": "..."}]}. Do not include any other text or markdown formatting.'
          },
          {
            role: 'user',
            content: `Break down this step into 2-4 smaller, concrete substeps:\n\nStep: ${step.title}\nDescription: ${step.explainer || step.notes || ''}\n\nGoal context: ${goalContext}\nUser feedback: ${userMessage}\n\nProvide substeps as a JSON object with this exact structure:\n{\n  "substeps": [\n    {"title": "First substep", "description": "What to do"},\n    {"title": "Second substep", "description": "Next action"}\n  ]\n}\n\nEach substep should be:\n1. Specific and actionable\n2. Small enough to complete in 5-15 minutes\n3. Concrete with clear completion criteria\n4. In logical order`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    let content = aiResult.choices[0].message.content;
    
    // Strip any markdown code fences
    content = content.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
    
    // Parse the JSON response
    let substepsData;
    try {
      const parsed = JSON.parse(content);
      // Handle different response formats
      substepsData = parsed.substeps || parsed.steps || (Array.isArray(parsed) ? parsed : []);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response');
    }

    if (!Array.isArray(substepsData) || substepsData.length === 0) {
      throw new Error('AI did not return valid substeps');
    }

    // Insert substeps into database
    const { data: insertedSubsteps, error: insertError } = await supabaseClient
      .from('substeps')
      .insert(
        substepsData.slice(0, 4).map((sub: any, index: number) => ({
          step_id: stepId,
          title: sub.title || `Substep ${index + 1}`,
          description: sub.description || '',
          is_planned: false,
          created_at: new Date().toISOString()
        }))
      )
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, substeps: insertedSubsteps }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
