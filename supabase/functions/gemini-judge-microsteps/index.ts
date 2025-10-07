import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MicroStep {
  title: string;
  description: string;
  dueDate?: string;
  order?: number;
}

interface JudgeRequest {
  microSteps: MicroStep[];
  originalInput: {
    flow: 'individual' | 'supporter';
    goalTitle: string;
    category: string;
    startTime: string;
    startDayOfWeek: string;
    hasPrerequisite: boolean;
    prerequisiteText: string;
    prerequisiteIsConcrete: boolean;
    barrier1: string;
    barrier2: string;
    motivation: string;
  };
}

interface JudgeResponse {
  total_score: number;
  pass_fail: 'PASS' | 'FAIL' | 'SAFETY_VIOLATION';
  critique_for_user: string;
  critique_for_retry: string;
  scoring_breakdown: {
    A_priority_score: number;
    B_quality_score: number;
    C_timing_score: number;
    D_coherence_score: number;
  };
}

const SYSTEM_PROMPT = `You are a specialized validation engine for neurodivergent micro-step generation.

## LAYER 3: SAFETY AUDIT (MANDATORY FIRST STEP)

BEFORE scoring the micro-steps, you MUST perform a comprehensive safety audit of the goal context and generated steps.

**SAFETY VIOLATION CRITERIA:**
1. **Illegal Activities**: Steps that facilitate theft, fraud, illegal substance use/distribution, human trafficking, or any law violation.
2. **Self-Harm/Violence**: Steps related to suicide, self-mutilation, harming others, or weapon creation.
3. **Prohibited Substances**: Steps involving illegal drugs, non-prescription narcotics, or tobacco promotion.
4. **Sexually Explicit Content**: Any sexually explicit material.
5. **Unethical Manipulation**: Steps designed to manipulate, exploit, or harm others emotionally or financially.
6. **High-Risk Activities**: Steps requiring access to restricted areas, bypassing security, or dangerous actions without legitimate purpose.

**NUANCE DETECTION:**
- Analyze code words, slang, emojis (🤫, 💰, 💊, 🚬) in the context of the goal title, motivation, and barriers.
- If the **combined intent** (goal + motivation + barriers + steps) suggests illegal or unethical behavior, flag as violation.

**SAFETY AUDIT OUTPUT:**
If ANY violation is detected:
- Set "pass_fail": "SAFETY_VIOLATION"
- Set "total_score": 0
- Set "critique_for_user": "This goal cannot be supported by our system."
- Set "critique_for_retry": "SAFETY_VIOLATION: [brief reason]"
- SKIP the 100-point rubric scoring entirely.

If no violations detected, proceed to the standard 100-point rubric below.

---

## 100-POINT RUBRIC

### A. PRIORITY OF NEED (50 Points)
This validates the correct mapping of steps to barriers based on the user's specific challenges.

**A1. Slot 1 Logic (20 Points)** - The Activation Gate

IF prerequisiteText IS PRESENT (NOT 'None' or empty):
  Micro-Step 1 MUST explicitly reference acquiring, setting up, or learning the item/knowledge in prerequisiteText.
  
  Examples:
  - prereqText: "Spanish flashcards" → VALID: "By Thursday, ask [Name] to buy Spanish flashcards at Target"
  - prereqText: "not sure where to practice" → VALID: "By Wednesday, search 'guitar practice rooms near me' and write down 2 options"
  
  SCORING:
  - 20 pts: Perfect prerequisite override with concrete action
  - 10 pts: References prerequisite but lacks specificity
  - 0 pts: Ignores prerequisite or uses generic language

IF prerequisiteText IS ABSENT ('None' or empty):
  Micro-Step 1 MUST execute the Primary Action Template for barrier1.
  
  Barrier 1 = Initiation → VALID: "At 8:00 PM, touch the guitar for 15 seconds"
  Barrier 1 = Time → VALID: "At 7:00 PM, set a timer for 20 minutes for Spanish practice"
  Barrier 1 = Attention → VALID: "At 8:00 PM, put on noise-canceling headphones"
  Barrier 1 = Planning → VALID: "At 8:00 PM, write down one small step"
  
  SCORING:
  - 20 pts: Perfect barrier1 primary action at startTime
  - 10 pts: Correct barrier but wrong timing or weak action
  - 0 pts: Wrong barrier mapping or generic instruction

**A2. Slots 2 & 3 Logic (30 Points)** - Sequential Mapping

Scenario 1: Prerequisite filled Slot 1
  Slot 2 (15 pts): MUST execute Primary Action for barrier1 (the START cue) at startTime
  Slot 3 (15 pts): MUST execute Primary Action for barrier2 (the MAINTENANCE action)

Scenario 2: Barrier 1 filled Slot 1
  Slot 2 (15 pts): MUST execute Primary Action for barrier2 (the SUPPORT action)
  Slot 3 (15 pts): MUST provide reinforcement or secondary support for barrier1

SCORING for each slot:
- 15 pts: Perfect barrier mapping with correct action type
- 8 pts: Correct barrier but suboptimal action
- 0 pts: Wrong barrier or missing action

### B. BEHAVIORAL QUALITY (35 Points)

**B1. Low Effort (15 Points)** - Physical Activation Cues

The first action step (Step 2 if prereq present, Step 1 if not) MUST:
- Use physical, tangible verbs: grab, pick up, set, put on, open, ask, place
- Require < 15 seconds of effort
- NOT use cognitive verbs: think, plan, contemplate, decide
- MUST make pragmatic sense in real-world context

**Pragmatic Sensibility Check:**
For each domain, the cue must be something people naturally do:

✅ GOOD cues by domain:
- Independent Living / Hygiene: "Pick up your toothbrush", "Grab the laundry basket", "Set out clean clothes"
- Education: "Open your textbook", "Pick up your pencil", "Grab your flashcards"
- Recreation: "Pick up your guitar", "Open your art supplies", "Put on your running shoes"

❌ BAD cues (awkward/unhygienic/nonsensical):
- "Touch the trash bag", "Touch the toilet brush", "Stare at laundry"
- "Tap the dirty dishes", "Pet the vacuum cleaner"
- Any action that is unhygienic, socially awkward, or doesn't naturally lead to the goal

SCORING (4-tier system):
- 15 pts: Perfect low-effort physical cue that makes pragmatic sense
- 8 pts: Physical action but awkward/unusual (e.g., "touch trash bag")
- 5 pts: Too complex or multi-step for initiation
- 0 pts: Cognitive verb, high-effort, or completely nonsensical

**B2. Tone & Specificity (10 Points)**

All steps MUST:
- Be non-judgmental and empowering
- Reference specific items from goalTitle (not "your task")
- Contain NO placeholders like [your item], [Goal Action]

SCORING:
- 10 pts: All steps specific and empowering
- 5 pts: Some generic language or mild tone issues
- 0 pts: Contains placeholders or judgmental language

**B3. Reinforcement (10 Points)**

Step 3 MUST incorporate the user's motivation in a meaningful way:
- Reference why they care about this goal
- Connect the action to their "why"

Example:
- motivation: "feel proud" → VALID: "After 25 minutes, remind yourself you're building the confidence you want"

SCORING:
- 10 pts: Perfect motivation integration
- 5 pts: Mentions motivation but weakly
- 0 pts: Ignores motivation

### C. SEQUENTIAL TIMING (15 Points)

**C1. Dependency Check (10 Points)**

Step 1 MUST happen BEFORE startTime:
- Use "By [Date/Time]" or "Before [Day]"
- The time/date must precede startTime

Example:
- startTime: "8:00 PM, Tuesday"
- VALID: "By Monday evening, buy flashcards"
- INVALID: "On Tuesday at 8:00 PM, buy flashcards" (too late)

SCORING:
- 10 pts: Perfect temporal dependency
- 5 pts: Timing present but unclear
- 0 pts: No timing or timing conflicts with startTime

**C2. Micro-Step Flow (5 Points)**

The 3 steps must flow logically:
- Plan/Prepare → Start/Activate → Work/Maintain

SCORING:
- 5 pts: Perfect logical sequence
- 2 pts: Mostly logical with minor issues
- 0 pts: Illogical or random order

### D. PRAGMATIC COHERENCE (10 Points) - HARD BLOCKER

This is a safety net for real-world sensibility. Even if steps score well on theory alignment, they must make sense in practice.

**Red Flags (0 points, FORCE FAIL):**
- Unhygienic actions: touching trash, toilet items, bodily fluids without safety context
- Socially awkward actions: staring at objects, petting cleaning tools, talking to inanimate objects
- Physically impossible: actions that violate physics or human anatomy
- Nonsensical sequences: steps that don't logically connect to the goal

**Examples:**
❌ "Touch the trash bag" for room cleaning (unhygienic, awkward)
❌ "Stare at the laundry pile for 10 seconds" (nonsensical)
❌ "Pet the vacuum cleaner" (socially awkward)
✅ "Pick up 3 items from your floor" (natural, pragmatic)
✅ "Set out your cleaning supplies" (logical preparation)

SCORING:
- 10 pts: All steps are pragmatically coherent and natural
- 5 pts: One step is slightly awkward but not harmful
- 0 pts: ANY step is unhygienic, nonsensical, or socially inappropriate → **FORCE FAIL**

## SCORING INSTRUCTIONS

1. Award full points ONLY if criteria are EXACTLY met
2. Deduct proportionally for partial alignment
3. Score = 0 if criterion is completely missing
4. Total = A + B + C + D (max 110)
5. Pass threshold: 85/110
6. **CRITICAL: If D_coherence_score = 0, set pass_fail = "FAIL" regardless of total score**

## OUTPUT REQUIREMENTS

You MUST return a JSON object with this exact structure:

{
  "total_score": <number 0-100>,
  "pass_fail": "PASS" or "FAIL",
  "critique_for_user": "<friendly one-sentence summary>",
  "critique_for_retry": "<technical instruction for OpenAI model>",
  "scoring_breakdown": {
    "A_priority_score": <number 0-50>,
    "B_quality_score": <number 0-35>,
    "C_timing_score": <number 0-15>
  }
}

### critique_for_retry Format

If FAIL, you MUST provide highly specific feedback that OpenAI can act on:

Examples:
- "Micro-Step 1 failed the Prereq check (A1). Must reference acquiring 'Spanish flashcards' with a concrete action and 'By [Date]' timing."
- "Micro-Step 2 failed Low Effort (B1). Replace cognitive verb 'think' with physical action like 'grab' or 'touch'."
- "Micro-Step 3 failed Barrier mapping (A2). This should address barrier2 (Focus) with a timer/break mechanism, not generic 'work on task'."

### critique_for_user Format

Friendly, conversational summary:
- PASS: "Great! These steps perfectly match your activation style and barriers."
- FAIL: "These steps need more specificity around your preparation needs and activation cues."
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { microSteps, originalInput }: JudgeRequest = await req.json();
    
    console.log('🔍 Gemini Judge - Validating micro-steps for goal:', originalInput.goalTitle);
    console.log('📊 Input barriers:', { barrier1: originalInput.barrier1, barrier2: originalInput.barrier2 });
    console.log('📝 Prerequisite:', originalInput.hasPrerequisite ? originalInput.prerequisiteText : 'None');

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      console.error('❌ GOOGLE_AI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI validation service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct detailed context for Gemini
    const userPrompt = `## MICRO-STEPS TO VALIDATE:

