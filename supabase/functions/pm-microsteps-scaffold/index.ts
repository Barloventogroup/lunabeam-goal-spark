import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

// Declare EdgeRuntime global for background tasks
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
};

// Add shutdown handler to trace function lifecycle
addEventListener('beforeunload', (ev: any) => {
  console.log('⚠️ Edge function shutting down:', ev.detail?.reason || 'unknown reason');
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TypeScript Interfaces
interface SkillAssessment {
  experience: number;
  confidence: number;
  helpNeeded: number;
  calculatedLevel: number;
  levelLabel: string;
}

interface SmartStart {
  startingFrequency: number;
  targetFrequency: number;
  rampWeeks: number;
}

interface TeachingHelper {
  helperId: string;
  helperName: string;
  supportTypes: string[];
}

interface Prerequisites {
  hasEverything: boolean;
  needs?: string;
}

interface PMGoalCreationInput {
  goalId: string;
  title: string;
  domain: string;
  duration_weeks: number;
  skillAssessment: SkillAssessment;
  smartStart: SmartStart;
  teachingHelper?: TeachingHelper;
  prerequisites: Prerequisites;
  barriers?: string;
  motivation: string;
  userId: string;
  userName: string;
  userAge?: number;
  is_self_registered?: boolean;
  mode?: 'sync' | 'async'; // NEW: async returns immediately, sync waits for AI
}

interface SafetyViolationLog {
  user_id: string;
  violation_layer: 'layer_1_keywords' | 'layer_1_keywords_and_emojis' | 'layer_2_generation' | 'layer_3_judge';
  goal_title: string;
  goal_category?: string;
  motivation?: string;
  barriers?: string;
  triggered_keywords?: string[];
  triggered_emojis?: string[];
  triggered_emoji_codes?: string[];
  emoji_combination_detected?: boolean;
  violation_reason: string;
  user_email?: string;
  user_age?: number;
  skill_level?: number;
  is_self_registered?: boolean;
}

interface GeneratedStep {
  title: string;
  description: string;
  estimatedDuration: number;
  supportLevel: 'high' | 'medium' | 'low' | 'minimal' | 'none';
  difficulty: number;
  weekNumber: string;
  phase: number;
  prerequisites?: string[];
  safetyNotes?: string | null;
  qualityIndicators?: string[];
  independenceIndicators?: string[];
  practiceCount?: number;
}

interface GenerationResponse {
  steps: GeneratedStep[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// AI Configuration
// Build: 2025-10-17T02:00:00Z - Increased timeout to 30s for reliable sync generation
const MAX_LOVABLE_ATTEMPTS = 2; // Lovable AI gets 2 fast attempts
const MAX_OPENAI_ATTEMPTS = 1; // OpenAI gets 1 fallback attempt
const AI_MODEL = 'gpt-5-mini-2025-08-07'; // Fast, cost-efficient GPT-5 variant
const AI_TIMEOUT_MS = 30000; // 30 seconds per attempt (increased for reliable sync mode)

// Dangerous Keywords Array (from requirements section 5.1)
const dangerousKeywords = [
  // Violence & Self-Harm
  'kill', 'suicide', 'self-harm', 'self harm', 'cut myself', 'hurt myself',
  'murder', 'assault', 'attack', 'shoot', 'stab', 'strangle',
  
  // Illegal Activities
  'trafficking', 'illegal', 'steal', 'theft', 'fraud', 'scam',
  'counterfeit', 'forgery', 'embezzle', 'launder money', 'break in',
  
  // Drugs (Illegal Context)
  'cocaine', 'heroin', 'meth', 'methamphetamine', 'fentanyl', 'lsd',
  'sell drugs', 'buy drugs', 'drug deal', 'black market',
  'weed', 'marijuana', 'ecstasy', 'molly',
  
  // Weapons & Explosives
  'bomb', 'explosive', 'grenade', 'weapon', 'firearm',
  'make a weapon', 'build a bomb', 'ammunition',
  
  // Cybersecurity Violations
  'hack', 'bypass security', 'exploit vulnerability', 'crack password',
  'ddos', 'ransomware', 'malware', 'phishing',
  
  // Sexual Content
  'sexually explicit', 'porn', 'xxx', 'sex tape', 'nude', 'onlyfans',
  
  // Harmful Manipulation
  'revenge', 'harm someone', 'hurt someone', 'get back at',
  'manipulate', 'gaslight', 'abuse', 'bully',
  
  // Tobacco/Vaping (for minors)
  'smoking', 'start smoking', 'cigarettes', 'vaping', 'e-cigarette', 'juul',
  
  // Dangerous Activities (context-dependent)
  'drive alone', 'use knife', 'medication without supervision', 'inject'
];

// Dangerous Emojis Array
const dangerousEmojis = [
  // Violence & Weapons
  '🔫', '🔪', '💣', '🗡️', '⚔️', '🧨', '⛓️', '🪓',
  
  // Drugs & Substances
  '💊', '💉', '🚬', '🍃', '🌿',
  
  // Sexual Content
  '🍆', '🍑', '🍌', '🌮', '🌭', '💦', '👅', '🔞', '🍒',
  
  // Self-Harm Indicators
  '🩸', '⚰️', '🪦',
  
  // Illegal Activity
  '🏴‍☠️', '💀'
];

// Emoji Code Words (text alternatives users might type)
const emojiCodeWords = [
  'peach', 'eggplant', 'cherries', 'banana', 'taco', 'hotdog',
  'water drops', 'splash', 'drip', 'wet',
  'herb', 'green leaf', 'plant',
  'pill', 'needle', 'injection',
  'gun emoji', 'knife emoji', 'bomb emoji',
  'boom stick', 'fire stick', 'pew pew'
];

// Dangerous Emoji Combinations (patterns that appear together)
const dangerousEmojiCombinations = [
  { emojis: ['🍆', '🍑'], reason: 'sexual_content' },
  { emojis: ['🍆', '💦'], reason: 'sexual_content' },
  { emojis: ['🍑', '💦'], reason: 'sexual_content' },
  { emojis: ['💊', '💰'], reason: 'drug_dealing' },
  { emojis: ['🔫', '😈'], reason: 'violent_intent' },
  { emojis: ['🔪', '😈'], reason: 'violent_intent' },
  { emojis: ['💣', '🏢'], reason: 'terrorism' }
];

// Layer 1 Safety Check Function
function checkLayer1Safety(payload: PMGoalCreationInput): { triggered: boolean; keywords: string[]; emojis: string[]; emojiCodes: string[] } {
  const titleLower = payload.title.toLowerCase();
  const motivationLower = (payload.motivation || '').toLowerCase();
  const barriersLower = (payload.barriers || '').toLowerCase();
  const prerequisitesLower = (payload.prerequisites?.needs || '').toLowerCase();
  
  const combinedInput = `${titleLower} ${motivationLower} ${barriersLower} ${prerequisitesLower}`;
  
  // Check text keywords
  const triggeredKeywords = dangerousKeywords.filter(keyword =>
    combinedInput.includes(keyword.toLowerCase())
  );
  
  // Check for dangerous emojis
  const fullText = `${payload.title} ${payload.motivation || ''} ${payload.barriers || ''} ${payload.prerequisites?.needs || ''}`;
  const triggeredEmojis = dangerousEmojis.filter(emoji =>
    fullText.includes(emoji)
  );
  
  // Check for emoji code words
  const triggeredEmojiCodes = emojiCodeWords.filter(code =>
    combinedInput.includes(code)
  );
  
  // Check for dangerous emoji combinations
  const hasDangerousCombination = dangerousEmojiCombinations.some(combo => {
    return combo.emojis.every(emoji => fullText.includes(emoji));
  });
  
  if (hasDangerousCombination) {
    triggeredEmojis.push('emoji_combination');
  }
  
  const hasViolation = triggeredKeywords.length > 0 || triggeredEmojis.length > 0 || triggeredEmojiCodes.length > 0;
  
  return {
    triggered: hasViolation,
    keywords: triggeredKeywords,
    emojis: triggeredEmojis,
    emojiCodes: triggeredEmojiCodes
  };
}

/**
 * Layer 2: Check if OpenAI returned a safety violation signal
 */
function containsSafetySignal(steps: GeneratedStep[]): boolean {
  const serialized = JSON.stringify(steps);
  return serialized.includes('[SAFETY_VIOLATION_SIGNAL]');
}

/**
 * Handle Layer 2 safety violations (detected during generation)
 */
async function handleLayer2Violation(
  supabase: any,
  userId: string,
  payload: PMGoalCreationInput,
  generatedContent: string
): Promise<Response> {
  console.error('⚠️ LAYER 2 SAFETY VIOLATION: OpenAI detected unsafe content');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, is_self_registered')
    .eq('user_id', userId)
    .single();

  const violationLog: SafetyViolationLog = {
    user_id: userId,
    violation_layer: 'layer_2_generation',
    goal_title: payload.title,
    goal_category: payload.domain,
    motivation: payload.motivation,
    barriers: payload.barriers,
    violation_reason: 'OpenAI detected unsafe content during step generation',
    user_email: profile?.email || null,
    user_age: payload.userAge || null,
    skill_level: payload.skillAssessment.calculatedLevel,
    is_self_registered: profile?.is_self_registered || null
  };

  const { error: logError } = await supabase
    .from('safety_violations_log')
    .insert(violationLog);

  if (logError) {
    console.error('❌ Failed to log Layer 2 violation:', logError);
  } else {
    console.log('✅ Layer 2 violation logged to database');
  }

  notifySafetyViolation(
    supabase,
    userId,
    payload.title,
    'layer_2_generation',
    violationLog.violation_reason,
    []
  ).catch(err => console.error('Notification error:', err));

  return new Response(
    JSON.stringify({
      error: "I'm sorry, I cannot generate steps for this goal. Please try rephrasing your goal to focus on positive, legal, and healthy outcomes.",
      code: 'SAFETY_VIOLATION_LAYER_2',
      safety_violation: true,
      no_retry: true,
      details: 'Content flagged during AI generation as potentially harmful.'
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get domain-specific guidance for PM step generation
 */
function getDomainGuidance(domain: string, skillLevel: number): string {
  const lv = skillLevel <= 2 ? 'emerging' : skillLevel <= 4 ? 'developing' : 'advancing';
  
  const domainGuidelines: Record<string, string> = {
    independent_living: `IL(${skillLevel}): ${lv === 'emerging' ? 'Small steps, checklists, high support' : lv === 'developing' ? 'Moderate independence' : 'Full autonomy'}`,
    employment: `Employ(${skillLevel}): ${lv === 'emerging' ? 'Explore → role-play' : lv === 'developing' ? 'Apply → interview' : 'Advance → network'}`,
    education: `Edu(${skillLevel}): ${lv === 'emerging' ? 'Routines, visual aids' : lv === 'developing' ? 'Time mgmt, notes' : 'Research, self-directed'}`,
    social_skills: `Social(${skillLevel}): ${lv === 'emerging' ? 'Greetings, scripts' : lv === 'developing' ? 'Groups, cues' : 'Leadership, advocacy'}`,
    health: `Health(${skillLevel}): ${lv === 'emerging' ? 'Simple habits, reminders' : lv === 'developing' ? 'Self-monitoring' : 'Independent mgmt'}`,
    recreation_fun: `Rec(${skillLevel}): ${lv === 'emerging' ? 'Structured, simple' : lv === 'developing' ? 'Solo/group balance' : 'Lead activities'}`
  };
  
  return domainGuidelines[domain] || domainGuidelines.independent_living;
}

/**
 * Build the comprehensive system prompt for PM step generation
 */
function buildPMSystemPrompt(input: PMGoalCreationInput): string {
  const domainGuidance = getDomainGuidance(input.domain, input.skillAssessment.calculatedLevel);
  const motivation = input.motivation || "Learning and improving this skill";
  
  return `Progressive Mastery coach (ages 14-26). Generate 6-8 personalized steps.

**SAFETY**: Refuse violence, self-harm, illegal, sexual, dangerous, harassment, inappropriate content.
If unsafe: return [{"title": "[SAFETY_VIOLATION_SIGNAL]", "description": "[SAFETY_VIOLATION_SIGNAL]", "estimatedDuration": 0, "supportLevel": "high", "difficulty": 1, "weekNumber": "Week 1", "phase": 1}]

**CONTEXT**
Goal: ${input.title} | Domain: ${domainGuidance} | ${input.duration_weeks}w | Lv ${input.skillAssessment.calculatedLevel} (${input.skillAssessment.levelLabel})
Frequency: ${input.smartStart.startingFrequency}→${input.smartStart.targetFrequency}x/w (${input.smartStart.rampWeeks}w ramp)
Motivation: ${motivation}${input.barriers ? ` | Barriers: ${input.barriers}` : ''}${!input.prerequisites.hasEverything ? ` | Needs: ${input.prerequisites.needs}` : ''}${input.teachingHelper ? ` | Helper: ${input.teachingHelper.helperName}` : ''}

**PHASES**
1. Foundation (1-2w): HIGH support, 5-15min basics
2. Guided (3-4w): MED-HIGH support, 15-30min practice
3. Independence (5-6w): MED-LOW support, 30-45min
4. Mastery (7+w): LOW support, full independence

**RULES**
- Concrete & measurable (no "exercise more", use "walk 15min 3x/w")
- Right-sized for skill level (Lv1: 2min tasks; Lv5: 20min)
- Clear what/when/how
- Address barriers directly
- Sequential progression (no level jumps)
- 60%+ steps reference "${input.title}"
- No placeholders ([Name], [Goal])

**OUTPUT JSON**
{"steps": [{"title": "...", "description": "...", "estimatedDuration": 15, "supportLevel": "high", "difficulty": 1, "weekNumber": "Week 1", "phase": 1, "prerequisites": [], "safetyNotes": null, "qualityIndicators": ["..."], "independenceIndicators": ["..."], "practiceCount": 5}]}`;
}

/**
 * Validate generated steps for basic format compliance
 */
function validateBasicFormat(steps: GeneratedStep[], input: PMGoalCreationInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (steps.length < 6 || steps.length > 10) {
    errors.push(`Expected 6-10 steps, got ${steps.length}`);
  }
  
  const goalKeywords = input.title.toLowerCase()
    .split(' ')
    .filter(word => word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(word));
  
  let stepsWithGoalReference = 0;
  
  steps.forEach((step, index) => {
    const stepNum = index + 1;
    
    if (!step.title || step.title.trim().length === 0) {
      errors.push(`Step ${stepNum}: Missing title`);
    }
    if (!step.description || step.description.trim().length === 0) {
      errors.push(`Step ${stepNum}: Missing description`);
    }
    if (!step.weekNumber) {
      errors.push(`Step ${stepNum}: Missing weekNumber`);
    }
    if (!step.phase || step.phase < 1 || step.phase > 4) {
      errors.push(`Step ${stepNum}: Invalid phase (must be 1-4)`);
    }
    
    if (step.title && (step.title.length < 10 || step.title.length > 80)) {
      warnings.push(`Step ${stepNum}: Title length ${step.title.length} (should be 10-80 chars)`);
    }
    if (step.description && (step.description.length < 50 || step.description.length > 400)) {
      warnings.push(`Step ${stepNum}: Description length ${step.description.length} (should be 50-400 chars)`);
    }
    
    const placeholderPatterns = [
      /\[.*?\]/,
      /\bgoal\b.*?\bhere\b/i,
      /\btask\b.*?\bhere\b/i,
      /\bactivity\b.*?\bhere\b/i,
    ];
    
    const titleLower = step.title?.toLowerCase() || '';
    const descLower = step.description?.toLowerCase() || '';
    
    placeholderPatterns.forEach(pattern => {
      if (pattern.test(titleLower) || pattern.test(descLower)) {
        errors.push(`Step ${stepNum}: Contains placeholder text (${pattern.source})`);
      }
    });
    
    const stepText = `${titleLower} ${descLower}`;
    const hasGoalKeyword = goalKeywords.some(keyword => stepText.includes(keyword));
    if (hasGoalKeyword) {
      stepsWithGoalReference++;
    }
    
    if (index > 0 && step.difficulty && steps[index - 1].difficulty) {
      if (step.difficulty < steps[index - 1].difficulty - 1) {
        warnings.push(`Step ${stepNum}: Difficulty decreased significantly from previous step`);
      }
    }
    
    const validSupportLevels = ['high', 'medium', 'low', 'minimal', 'none'];
    if (step.supportLevel && !validSupportLevels.includes(step.supportLevel)) {
      errors.push(`Step ${stepNum}: Invalid supportLevel "${step.supportLevel}"`);
    }
  });
  
  const goalAlignmentPercent = (stepsWithGoalReference / steps.length) * 100;
  if (goalAlignmentPercent < 60) {
    errors.push(`Only ${Math.round(goalAlignmentPercent)}% of steps reference the goal (need 60%)`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Call OpenAI API to generate PM steps (single attempt, used as fallback)
 */
async function callAIWithRetry(
  payload: PMGoalCreationInput,
  retryGuidance: string = ''
): Promise<GeneratedStep[]> {
  // Use Lovable AI Gateway for OpenAI fallback to keep secrets in Supabase
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const systemPrompt = buildPMSystemPrompt(payload);
  const userPrompt = retryGuidance
    ? `${retryGuidance}\n\nGenerate steps.`
    : `Generate 6-8 steps.`;

  const tools = [{
    type: 'function',
    function: {
      name: 'generate_pm_steps',
      description: 'Return 6–8 PM steps',
      parameters: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            minItems: 6,
            maxItems: 8,
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                estimatedDuration: { type: 'number' },
                supportLevel: { type: 'string', enum: ['high', 'medium', 'low', 'minimal', 'none'] },
                difficulty: { type: 'number', minimum: 1, maximum: 6 },
                weekNumber: { type: 'string' },
                phase: { type: 'number', minimum: 1, maximum: 4 },
                prerequisites: { type: 'array', items: { type: 'string' } },
                safetyNotes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                qualityIndicators: { type: 'array', items: { type: 'string' } },
                independenceIndicators: { type: 'array', items: { type: 'string' } },
                practiceCount: { type: 'number' }
              },
              required: ['title', 'description', 'estimatedDuration', 'supportLevel', 'difficulty', 'weekNumber', 'phase']
            }
          }
        },
        required: ['steps']
      }
    }
  }];

  // Helper to robustly parse JSON from content if tool_calls are missing
  const tryExtractJson = (content: string): GenerationResponse | null => {
    try {
      const fenced = content.match(/```(?:json)?\n([\s\S]*?)```/i);
      if (fenced) return JSON.parse(fenced[1]);
      // Braces scan
      const start = content.indexOf('{');
      if (start !== -1) {
        let depth = 0;
        for (let i = start; i < content.length; i++) {
          const ch = content[i];
          if (ch === '{') depth++;
          if (ch === '}') depth--;
          if (depth === 0) {
            const slice = content.slice(start, i + 1);
            return JSON.parse(slice);
          }
        }
      }
    } catch { /* ignore */ }
    return null;
  };

  console.log(`🔄 OpenAI fallback via Lovable Gateway (single try)`);
  const attemptStart = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools,
        tool_choice: { type: 'function', function: { name: 'generate_pm_steps' } },
        max_completion_tokens: 1200
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const attemptDuration = Date.now() - attemptStart;
    console.log(`⏱️ OpenAI (gateway) attempt took ${attemptDuration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI (gateway) error:', response.status, errorText);
      throw new Error(`OpenAI (gateway) error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const toolCalls = choice?.message?.tool_calls || choice?.tool_calls;

    if (toolCalls && Array.isArray(toolCalls)) {
      const fnCall = toolCalls.find((tc: any) => tc.type === 'function' && tc.function?.name === 'generate_pm_steps');
      if (fnCall) {
        const args = JSON.parse(fnCall.function.arguments || '{}');
        if (args?.steps && Array.isArray(args.steps)) {
          console.log(`🛠️ Parsed tool_calls with ${args.steps.length} steps`);
          return args.steps as GeneratedStep[];
        }
      }
      console.warn('⚠️ tool_calls present but could not parse steps');
    }

    const content = choice?.message?.content ?? '';
    const parsed = tryExtractJson(content);
    if (parsed?.steps && Array.isArray(parsed.steps)) {
      console.log(`🧩 Fallback JSON extraction succeeded with ${parsed.steps.length} steps`);
      return parsed.steps;
    }

    throw new Error('OpenAI (gateway) response missing steps');
  } catch (error: any) {
    const attemptDuration = Date.now() - attemptStart;
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      console.error(`❌ OpenAI (gateway) timed out after ${attemptDuration}ms`);
      throw new Error(`Request timed out after ${AI_TIMEOUT_MS / 1000}s`);
    }
    console.error('❌ OpenAI (gateway) failed:', error?.message || error);
    throw error;
  }
}

/**
 * Primary AI provider: Lovable AI Gateway (Google Gemini 2.5 Flash)
 * Fast, reliable, and recommended for step generation
 */
async function callLovableAIWithRetry(
  payload: PMGoalCreationInput,
  retryGuidance: string = ''
): Promise<GeneratedStep[]> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const systemPrompt = buildPMSystemPrompt(payload);
  const userPrompt = retryGuidance
    ? `${retryGuidance}\n\nNow generate the steps following all requirements.`
    : `Generate 6-8 Progressive Mastery steps for this goal.`;

  // Tool schema to force structured output
  const tools = [
    {
      type: 'function',
      function: {
        name: 'generate_pm_steps',
        description: 'Return 6–8 Progressive Mastery steps for the goal',
        parameters: {
          type: 'object',
          properties: {
            steps: {
              type: 'array',
              minItems: 6,
              maxItems: 8,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  estimatedDuration: { type: 'number' },
                  supportLevel: { type: 'string', enum: ['high', 'medium', 'low', 'minimal', 'none'] },
                  difficulty: { type: 'number', minimum: 1, maximum: 6 },
                  weekNumber: { type: 'string' },
                  phase: { type: 'number', minimum: 1, maximum: 4 },
                  prerequisites: { type: 'array', items: { type: 'string' } },
                  safetyNotes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                  qualityIndicators: { type: 'array', items: { type: 'string' } },
                  independenceIndicators: { type: 'array', items: { type: 'string' } },
                  practiceCount: { type: 'number' }
                },
                required: ['title', 'description', 'estimatedDuration', 'supportLevel', 'difficulty', 'weekNumber', 'phase']
              }
            }
          },
          required: ['steps'],
          additionalProperties: false
        }
      }
    }
  ];

  // Helper to robustly parse JSON from content if tool_calls are missing
  const tryExtractJson = (content: string): GenerationResponse | null => {
    try {
      const fenced = content.match(/```(?:json)?\n([\s\S]*?)```/i);
      if (fenced) return JSON.parse(fenced[1]);
      const start = content.indexOf('{');
      if (start !== -1) {
        let depth = 0;
        for (let i = start; i < content.length; i++) {
          const ch = content[i];
          if (ch === '{') depth++;
          if (ch === '}') depth--;
          if (depth === 0) {
            const slice = content.slice(start, i + 1);
            return JSON.parse(slice);
          }
        }
      }
    } catch { /* ignore */ }
    return null;
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_LOVABLE_ATTEMPTS; attempt++) {
    console.log(`🔄 Lovable AI attempt ${attempt}/${MAX_LOVABLE_ATTEMPTS}`);
    const attemptStart = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      // Select model based on complexity
      const skillLevel = payload.skillAssessment.calculatedLevel;
      const isSimple = skillLevel <= 3 && payload.duration_weeks <= 8;
      const selectedModel = isSimple ? 'google/gemini-2.5-flash-lite' : 'google/gemini-2.5-flash';
      const maxTokens = isSimple ? 800 : 1200;
      
      console.log(`📤 Calling Lovable AI Gateway (${selectedModel}, max ${maxTokens} tokens)...`);
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          tools,
          tool_choice: { type: 'function', function: { name: 'generate_pm_steps' } },
          max_completion_tokens: maxTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const attemptDuration = Date.now() - attemptStart;
      console.log(`⏱️ Lovable AI attempt ${attempt} took ${attemptDuration}ms`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Lovable AI error:', response.status, errorText);

        if (response.status === 429 || response.status === 402) {
          lastError = new Error('Lovable AI rate limit or quota exceeded');
          if (attempt < MAX_LOVABLE_ATTEMPTS) {
            const backoffDelay = attempt === 1 ? 1000 : 2000; // 1s then 2s
            console.log(`⏳ Backing off ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          }
        }

        throw new Error(`Lovable AI error: ${response.status}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const toolCalls = choice?.message?.tool_calls || choice?.tool_calls;

      if (toolCalls && Array.isArray(toolCalls)) {
        const fnCall = toolCalls.find((tc: any) => tc.type === 'function' && tc.function?.name === 'generate_pm_steps');
        if (fnCall) {
          const args = JSON.parse(fnCall.function.arguments || '{}');
          if (args?.steps && Array.isArray(args.steps)) {
            console.log(`🛠️ Parsed tool_calls with ${args.steps.length} steps`);
            return args.steps as GeneratedStep[];
          }
        }
        console.warn('⚠️ tool_calls present but could not parse steps');
      }

      const content = choice?.message?.content ?? '';
      const parsed = tryExtractJson(content);
      if (parsed?.steps && Array.isArray(parsed.steps)) {
        console.log(`🧩 Fallback JSON extraction succeeded with ${parsed.steps.length} steps`);
        return parsed.steps;
      }

      throw new Error('Lovable AI response missing steps');
    } catch (error: any) {
      const attemptDuration = Date.now() - attemptStart;

      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.error(`❌ Lovable AI attempt ${attempt} timed out after ${attemptDuration}ms`);
        lastError = new Error(`Lovable AI timed out after ${AI_TIMEOUT_MS / 1000}s`);
      } else {
        console.error(`❌ Lovable AI attempt ${attempt} failed:`, error.message);
        lastError = error;
      }

      if (attempt < MAX_LOVABLE_ATTEMPTS) {
        const backoffDelay = attempt === 1 ? 1000 : 2000; // 1s then 2s
        console.log(`⏳ Backing off ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  console.error(`❌ All ${MAX_LOVABLE_ATTEMPTS} Lovable AI attempts failed`);
  throw lastError || new Error('Lovable AI failed after all retries');
}

// Safety Violation Notification Helper
async function notifySafetyViolation(
  supabase: any,
  userId: string,
  goalTitle: string,
  layer: string,
  reason: string,
  triggeredKeywords?: string[]
) {
  console.log(`🚨 Safety violation notification for user ${userId}, layer: ${layer}`);
  
  try {
    // 1. Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, email, user_type')
      .eq('user_id', userId)
      .single();
    
    const userName = profile?.first_name || 'User';
    const userEmail = profile?.email || null;
    
    // 2. Fetch teaching helper if exists (from goals pm_metadata)
    let teachingHelper = null;
    const { data: helperSupporter } = await supabase
      .from('supporters')
      .select('supporter_id, individual_id')
      .eq('individual_id', userId)
      .eq('is_admin', true)
      .limit(1)
      .single();
    
    if (helperSupporter) {
      const { data: helperProfile } = await supabase
        .from('profiles')
        .select('first_name, email')
        .eq('user_id', helperSupporter.supporter_id)
        .single();
      
      if (helperProfile) {
        teachingHelper = {
          id: helperSupporter.supporter_id,
          name: helperProfile.first_name,
          email: helperProfile.email
        };
      }
    }
    
    // 3. Fetch all supporters
    const { data: supporters } = await supabase
      .from('supporters')
      .select('supporter_id')
      .eq('individual_id', userId);
    
    const supporterIds = supporters?.map((s: any) => s.supporter_id) || [];
    
    // 4. Update safety_violations_log with notification flags
    const { error: updateError } = await supabase
      .from('safety_violations_log')
      .update({
        compliance_notified: true,
        supporter_notified: supporterIds.length > 0,
        helper_notified: !!teachingHelper
      })
      .eq('user_id', userId)
      .eq('goal_title', goalTitle)
      .eq('violation_layer', layer)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (updateError) {
      console.error('Failed to update notification flags:', updateError);
    }
    
    // 5. Send in-app notifications to helper and supporters
    const notifications = [];
    
    if (teachingHelper) {
      notifications.push({
        user_id: teachingHelper.id,
        type: 'safety_violation',
        title: 'Safety Alert',
        message: `${userName} attempted to create a goal that violated safety guidelines: "${goalTitle}"`,
        data: {
          individual_id: userId,
          goal_title: goalTitle,
          violation_layer: layer
        }
      });
    }
    
    for (const supporterId of supporterIds) {
      if (supporterId !== teachingHelper?.id) {
        notifications.push({
          user_id: supporterId,
          type: 'safety_violation',
          title: 'Safety Alert',
          message: `${userName} attempted to create a goal that violated safety guidelines.`,
          data: {
            individual_id: userId,
            goal_title: goalTitle,
            violation_layer: layer
          }
        });
      }
    }
    
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);
      
      if (notifError) {
        console.error('Failed to create in-app notifications:', notifError);
      } else {
        console.log(`✅ Created ${notifications.length} in-app notifications`);
      }
    }
    
    // 6. Send email notifications via send-notification-email function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const emailPayload = {
      type: 'safety_violation',
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      goalTitle: goalTitle,
      layer: layer,
      reason: reason,
      triggeredKeywords: triggeredKeywords,
      supporterIds: supporterIds
    };
    
    const emailResponse = await fetch(
      `${supabaseUrl}/functions/v1/send-notification-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(emailPayload)
      }
    );
    
    if (!emailResponse.ok) {
      console.error('Failed to send email notifications:', await emailResponse.text());
    } else {
      console.log('✅ Email notifications sent');
    }
    
  } catch (error: any) {
    console.error('Error in notifySafetyViolation:', error.message);
    // Don't throw - we still want to return error to user even if notifications fail
  }
}

// Main Handler
serve(async (req) => {
  const startTime = Date.now();
  
  // Log request details
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // 1. Validate POST method
    if (req.method !== 'POST') {
      console.error('❌ Invalid method:', req.method);
      return new Response(
        JSON.stringify({ 
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          code: 'MISSING_ENV_VARS'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Extract and verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ 
          error: 'Missing authorization header',
          code: 'NO_AUTH_HEADER'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with error handling
    let supabase;
    try {
      const token = authHeader.replace('Bearer ', '');
      supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error('❌ Auth error:', authError?.message);
        return new Response(
          JSON.stringify({ 
            error: 'Unauthorized',
            code: 'AUTH_FAILED'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = user.id;
      console.log(`✅ Authenticated user: ${userId}`);

      // 4. Parse request body with explicit error handling
      let payload: PMGoalCreationInput;
      try {
        const rawBody = await req.text();
        console.log(`📄 Request body length: ${rawBody.length} bytes`);
        
        payload = JSON.parse(rawBody);
        
        console.log('📝 Parsed payload:', {
          hasTitle: !!payload.title,
          hasDomain: !!payload.domain,
          hasSkillAssessment: !!payload.skillAssessment,
          hasSmartStart: !!payload.smartStart,
          hasMotivation: !!payload.motivation
        });
        
      } catch (parseError: any) {
        console.error('❌ JSON parsing failed:', parseError.message);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON in request body',
            code: 'INVALID_JSON',
            details: parseError.message
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 5. Validate required fields
      const requiredFields: Array<keyof PMGoalCreationInput> = [
        'title', 'domain', 'duration_weeks', 'skillAssessment', 
        'smartStart', 'prerequisites', 'motivation', 'userId', 'userName'
      ];
      
      for (const field of requiredFields) {
        if (!payload[field]) {
          console.error(`❌ Missing required field: ${field}`);
          return new Response(
            JSON.stringify({ 
              error: `Missing required field: ${field}`,
              code: 'MISSING_FIELD',
              field: field
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // 6. Validate field types and values
      console.log('🔍 Validating title:', {
        title: payload.title,
        type: typeof payload.title,
        length: payload.title?.length,
        raw: JSON.stringify(payload.title)
      });

      if (!payload.title || typeof payload.title !== 'string') {
        console.error('❌ Title is not a string:', payload.title);
        return new Response(
          JSON.stringify({ 
            error: 'Goal title must be a string',
            code: 'INVALID_TITLE_TYPE',
            received: typeof payload.title
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const trimmedTitle = payload.title.trim();
      if (trimmedTitle.length < 10 || trimmedTitle.length > 100) {
        console.error('❌ Invalid title length:', {
          title: trimmedTitle,
          length: trimmedTitle.length
        });
        return new Response(
          JSON.stringify({ 
            error: `Goal title must be between 10 and 100 characters (received ${trimmedTitle.length} characters)`,
            code: 'INVALID_TITLE_LENGTH',
            titleLength: trimmedTitle.length
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use trimmed title for the rest of the function
      payload.title = trimmedTitle;

      const validDomains = ['independent_living', 'employment', 'education', 'social_skills', 'health', 'recreation_fun'];
      if (!validDomains.includes(payload.domain)) {
        console.error('❌ Invalid domain:', payload.domain);
        return new Response(
          JSON.stringify({ 
            error: `Invalid domain. Must be one of: ${validDomains.join(', ')}`,
            code: 'INVALID_DOMAIN'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (typeof payload.duration_weeks !== 'number' || payload.duration_weeks < 1 || payload.duration_weeks > 52) {
        console.error('❌ Invalid duration_weeks:', payload.duration_weeks);
        return new Response(
          JSON.stringify({ 
            error: 'Duration must be between 1 and 52 weeks',
            code: 'INVALID_DURATION'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate nested objects
      if (!payload.skillAssessment.calculatedLevel || !payload.skillAssessment.levelLabel) {
        console.error('❌ Invalid skillAssessment');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid skill assessment data',
            code: 'INVALID_SKILL_ASSESSMENT'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!payload.smartStart.startingFrequency || !payload.smartStart.targetFrequency) {
        console.error('❌ Invalid smartStart');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid smart start data',
            code: 'INVALID_SMART_START'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (typeof payload.prerequisites.hasEverything !== 'boolean') {
        console.error('❌ Invalid prerequisites');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid prerequisites data',
            code: 'INVALID_PREREQUISITES'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ All validations passed');
      console.log(`⏱️ Validation took ${Date.now() - startTime}ms`);

      // 7. LAYER 1: Fast keyword and emoji safety check
      console.log('🔍 Running Layer 1 safety check...');
      const safetyCheckStart = Date.now();
      
      const safetyResult = checkLayer1Safety(payload);
      console.log(`⏱️ Safety check took ${Date.now() - safetyCheckStart}ms`);

      if (safetyResult.triggered) {
        console.error('⚠️ LAYER 1 SAFETY VIOLATION detected:', {
          keywords: safetyResult.keywords,
          emojis: safetyResult.emojis,
          emojiCodes: safetyResult.emojiCodes
        });

        // Get user profile for logging
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, is_self_registered')
          .eq('user_id', userId)
          .single();

        // Build detailed reason
        const reasons = [];
        if (safetyResult.keywords.length > 0) reasons.push(`keywords: ${safetyResult.keywords.join(', ')}`);
        if (safetyResult.emojis.length > 0) reasons.push(`emojis: ${safetyResult.emojis.join(', ')}`);
        if (safetyResult.emojiCodes.length > 0) reasons.push(`emoji codes: ${safetyResult.emojiCodes.join(', ')}`);

        // Log to safety_violations_log
        const violationLog: SafetyViolationLog = {
          user_id: userId,
          violation_layer: 'layer_1_keywords',
          goal_title: payload.title,
          goal_category: payload.domain,
          motivation: payload.motivation,
          barriers: payload.barriers,
          triggered_keywords: [...safetyResult.keywords, ...safetyResult.emojis, ...safetyResult.emojiCodes],
          violation_reason: `Triggered: ${reasons.join(' | ')}`,
          user_email: profile?.email || null,
          user_age: payload.userAge || null,
          skill_level: payload.skillAssessment.calculatedLevel,
          is_self_registered: profile?.is_self_registered || null
        };

        const { error: logError } = await supabase
          .from('safety_violations_log')
          .insert(violationLog);

        if (logError) {
          console.error('❌ Failed to log safety violation:', logError);
        } else {
          console.log('✅ Safety violation logged to database');
        }

        // Notify compliance and supporters (don't await - fire and forget)
        notifySafetyViolation(
          supabase,
          userId,
          payload.title,
          'layer_1_keywords',
          violationLog.violation_reason,
          [...safetyResult.keywords, ...safetyResult.emojis, ...safetyResult.emojiCodes]
        ).catch(err => console.error('Notification error:', err));

        // Return error to user immediately
        return new Response(
          JSON.stringify({
            error: "I'm sorry, I cannot process that request. Please try rephrasing your goal, focusing on positive, legal, and healthy outcomes.",
            code: 'SAFETY_VIOLATION',
            safety_violation: true,
            no_retry: true,
            details: 'Content includes inappropriate keywords, emojis, or coded language.',
            triggered: {
              keywords: safetyResult.keywords.length > 0,
              emojis: safetyResult.emojis.length > 0,
              emojiCodes: safetyResult.emojiCodes.length > 0
            }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Layer 1 safety check passed');

      // Check if async mode is requested (instant deterministic fallback approach)
      const mode = payload.mode || 'async'; // Default to async for fast UX
      
      if (mode === 'async') {
        console.log('⚡ Async mode: Returning immediately, AI generation will run in background');
        
        // Return immediately to frontend
        const immediateResponse = new Response(
          JSON.stringify({
            status: 'queued',
            message: 'Goal created successfully. AI is enhancing your practice steps in the background.',
            goalId: payload.goalId
          }),
          { 
            status: 202, // Accepted
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json'
            } 
          }
        );
        
        // Start background AI generation using waitUntil
        const backgroundTask = async () => {
          // Generate unique task ID for tracking
          const taskId = crypto.randomUUID().slice(0, 8);
          console.log(`🚀 [${taskId}] Background task STARTED for goal: ${payload.goalId}`);
          console.log(`📊 [${taskId}] Task context:`, {
            goalTitle: payload.title,
            domain: payload.domain,
            userId: userId,
            mode: 'async'
          });
          
          try {
            console.log(`🔄 [${taskId}] Phase 1: Starting AI step generation...`);
            const genStart = Date.now();
            
            let generatedSteps: GeneratedStep[] | null = null;
            let aiProvider = 'none';
            
            // Try Lovable AI first (faster, recommended)
            try {
              console.log(`🤖 [${taskId}] Attempting Lovable AI generation (Gemini 2.5 Flash)...`);
              const lovableStart = Date.now();
              const rawSteps = await callLovableAIWithRetry(payload);
              console.log(`✅ [${taskId}] Lovable AI returned ${rawSteps.length} steps in ${Date.now() - lovableStart}ms`);
              
              console.log(`🔍 [${taskId}] Checking for safety violations...`);
              if (containsSafetySignal(rawSteps)) {
                console.error(`⚠️ [${taskId}] Layer 2 safety violation detected - aborting enhancement`);
                return; // Don't update steps, keep deterministic ones
              }
              console.log(`✅ [${taskId}] Safety check passed`);
              
              console.log(`🔍 [${taskId}] Validating step format...`);
              const validation = validateBasicFormat(rawSteps, payload);
              if (validation.valid || rawSteps.length > 0) {
                generatedSteps = rawSteps;
                aiProvider = 'lovable';
                console.log(`✅ [${taskId}] Lovable AI validation passed - ${rawSteps.length} AI-enhanced steps ready`);
              } else {
                console.warn(`⚠️ [${taskId}] Lovable AI validation warnings:`, validation.errors);
              }
            } catch (err: any) {
              console.error(`❌ [${taskId}] Lovable AI failed:`, {
                error: err.message,
                stack: err.stack?.slice(0, 200),
                name: err.name
              });
              console.log(`🔄 [${taskId}] Falling back to OpenAI...`);
              
              try {
                console.log(`🤖 [${taskId}] Attempting OpenAI generation (${AI_MODEL})...`);
                const openaiStart = Date.now();
                const rawSteps = await callAIWithRetry(payload);
                console.log(`✅ [${taskId}] OpenAI returned ${rawSteps.length} steps in ${Date.now() - openaiStart}ms`);
                
                if (!containsSafetySignal(rawSteps)) {
                  generatedSteps = rawSteps;
                  aiProvider = 'openai';
                  console.log(`✅ [${taskId}] OpenAI generated ${rawSteps.length} steps`);
                } else {
                  console.error(`⚠️ [${taskId}] OpenAI safety violation detected`);
                }
              } catch (openaiErr: any) {
                console.error(`❌ [${taskId}] OpenAI failed:`, {
                  error: openaiErr.message,
                  stack: openaiErr.stack?.slice(0, 200)
                });
                console.error(`❌ [${taskId}] Both AI providers failed - keeping deterministic steps`);
                return;
              }
            }
            
            if (!generatedSteps || generatedSteps.length === 0) {
              console.warn(`⚠️ [${taskId}] No steps generated, keeping deterministic steps`);
              return;
            }
            
            // Fetch existing step IDs first
            console.log(`🔄 [${taskId}] Phase 2: Fetching existing steps for goal ${payload.goalId}...`);
            const { data: existingSteps, error: fetchError } = await supabase
              .from('steps')
              .select('id, order_index')
              .eq('goal_id', payload.goalId)
              .order('order_index', { ascending: true });
            
            if (fetchError || !existingSteps) {
              console.error(`❌ [${taskId}] Failed to fetch existing steps:`, fetchError);
              return;
            }
            
            console.log(`📋 [${taskId}] Found ${existingSteps.length} existing steps, AI generated ${generatedSteps.length}`);
            const existingIds = existingSteps.map(s => s.id);
            
            // Update existing steps by ID (not order_index)
            console.log(`🔄 [${taskId}] Phase 2: Updating ${Math.min(existingIds.length, generatedSteps.length)} steps in database...`);
            const updateStart = Date.now();
            let successCount = 0;
            let failCount = 0;
            
            const updateCount = Math.min(existingIds.length, generatedSteps.length);
            for (let i = 0; i < updateCount; i++) {
              const aiStep = generatedSteps[i];
              const stepId = existingIds[i];
              console.log(`📝 [${taskId}] Updating step ${i + 1}/${updateCount} (ID: ${stepId}): "${aiStep.title.slice(0, 50)}..."`);
              
              const { error: updateError } = await supabase
                .from('steps')
                .update({
                  title: aiStep.title,
                  notes: aiStep.description || '',
                  explainer: aiStep.description || '',
                  estimated_effort_min: aiStep.estimatedDuration || 30,
                  pm_metadata: {
                    version: 1,
                    source: 'pm-microsteps-scaffold',
                    phase: aiStep.phase,
                    weekNumber: aiStep.weekNumber,
                    supportLevel: aiStep.supportLevel,
                    difficulty: aiStep.difficulty,
                    safetyNotes: aiStep.safetyNotes,
                    qualityIndicators: aiStep.qualityIndicators || [],
                    independenceIndicators: aiStep.independenceIndicators || [],
                    practiceCount: aiStep.practiceCount || 1,
                    prerequisites: aiStep.prerequisites || [],
                    enhanced: true,
                    enhancedAt: new Date().toISOString(),
                    modelUsed: AI_MODEL,
                    aiProvider: aiProvider,
                    generationTimeMs: Date.now() - genStart
                  }
                })
                .eq('id', stepId);
              
              if (updateError) {
                failCount++;
                console.error(`❌ [${taskId}] Failed to update step ${i + 1} (ID: ${stepId}):`, updateError);
              } else {
                successCount++;
                console.log(`✅ [${taskId}] Step ${i + 1}/${updateCount} updated successfully`);
              }
            }
            
            // Delete excess fallback steps if AI generated fewer
            if (existingIds.length > generatedSteps.length) {
              const surplusIds = existingIds.slice(generatedSteps.length);
              console.log(`🗑️ [${taskId}] Deleting ${surplusIds.length} excess fallback steps...`);
              const { error: deleteError } = await supabase
                .from('steps')
                .delete()
                .in('id', surplusIds);
              
              if (deleteError) {
                console.error(`❌ [${taskId}] Failed to delete excess steps:`, deleteError);
              } else {
                console.log(`✅ [${taskId}] Deleted ${surplusIds.length} excess fallback steps`);
              }
            }
            
            // Insert new steps if AI generated more than fallback
            if (generatedSteps.length > existingIds.length) {
              const newSteps = generatedSteps.slice(existingIds.length);
              console.log(`➕ [${taskId}] Inserting ${newSteps.length} additional AI steps...`);
              
              for (let i = 0; i < newSteps.length; i++) {
                const aiStep = newSteps[i];
                const orderIndex = existingIds.length + i;
                
                const { error: insertError } = await supabase
                  .from('steps')
                  .insert({
                    goal_id: payload.goalId,
                    title: aiStep.title,
                    notes: aiStep.description || '',
                    explainer: aiStep.description || '',
                    estimated_effort_min: aiStep.estimatedDuration || 30,
                    order_index: orderIndex,
                    status: 'not_started',
                    is_planned: true,
                    step_type: 'habit',
                    pm_metadata: {
                      version: 1,
                      source: 'pm-microsteps-scaffold',
                      phase: aiStep.phase,
                      weekNumber: aiStep.weekNumber,
                      supportLevel: aiStep.supportLevel,
                      difficulty: aiStep.difficulty,
                      safetyNotes: aiStep.safetyNotes,
                      qualityIndicators: aiStep.qualityIndicators || [],
                      independenceIndicators: aiStep.independenceIndicators || [],
                      practiceCount: aiStep.practiceCount || 1,
                      prerequisites: aiStep.prerequisites || [],
                      enhanced: true,
                      enhancedAt: new Date().toISOString(),
                      modelUsed: AI_MODEL,
                      aiProvider: aiProvider,
                      generationTimeMs: Date.now() - genStart
                    }
                  });
                
                if (insertError) {
                  console.error(`❌ [${taskId}] Failed to insert new step ${i + 1}:`, insertError);
                } else {
                  successCount++;
                  console.log(`✅ [${taskId}] Inserted new step ${i + 1}/${newSteps.length}`);
                }
              }
            }
            
            console.log(`✅ [${taskId}] Database update complete: ${successCount} success, ${failCount} failed in ${Date.now() - updateStart}ms`);
            
            // Send notification to user
            console.log(`🔔 [${taskId}] Phase 3: Sending notification to user ${userId}...`);
            const notifStart = Date.now();
            const { error: notifError } = await supabase.from('notifications').insert({
              user_id: userId,
              type: 'goal_enhanced',
              title: 'Practice Steps Enhanced! ✨',
              message: `Your ${payload.title} goal now has AI-personalized guidance and tips.`,
              data: { goalId: payload.goalId, stepsCount: generatedSteps.length }
            });
            
            if (notifError) {
              console.error(`❌ [${taskId}] Notification failed:`, notifError);
            } else {
              console.log(`✅ [${taskId}] Notification sent in ${Date.now() - notifStart}ms`);
            }
            
            console.log(`🎉 [${taskId}] Background task COMPLETED successfully in ${Date.now() - genStart}ms`);
            console.log(`📊 [${taskId}] Final stats:`, {
              totalTime: Date.now() - genStart,
              stepsEnhanced: successCount,
              stepsFailed: failCount,
              aiProvider: aiProvider
            });
            
          } catch (bgError: any) {
            console.error(`❌ [${taskId}] Background task FAILED with error:`, {
              error: bgError.message,
              stack: bgError.stack,
              name: bgError.name
            });
            // Don't throw - log and allow function to complete
          } finally {
            console.log(`🏁 [${taskId}] Background task exiting`);
          }
        };
        
        // Use EdgeRuntime.waitUntil to keep function alive for background task
        console.log('⏳ Registering background task with EdgeRuntime.waitUntil...');
        EdgeRuntime.waitUntil(
          backgroundTask().catch(err => {
            console.error('❌ waitUntil promise rejected:', {
              error: err.message,
              stack: err.stack
            });
            // Don't re-throw - just log
          })
        );
        console.log('✅ Background task registered successfully');
        
        return immediateResponse;
      }

      // SYNC MODE: Original behavior - wait for AI generation
      console.log('⏳ Sync mode: Waiting for AI generation...');

      // 8. Generate steps using OpenAI API with Lovable AI fallback
      console.log('🤖 Starting AI step generation with Layer 2 safety...');
      const generationStart = Date.now();

      let generatedSteps: GeneratedStep[] | null = null;
      
      try {
        console.log('🤖 Attempting Lovable AI generation (primary)...');
        const rawSteps = await callLovableAIWithRetry(payload);
        
        // Check for Layer 2 safety signal
        if (containsSafetySignal(rawSteps)) {
          console.error('⚠️ Layer 2 safety violation detected in generated steps');
          return await handleLayer2Violation(supabase, userId, payload, JSON.stringify(rawSteps));
        }
        
        // Validate step format
        const validation = validateBasicFormat(rawSteps, payload);
        
        if (validation.valid) {
          console.log(`✅ Lovable AI validation passed - generated ${rawSteps.length} steps`);
          generatedSteps = rawSteps;
        } else {
          console.error(`❌ Lovable AI validation failed:`, validation.errors);
          console.warn('⚠️ Returning steps despite validation errors to avoid blocking user');
          generatedSteps = rawSteps; // Allow through with warnings
        }
      } catch (lovableError: any) {
        console.warn('⚠️ Lovable AI failed, trying OpenAI fallback...', lovableError.message);
        
        try {
          const rawSteps = await callAIWithRetry(payload);
          
          // Check for Layer 2 safety signal
          if (containsSafetySignal(rawSteps)) {
            console.error('⚠️ Layer 2 safety violation detected in OpenAI steps');
            return await handleLayer2Violation(supabase, userId, payload, JSON.stringify(rawSteps));
          }
          
          // Validate step format
          const validation = validateBasicFormat(rawSteps, payload);
          
          if (validation.valid) {
            console.log(`✅ OpenAI validation passed - generated ${rawSteps.length} steps`);
            generatedSteps = rawSteps;
          } else {
            console.warn('⚠️ OpenAI validation warnings:', validation.errors);
            generatedSteps = rawSteps; // Allow through with warnings
          }
          
        } catch (openaiError: any) {
          console.error('❌ Both Lovable AI and OpenAI failed:', {
            lovable: lovableError.message,
            openai: openaiError.message
          });
          
          // Return error - frontend will use deterministic fallback
          return new Response(
            JSON.stringify({ 
              error: 'AI generation temporarily unavailable. Please try again.',
              code: 'AI_GENERATION_FAILED',
              useFallback: true
            }),
            { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Ensure we have steps before continuing
      if (!generatedSteps) {
        console.error(`❌ Step generation failed: No steps generated`);
        
        // Return friendly error for user
        return new Response(
          JSON.stringify({ 
            error: 'Step generation failed. Please try again in a moment.',
            code: 'GENERATION_FAILED',
            useFallback: true // Signal frontend to use fallback generator
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!generatedSteps) {
        return new Response(
          JSON.stringify({
            error: 'Step generation failed unexpectedly',
            code: 'GENERATION_UNKNOWN_ERROR',
            useFallback: true
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 9. Prepare final response with metadata and insert steps if needed
      
      // Check if goal has existing steps
      const { data: existingSteps, error: fetchError } = await supabase
        .from('steps')
        .select('id')
        .eq('goal_id', payload.goalId);
      
      if (fetchError) {
        console.error('❌ Failed to check existing steps:', fetchError);
      } else if (!existingSteps || existingSteps.length === 0) {
        // No steps exist - insert AI-generated steps directly
        console.log('➕ No existing steps found, inserting AI-generated steps...');
        
        const stepsToInsert = generatedSteps.map((step, idx) => ({
          goal_id: payload.goalId,
          title: step.title,
          notes: step.description,
          explainer: step.description,
          estimated_effort_min: step.estimatedDuration,
          step_type: 'habit',
          is_planned: true,
          status: 'not_started',
          order_index: idx,
          pm_metadata: {
            ...step,
            version: 1,
            source: 'pm-microsteps-scaffold',
            enhanced: true,
            modelUsed: AI_MODEL,
            aiProvider: 'lovable-ai',
            generatedAt: new Date().toISOString()
          }
        }));
        
        const { error: insertError } = await supabase
          .from('steps')
          .insert(stepsToInsert);
        
        if (insertError) {
          console.error('❌ Failed to insert steps:', insertError);
        } else {
          console.log(`✅ Inserted ${stepsToInsert.length} AI-generated steps`);
        }
      }
      
      const response = {
        steps: generatedSteps,
        metadata: {
          modelUsed: AI_MODEL,
          aiProvider: 'lovable-ai',
          generatedAt: new Date().toISOString(),
          generationTimeMs: generationDuration,
          goalContext: {
            goalId: payload.goalId,
            title: payload.title,
            domain: payload.domain,
            skillLevel: payload.skillAssessment.calculatedLevel,
            levelLabel: payload.skillAssessment.levelLabel,
            duration_weeks: payload.duration_weeks
          }
        }
      };

      const totalTime = Date.now() - startTime;
      console.log(`✅ Request completed successfully in ${totalTime}ms`);

      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Response-Time': `${totalTime}ms`
          } 
        }
      );

    } catch (clientError: any) {
      console.error('❌ Supabase client error:', clientError.message);
      return new Response(
        JSON.stringify({
          error: 'Database connection error',
          code: 'DB_ERROR',
          details: clientError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('❌ Unhandled error in pm-microsteps-scaffold:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
