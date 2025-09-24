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
    const { userProfile, currentGoals, step } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (step) {
      case 'goal_suggestion':
        systemPrompt = `You are Lune, a casual buddy for young people. Keep it short and friendly - 1-2 lines max. Always offer choice buttons with emoji. Sound like a supportive friend, not a coach.`;
        userPrompt = `Hey! Based on what I know about them:
- Interests: ${userProfile?.interests?.join(', ') || 'Not sure yet'}
- Strengths: ${userProfile?.strengths?.join(', ') || 'Still figuring out'}
- Challenges: ${userProfile?.challenges?.join(', ') || 'None mentioned'}

Give me 3 short goal ideas they might like. Keep each one super simple - just the main idea in a few words. Make it sound doable and fun.`;
        break;

      case 'goal_refinement':
        systemPrompt = `You are Lune, their casual buddy. Keep responses short (1-2 lines). Always end with choice buttons. Use everyday language and be encouraging but real.`;
        userPrompt = `They want to work on: "${currentGoals?.[0]?.title || 'their goal'}"

What they're into: ${userProfile?.interests?.join(', ') || 'still exploring'}
What they're good at: ${userProfile?.strengths?.join(', ') || 'lots of things'}

Give me 2-3 ways to make this goal easier or more fun. Keep it simple and practical.`;
        break;

      case 'support_planning':
        systemPrompt = `You are Lune, their friendly buddy. Keep messages short and always offer 2-3 choice buttons. Respect their autonomy completely - their choice what to share and with who.`;
        userPrompt = `They're working on: "${currentGoals?.[0]?.title || 'their goal'}"

Help them think about support options. Give them 2-3 simple choices about who might help and how much to share. Make it clear it's totally up to them.`;
        break;

      default:
        systemPrompt = `You are Lune, a casual buddy. Keep messages short (1-2 lines). Always offer 2-4 choice buttons with emoji. Sound supportive but natural - like talking to a friend.`;
        userPrompt = `Someone's just getting started with goal-setting. Give them a friendly, short message with some simple next steps to choose from.`;
    }

    console.log('Making OpenAI request for onboarding guidance');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const guidance = data.choices[0].message.content;

    console.log('Generated onboarding guidance successfully');

    return new Response(JSON.stringify({ guidance, step }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-onboarding-guide:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate guidance',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});