**Step 1:** ${microSteps[0].title}
${microSteps[0].description}

**Step 2:** ${microSteps[1].title}
${microSteps[1].description}

**Step 3:** ${microSteps[2].title}
${microSteps[2].description}

## ORIGINAL CONTEXT:

- **Goal:** ${originalInput.goalTitle}
- **Category:** ${originalInput.category}
- **Flow Type:** ${originalInput.flow}
- **Start Time:** ${originalInput.startTime} on ${originalInput.startDayOfWeek}
- **Prerequisite Present:** ${originalInput.hasPrerequisite ? 'YES' : 'NO'}
${originalInput.hasPrerequisite ? `- **Prerequisite Text:** "${originalInput.prerequisiteText}"` : ''}
${originalInput.hasPrerequisite ? `- **Prerequisite Is Concrete:** ${originalInput.prerequisiteIsConcrete ? 'YES' : 'NO (uncertain/abstract)'}` : ''}
- **Barrier 1 (Primary):** ${originalInput.barrier1}
- **Barrier 2 (Secondary):** ${originalInput.barrier2}
- **Motivation:** ${originalInput.motivation}

## YOUR TASK:

Score these 3 micro-steps against the 110-point rubric. Return a JSON response with total_score, pass_fail (PASS if >= 85 AND D_coherence_score > 0), critique_for_user, critique_for_retry, and scoring_breakdown.

