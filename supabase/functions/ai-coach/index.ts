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
      const systemPrompt = `You are Lune, a friendly AI assistant helping teenagers and young adults (16-25) get started.

Your job: Have a casual, natural conversation to learn about them - their name, what they're good at, what they're into, and what challenges they face.

Communication style:
- Talk like a supportive friend, not a counselor
- Be genuinely curious about their interests (gaming, music, social media, school, work, hobbies)
- Use language they'd actually use - no corporate speak
- Keep it light and conversational

Rules:
- Ask ONE question at a time
- Build on what they tell you naturally
- Don't repeat questions you've already asked
- Reference their age group's experiences (school stress, social media, part-time jobs, college decisions, etc.)

Current conversation context:
- User's name: ${userSnapshot?.preferred_name || 'not provided yet'}
- Strengths mentioned: ${userSnapshot?.strengths?.join(', ') || 'none yet'}
- Interests mentioned: ${userSnapshot?.interests?.join(', ') || 'none yet'}
- Challenges mentioned: ${userSnapshot?.challenges?.join(', ') || 'none yet'}

Keep it real and relatable to their world.`;

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

    // Handle step generation requests
    if (mode === 'assist' && question && question.includes('Generate') && question.includes('milestone steps')) {
      const stepSystemPrompt = `You are an AI step generator that creates specific, actionable milestone steps for goals.

Your job: Generate concrete, goal-specific milestone steps that are directly related to achieving the goal.

Rules for step generation:
- Make steps SPECIFIC to the goal (e.g., for "Drink Water" don't say "Plan first step", say "Drink your first glass of water today")
- Each step should be a concrete action someone can complete
- Steps should build toward the goal progressively
- Use the session format: "Session X: [specific action]"
- Include practical details and time estimates when helpful
- Make it feel achievable and motivating

For hydration/water goals, focus on:
- Setting up tracking systems
- Building drinking habits
- Timing throughout the day
- Making water more appealing

For sleep goals, focus on:
- Bedtime routines
- Environmental preparation
- Consistency building

For exercise goals, focus on:
- Progressive movement building
- Habit formation
- Tracking progress

Return a JSON array of step objects with:
- title: "Session X: [specific actionable step]"
- notes: Brief explanation of why this step matters
- points: 1-3 based on difficulty
- estimated_effort_min: Time in minutes`;

      const stepUserPrompt = question;

      console.log('Making OpenAI request for step generation');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: stepSystemPrompt },
            { role: 'user', content: stepUserPrompt }
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
      const guidance = data.choices[0].message.content;

      console.log('Generated step guidance successfully');

      return new Response(JSON.stringify({ 
        guidance,
        response_text: guidance,
        mode: 'assist',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For other modes, use the original structured approach
    const globalSystemPrompt = `You are Lune, a supportive AI guide for teenagers and young adults aged 16-25.

Communication style:
- Casual but respectful tone - like talking to a friend who gets it
- Use examples from social media, gaming, streaming, school/work life
- Reference things like TikTok trends, Discord servers, Netflix shows, part-time jobs, college stress
- Keep it real - acknowledge that life can be messy and overwhelming
- Celebrate small wins and progress, not just perfection

Your vibe:
- Encouraging without being preachy
- Understanding of modern teen/young adult challenges (social media pressure, financial stress, academic/career uncertainty)
- Use relatable analogies (like leveling up in games, building playlists, organizing your phone apps)
- Acknowledge that everyone's path is different

Boundaries:
- Life guidance only — not medical, legal, or emergency advice
- If someone mentions self-harm or crisis: respond with care, suggest 988 Suicide & Crisis Lifeline or Crisis Text Line (text HOME to 741741)
- Keep it age-appropriate and supportive`;

    let modePrompt = `You are in Assist mode. Help users reflect on their progress and work through challenges.

Use examples they can relate to:
- "Like when you're stuck on a level in a game - sometimes you need to try a different approach"
- "Think of it like organizing your Spotify playlists - start with what you know you like"
- "It's like when you're learning a new TikTok dance - break it down move by move"
- "Similar to group projects at school/work - some parts depend on finishing other parts first"

Be supportive and real about the challenges of being their age.`;

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