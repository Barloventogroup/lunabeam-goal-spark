import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, stepId, goalId, userMessage, currentDueDate, requestedExtension, newFrequency } = await req.json();

    const systemPrompt = `You are a supportive scheduling assistant helping users adjust their goal timelines. You should:

1. Be empathetic and understanding about schedule challenges
2. Provide practical, encouraging responses
3. Calculate reasonable timeline adjustments
4. Suggest alternative approaches if needed

User is requesting: ${type}
Current situation: ${userMessage}
${currentDueDate ? `Current due date: ${currentDueDate}` : ''}
${requestedExtension ? `Suggested extension: ${requestedExtension} days` : ''}
${newFrequency ? `New frequency requested: ${newFrequency}` : ''}

Respond with helpful advice and confirm the schedule adjustment.`;

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
          { role: 'user', content: userMessage }
        ],
        max_tokens: 200,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Calculate new due date if extension requested
    let newDueDate;
    if (currentDueDate && requestedExtension) {
      const current = new Date(currentDueDate);
      current.setDate(current.getDate() + requestedExtension);
      newDueDate = current.toISOString().split('T')[0];
    }

    return new Response(JSON.stringify({
      success: true,
      message: aiMessage,
      newDueDate,
      affectedSteps: type === 'change_frequency' ? 1 : undefined // placeholder
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in schedule-adjustment function:', error);
    return new Response(JSON.stringify({
      success: false,
      message: "I understand you need to adjust your schedule. Let me help you find a better timeline that works for you."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});