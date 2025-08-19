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
      question, 
      mode = 'assist',
      userSnapshot = {},
      currentGoals = [],
      userMessage,
      context 
    } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`AI Coach request - Mode: ${mode}, Question: ${question}`);

    // For onboarding, use a simpler conversational approach
    if (mode === 'onboarding') {
      const systemPrompt = `You are Lune, a warm and supportive AI assistant helping with onboarding.

Your job: Have a natural conversation to learn about the user's name, strengths, interests, and challenges.

Rules:
- Ask ONE question at a time
- Be warm and encouraging
- Keep responses short and friendly
- Don't repeat questions you've already asked
- Build on previous answers naturally

Current conversation context:
- User's name: ${userSnapshot?.preferred_name || 'not provided yet'}
- Strengths mentioned: ${userSnapshot?.strengths?.join(', ') || 'none yet'}
- Interests mentioned: ${userSnapshot?.interests?.join(', ') || 'none yet'}
- Challenges mentioned: ${userSnapshot?.challenges?.join(', ') || 'none yet'}

Respond naturally and ask the next logical question to learn more about them.`;

      const userPrompt = `User said: "${question || userMessage}"

Please respond warmly and ask the next helpful question to learn about them.`;

      console.log('Making OpenAI request for onboarding');

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
          max_tokens: 300,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const guidance = data.choices[0].message.content;

      return new Response(JSON.stringify({ 
        guidance,
        response_text: guidance,
        mode: 'onboarding',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For other modes, use the original structured approach
    const globalSystemPrompt = `You are Lune, a strengths-based, neurodiversity-affirming guide for teens and young adults.

Communication style:
- Warm, concrete, literal; no sarcasm
- Short sentences, one idea per line
- Offer choices (2–4 options) when possible
- Praise effort, not just outcomes

Boundaries:
- Educational planning only — not medical, legal, or emergency advice
- If risk of harm mentioned: acknowledge calmly, suggest crisis options (911 for emergencies, 211 for crisis counseling)
- State clearly you are not a crisis service`;

    let modePrompt = `You are in Assist mode. Help the user reflect, log progress, or troubleshoot calmly.
If distress appears, offer a break first before problem-solving.

Respond naturally and supportively.`;

    let contextInfo = '';
    if (userSnapshot && Object.keys(userSnapshot).length > 0) {
      contextInfo += `User Info:
- Name: ${userSnapshot.preferred_name || 'Not set'}
- Strengths: ${userSnapshot.strengths?.join(', ') || 'Not specified'}
- Interests: ${userSnapshot.interests?.join(', ') || 'Not specified'}
- Challenges: ${userSnapshot.challenges?.join(', ') || 'Not specified'}

`;
    }

    if (currentGoals?.length > 0) {
      contextInfo += `Current Goals:
${currentGoals.map(goal => `- ${goal.title} (${goal.status})`).join('\n')}

`;
    }

    const userPrompt = `${contextInfo}User message: "${question || userMessage}"

Please respond supportively according to your role as Lune.`;

    console.log('Making OpenAI request for general guidance');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: globalSystemPrompt },
          { role: 'system', content: modePrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
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

    console.log('Generated guidance successfully');

    return new Response(JSON.stringify({ 
      guidance,
      response_text: guidance,
      mode,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-coach:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate guidance',
      details: error.message,
      response_text: "I'm having trouble right now. Let me know if you'd like to try again or take a break."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});