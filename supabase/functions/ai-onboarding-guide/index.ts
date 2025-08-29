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
        systemPrompt = `You are Lune, a supportive buddy for young people (ages 13-25). Help them figure out goals that make sense for them based on what they're into, what they're good at, and what's challenging. Be encouraging, real, and practical. Suggest 3-5 specific goals they can actually do.`;
        userPrompt = `Based on this profile:
- Interests: ${userProfile?.interests?.join(', ') || 'Not specified'}
- Strengths: ${userProfile?.strengths?.join(', ') || 'Not specified'}
- Challenges: ${userProfile?.challenges?.join(', ') || 'Not specified'}

Suggest specific, achievable goals that would be meaningful for this person. Each goal should:
1. Be clear and specific
2. Connect to their interests or address their challenges
3. Be achievable within 1-4 weeks
4. Have measurable outcomes

Format as a JSON array of objects with: title, description, timeframe, why_meaningful`;
        break;

      case 'goal_refinement':
        systemPrompt = `You are Lune, a supportive buddy. Help them make their goals more doable and meaningful by breaking them into steps they can actually handle.`;
        userPrompt = `Help refine this goal: "${currentGoals?.[0]?.title || 'No goal specified'}"

User profile:
- Interests: ${userProfile?.interests?.join(', ') || 'Not specified'}
- Strengths: ${userProfile?.strengths?.join(', ') || 'Not specified'}
- Challenges: ${userProfile?.challenges?.join(', ') || 'Not specified'}

Provide specific suggestions for:
1. Weekly plan structure
2. Check-in frequency and format
3. Success metrics
4. Potential obstacles and solutions
5. Motivation strategies`;
        break;

      case 'support_planning':
        systemPrompt = `You are Lune, helping young people figure out who might support them. Give them ideas about who to involve and how much to share, while respecting that it's totally their choice.`;
        userPrompt = `Help plan support system for someone working on: "${currentGoals?.[0]?.title || 'their goals'}"

Consider:
- Who might be helpful supporters (parents, teachers, friends, coaches)
- What level of sharing feels comfortable
- How to maintain privacy while getting support
- How to set boundaries

Give practical advice that respects their independence and choices.`;
        break;

      default:
        systemPrompt = `You are Lune, a supportive buddy for young people. Give them encouraging, practical help with figuring out their goals and next steps.`;
        userPrompt = `Give general guidance for someone just starting to think about their goals.`;
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

  } catch (error) {
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