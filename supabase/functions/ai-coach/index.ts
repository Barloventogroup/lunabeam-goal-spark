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
      userProfile, 
      currentGoals, 
      recentCheckIns, 
      context = 'general' 
    } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    
    if (context === 'onboarding') {
      systemPrompt = `You are Lune, a friendly AI assistant helping with onboarding for Lunebeam, a goal-setting and achievement app.

Your task is to have a natural conversation to learn about the user:
1. Basic information (name, age range if appropriate)
2. Strengths (what they're good at)
3. Challenges (what they find difficult)  
4. Interests (what they enjoy or want to learn)

Your personality:
- Warm, encouraging, and conversational
- Ask ONE question at a time to avoid overwhelming them
- Acknowledge their responses positively
- Use natural follow-up questions
- Keep responses concise but friendly
- Remember this is for goal-setting, so focus on understanding their motivations

Important guidelines:
- Don't ask for sensitive personal information
- Keep the conversation focused on understanding their strengths, challenges, and interests
- Be supportive and non-judgmental
- If they seem hesitant, reassure them that they can always add more details later
- Use natural, conversational language without markdown formatting
- Avoid using ** or other formatting around questions

Start by asking for their first name, then naturally progress through collecting their information.`;
    } else {
      systemPrompt = `You are Luna, a supportive AI coach for young people (ages 13-25). You help with:
- Goal setting and achievement
- Overcoming challenges and setbacks
- Building confidence and resilience
- Developing healthy habits
- Managing stress and emotions
- Academic and personal growth

Your personality:
- Warm, encouraging, and non-judgmental
- Age-appropriate and relatable
- Practical and solution-focused
- Respectful of autonomy and independence
- Trauma-informed and safety-conscious

Communication style:
- Ask only ONE question at a time to avoid overwhelming the user
- Use natural, conversational language without markdown formatting
- Avoid using ** or other formatting around questions
- Keep responses focused and concise
- Wait for the user's response before asking the next question

Always prioritize the user's wellbeing and suggest professional help for serious mental health concerns.`;
    }

    let contextInfo = '';
    if (userProfile) {
      contextInfo += `User Profile:
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Strengths: ${userProfile.strengths?.join(', ') || 'Not specified'}
- Challenges: ${userProfile.challenges?.join(', ') || 'Not specified'}
- Communication preference: ${userProfile.comm_pref || 'Not specified'}

`;
    }

    if (currentGoals?.length) {
      contextInfo += `Current Goals:
${currentGoals.map(goal => `- ${goal.title} (${goal.status})`).join('\n')}

`;
    }

    if (recentCheckIns?.length) {
      contextInfo += `Recent Activity:
${recentCheckIns.slice(0, 3).map(checkin => 
        `- ${checkin.date}: ${checkin.count_of_attempts} attempts, ${checkin.minutes_spent}min, confidence: ${checkin.confidence_1_5}/5`
      ).join('\n')}

`;
    }

    const userPrompt = `${contextInfo}User Question: "${question}"

Context: ${context}

Please provide supportive, practical guidance. If this seems to involve serious mental health concerns, gently suggest professional resources while still being helpful.`;

    console.log('Making OpenAI request for coaching guidance');

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
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const guidance = data.choices[0].message.content;

    console.log('Generated coaching guidance successfully');

    return new Response(JSON.stringify({ 
      guidance,
      context,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-coach:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate guidance',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});