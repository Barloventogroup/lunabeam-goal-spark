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
    const { reflection, goalContext, checkInData, analysisType = 'encouragement' } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'encouragement':
        systemPrompt = `You are Luna, a supportive AI coach for young people. Analyze reflections and provide encouraging, constructive feedback that helps them learn and grow. Be empathetic, positive, and practical.`;
        userPrompt = `Analyze this reflection and provide encouraging feedback:

Goal: ${goalContext?.title || 'Not specified'}
Reflection: "${reflection}"
Check-in data: 
- Attempts: ${checkInData?.count_of_attempts || 0}
- Time spent: ${checkInData?.minutes_spent || 0} minutes
- Confidence (1-5): ${checkInData?.confidence_1_5 || 'Not rated'}

Provide:
1. Acknowledgment of their efforts
2. Insights about their progress
3. Constructive suggestions for improvement
4. Encouragement for next steps

Keep response warm, supportive, and age-appropriate.`;
        break;

      case 'pattern_analysis':
        systemPrompt = `You are Luna, an AI coach that helps identify patterns in goal progress. Analyze check-ins and reflections to spot trends, obstacles, and opportunities.`;
        userPrompt = `Analyze patterns in this user's goal journey:

Goal: ${goalContext?.title || 'Not specified'}
Latest reflection: "${reflection}"
Recent check-in data: ${JSON.stringify(checkInData)}

Identify:
1. Progress patterns (what's working well)
2. Potential obstacles or challenges
3. Opportunities for improvement
4. Suggested adjustments to approach

Provide actionable insights in a supportive tone.`;
        break;

      case 'next_steps':
        systemPrompt = `You are Luna, helping young people plan their next steps based on their reflections and progress. Provide specific, actionable guidance.`;
        userPrompt = `Based on this reflection, suggest next steps:

Goal: ${goalContext?.title || 'Not specified'}
User's reflection: "${reflection}"
Progress data: ${JSON.stringify(checkInData)}

Suggest:
1. Immediate next actions (this week)
2. Adjustments to their approach if needed
3. Ways to build on current progress
4. Resources or support that might help

Be specific and encouraging.`;
        break;

      default:
        systemPrompt = `You are Luna, a supportive AI coach. Provide helpful analysis of user reflections.`;
        userPrompt = `Analyze this reflection: "${reflection}" and provide supportive feedback.`;
    }

    console.log('Making OpenAI request for reflection analysis');

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
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('Generated reflection analysis successfully');

    return new Response(JSON.stringify({ 
      analysis, 
      analysisType,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-reflection-analysis:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze reflection',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});