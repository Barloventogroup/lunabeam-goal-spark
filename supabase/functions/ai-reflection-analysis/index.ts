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
        systemPrompt = `You are Lune, a supportive buddy for young people. Look at what they've shared and give them encouraging, helpful feedback that actually helps them learn and grow. Be understanding, positive but real, and practical.`;
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

Keep your response warm, supportive, and real.`;
        break;

      case 'pattern_analysis':
        systemPrompt = `You are Lune, a buddy who helps people see patterns in how their goals are going. Look at their check-ins and reflections to spot what's working, what's getting in the way, and what opportunities they might have.`;
        userPrompt = `Analyze patterns in this user's goal journey:

Goal: ${goalContext?.title || 'Not specified'}
Latest reflection: "${reflection}"
Recent check-in data: ${JSON.stringify(checkInData)}

Identify:
1. Progress patterns (what's working well)
2. Potential obstacles or challenges
3. Opportunities for improvement
4. Suggested adjustments to approach

Give them insights they can actually use, in a supportive way.`;
        break;

      case 'next_steps':
        systemPrompt = `You are Lune, helping young people figure out what to do next based on how things are going for them. Give them specific, doable suggestions.`;
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
        systemPrompt = `You are Lune, a supportive buddy. Give helpful feedback on what people share about their experiences.`;
        userPrompt = `Look at this reflection: "${reflection}" and give supportive feedback.`;
    }

    console.log('Making OpenAI request for reflection analysis', { analysisType, hasReflection: !!reflection });

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