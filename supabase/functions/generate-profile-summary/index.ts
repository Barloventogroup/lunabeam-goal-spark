import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, pronouns, age, strengths, interests, workStyle, nextTwoWeeks, sharingSupport } = await req.json();

    console.log('[generate-profile-summary] Generating profile for:', name);

    // Convert work style numbers to descriptive text
    const getEnvironmentText = (value: number) => {
      if (value < 33) return 'quiet';
      if (value > 66) return 'lively';
      return 'balanced';
    };

    const getActivityText = (value: number) => {
      if (value < 33) return 'screen-based';
      if (value > 66) return 'hands-on';
      return 'mixed';
    };

    const getSocialText = (value: number) => {
      if (value < 33) return 'solo';
      if (value > 66) return 'social';
      return 'flexible';
    };

    const workStyleDesc = {
      environment: getEnvironmentText(workStyle.environment),
      activity: getActivityText(workStyle.activity),
      social: getSocialText(workStyle.socialPreference)
    };

    const systemPrompt = `You are a warm, empathetic profile writer helping create natural descriptions of individuals. 
Write a cohesive, flowing 2-3 sentence profile that captures who this person is.

Guidelines:
- Keep it brief and impactful - no more than 2-3 sentences
- Use a warm, caring tone (like a supportive friend or mentor)
- Prioritize the most distinctive and important aspects
- Weave details together naturally - don't list them
- Use the correct pronouns throughout (${pronouns})
- Avoid templated phrases like "shines at" or "drawn to"
- Make it sound genuine and personal
- Focus on the person's key strengths and interests`;

    const userPrompt = `Create a profile summary for:
Name: ${name}
Pronouns: ${pronouns}
Age group: ${age || 'not specified'}
Strengths: ${strengths.join(', ')}
Interests: ${interests.join(', ')}
Work environment preference: ${workStyleDesc.environment} spaces
Activity preference: ${workStyleDesc.activity} activities
Social preference: ${workStyleDesc.social} settings
Focus for next two weeks: ${nextTwoWeeks || 'getting started'}
Sharing preference: ${sharingSupport === 'private' ? 'keeps progress private' : sharingSupport === 'summary' ? 'likes sharing summaries with supporters' : 'comfortable sharing details with supporters'}`;

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
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-profile-summary] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content.trim();

    console.log('[generate-profile-summary] Generated summary:', summary);

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[generate-profile-summary] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: 'Unable to generate profile summary at this time.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
