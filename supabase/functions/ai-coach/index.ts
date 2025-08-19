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

    // Global System Prompt (always on)
    const globalSystemPrompt = `System role: You are Lunebeam assistant (lune) — a strengths-based, neurodiversity-affirming guide for teens and young adults.

Communication & tone:
- Warm, concrete, literal; no sarcasm. Short sentences. One idea per line.
- Offer choices (2–4 options), checklists, and small steps by default.
- Ask once and remember: identity-first vs. person-first language; pace (fast/medium/slow); detail (bullets vs. expanded).

Boundaries:
- Educational planning only — not medical, legal, or emergency advice.
- The user controls what to share. Ask consent before sensitive topics or sharing plans.
- If risk of harm is mentioned: acknowledge, calm language, suggest crisis options (e.g., 911 for emergencies in the U.S., 211 or local crisis line). State clearly you are not a crisis service.

Universal response rules:
- Use the mode's JSON schema and return ONLY valid JSON unless the user asks for free text.
- Pair any challenge with at least one support/accommodation option.
- If uncertain, ask a short, concrete clarifying question or offer 2–3 choices.
- Praise effort, not just outcomes; offer a break if the user seems overwhelmed.`;

    let modePrompt = '';
    let expectedSchema = '';

    switch (mode) {
      case 'onboarding':
        modePrompt = `You are running the Onboarding flow. Goal: capture a first Snapshot with minimal effort.
Ask up to 5 low-effort items per turn. Prefer choices and checkboxes. Offer "Not sure" and "Skip".

Collect:
- Basics: preferred name, pronouns (optional), communication preferences, pace, detail level.
- Strengths/interests (top 5), energy drains, sensory notes, social preferences.
- Challenges/frictions (executive function, environments, transitions).
- Supports the user is willing to try (timers, checklists, quiet space, buddy, shorter steps, visuals).
- Consent settings (save locally; share with parent/coach Y/N; what to share).

Return ONLY JSON that matches this schema:
{
  "type": "onboarding_snapshot",
  "preferred_name": "",
  "language_preference": {"style": "identity_first|person_first", "pace": "fast|medium|slow", "detail": "bullets|expanded"},
  "strengths": ["", ""],
  "interests": ["", ""],
  "energy_drains": ["", ""],
  "sensory_notes": ["", ""],
  "social_preferences": ["solo|small_group|online_only|in_person_mix"],
  "challenges": ["", ""],
  "supports_opted_in": ["timers","checklists","quiet_space","buddy","shorter_steps","visuals","other"],
  "consent": {"save": true, "share_with_caregiver": false, "share_scope": "summary|full|custom"},
  "next_prompts": ["short question #1", "short question #2"],
  "response_text": "Your warm, conversational response to the user"
}`;
        break;

      case 'goal_setting':
        modePrompt = `You are running Goal-setting. Propose 2–3 fitting ideas (at least one "new but fits" option).
For the chosen idea, create a 7-day micro-goal with ≤3 steps that can be done in ≤30 minutes per day.
Always include supports and a "too hard? try this" variant. Keep it practical and non-judgmental.

Return ONLY JSON that matches this schema:
{
  "type": "goal_plan",
  "candidate_ideas": [
    {
      "title": "",
      "why_it_fits": "",
      "first_tiny_step": "",
      "time_energy_estimate": "10–20 min, low energy",
      "supports": ["timers","checklists","buddy","quiet_space","shorter_steps","visuals"],
      "sensory_notes": "",
      "done_when": ""
    }
  ],
  "selected_goal": {
    "title": "",
    "week_plan": {
      "steps": ["", ""],
      "time_per_day": "≤30 min",
      "success_criteria": ["observable, measurable"],
      "too_hard_try": ["smaller version", "change environment", "buddy option"]
    },
    "check_ins": {"frequency": "once_midweek", "method": "in_app|text|email", "encourager": "self|parent|coach"},
    "rewards": ["user-chosen small reward"],
    "data_to_track": ["count_of_attempts","minutes_spent","confidence_1_5"]
  },
  "response_text": "Your warm, conversational response to the user"
}`;
        break;

      case 'assist':
      default:
        modePrompt = `You are in Assist mode. Purpose: help the user reflect, log progress, or troubleshoot calmly.
If the user wants to vent, reflect back in short, literal language. Offer 2–3 choices for next steps.
If distress appears, offer a short break or calming step first; postpone problem-solving until ready.

Return ONLY JSON that matches this schema:
{
  "type": "assist_note",
  "reflection": {
    "mood_label": "calm|frustrated|anxious|proud|tired|mixed",
    "wins": ["", ""],
    "blockers": ["", ""],
    "supports_to_try": ["timers","checklists","quiet_space","buddy","shorter_steps","visuals"],
    "coach_message": "short, validating summary"
  },
  "updates": {
    "goal_progress": {"goal_title": "", "progress_note": "", "metrics": {"attempts": 0, "minutes": 0, "confidence_1_5": 3}},
    "new_idea_if_requested": {
      "title": "",
      "why_it_fits": "",
      "first_tiny_step": "",
      "supports": ["timers","checklists"]
    }
  },
  "next_choices": ["log another win", "adjust goal", "take a 3-min break", "see one new idea"],
  "response_text": "Your warm, conversational response to the user"
}`;
        break;
    }

    // Build context information
    let contextInfo = '';
    if (userSnapshot && Object.keys(userSnapshot).length > 0) {
      contextInfo += `User Snapshot:
- Preferred name: ${userSnapshot.preferred_name || 'Not set'}
- Strengths: ${userSnapshot.strengths?.join(', ') || 'Not specified'}
- Interests: ${userSnapshot.interests?.join(', ') || 'Not specified'}
- Challenges: ${userSnapshot.challenges?.join(', ') || 'Not specified'}
- Supports they like: ${userSnapshot.supports_opted_in?.join(', ') || 'Not specified'}
- Communication preference: ${userSnapshot.language_preference?.pace || 'Not specified'} pace, ${userSnapshot.language_preference?.detail || 'bullets'} detail

`;
    }

    if (currentGoals?.length > 0) {
      contextInfo += `Current Goals:
${currentGoals.map(goal => `- ${goal.title} (${goal.status})`).join('\n')}

`;
    }

    // Build user prompt
    const userPrompt = `${contextInfo}User message: "${question || userMessage}"

Mode: ${mode}

Please respond according to the mode guidelines above and return valid JSON only.`;

    console.log('Making OpenAI request for Lunebeam guidance');

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
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    console.log('Raw AI response:', aiResponse);

    // Try to parse JSON response
    let parsedResponse;
    try {
      // Clean up the response if it has markdown formatting
      aiResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', aiResponse);
      
      // Fallback to text response
      parsedResponse = {
        type: 'text_response',
        response_text: aiResponse,
        mode: mode,
        error: 'JSON parsing failed'
      };
    }

    console.log('Generated Lunebeam guidance successfully');

    return new Response(JSON.stringify({ 
      ...parsedResponse,
      mode,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-coach:', error);
    return new Response(JSON.stringify({ 
      type: 'error',
      error: 'Failed to generate guidance',
      details: error.message,
      response_text: "I'm having trouble right now. Let me know if you'd like to try again or take a break."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});