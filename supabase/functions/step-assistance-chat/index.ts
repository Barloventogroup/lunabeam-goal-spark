import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, goalTitle, stepTitle, stepContext } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    // Build system prompt with context
    const systemPrompt = `You are StepCoach, a friendly AI assistant helping users with their goals and steps in the LuneBeam app.

Current context:
- Goal: ${goalTitle}
${stepTitle ? `- Current Step: ${stepTitle}` : ''}
${stepContext ? `- Step Details: ${stepContext}` : ''}

Your role:
- Help break down overwhelming steps into smaller, manageable actions (2-5 minute chunks)
- Clarify confusing steps and explain why they matter
- Guide users on where to start and the best order to tackle steps
- Be encouraging, supportive, and keep answers concise (2-3 sentences)
- Stay focused on the current goal and steps - redirect off-topic questions gently
- Use simple, friendly language - avoid jargon

Key guidelines:
- If a step feels too big: suggest breaking it into 2-3 smaller sub-tasks
- If user is confused: clarify what the step means and why it's important
- If user asks about order: explain dependencies and suggest starting with steps that have no blockers
- If user wants to skip: validate their feelings and explain they can mark steps as "Not relevant"
- Always be encouraging and remind them they're making progress

Keep responses short (2-3 sentences max) and actionable.`;

    // Combine system prompt and messages for Gemini
    const combinedPrompt = `${systemPrompt}\n\n${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n')}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: combinedPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Step assistance chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to get AI response',
        fallback: "I'm having trouble right now. Try asking again in a moment, or check your internet connection."
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