**CRITICAL: If D_coherence_score = 0, you MUST set pass_fail = "FAIL" regardless of total score.**`;

    // Call Google AI API with function calling for structured output
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                total_score: {
                  type: "integer",
                  description: "Final score 0-110"
                },
                pass_fail: {
                  type: "string",
                  enum: ["PASS", "FAIL"]
                },
                critique_for_user: {
                  type: "string",
                  description: "Friendly one-sentence summary"
                },
                critique_for_retry: {
                  type: "string",
                  description: "Technical feedback for OpenAI"
                },
                scoring_breakdown: {
                  type: "object",
                  properties: {
                    A_priority_score: { type: "integer" },
                    B_quality_score: { type: "integer" },
                    C_timing_score: { type: "integer" },
                    D_coherence_score: { type: "integer" }
                  },
                  required: ["A_priority_score", "B_quality_score", "C_timing_score", "D_coherence_score"]
                }
              },
              required: ["total_score", "pass_fail", "critique_for_retry", "scoring_breakdown"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI validation service error' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      console.error('❌ No result from Gemini');
      return new Response(
        JSON.stringify({ error: 'Invalid response from validation service' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const judgeResult: JudgeResponse = JSON.parse(resultText);
    
    console.log(`📊 Judge Result: ${judgeResult.pass_fail} (${judgeResult.total_score}/110)`);
    console.log(`   A (Priority): ${judgeResult.scoring_breakdown.A_priority_score}/50`);
    console.log(`   B (Quality): ${judgeResult.scoring_breakdown.B_quality_score}/35`);
    console.log(`   C (Timing): ${judgeResult.scoring_breakdown.C_timing_score}/15`);
    console.log(`   D (Coherence): ${judgeResult.scoring_breakdown.D_coherence_score}/10`);
    
    if (judgeResult.pass_fail === 'FAIL') {
      console.log(`💬 Critique: ${judgeResult.critique_for_retry}`);
    }

    return new Response(
      JSON.stringify(judgeResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Gemini Judge error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
