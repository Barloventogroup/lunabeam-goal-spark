import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

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

// OpenAI Configuration
const MAX_GENERATION_ATTEMPTS = 3;
const AI_MODEL = 'gpt-5-mini-2025-08-07'; // Fast, cost-efficient GPT-5 variant
const AI_TIMEOUT_MS = 60000; // 60 seconds per attempt

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
  const levelLabel = skillLevel <= 2 ? 'emerging' : skillLevel <= 4 ? 'developing' : 'advancing';
  
  const domainGuidelines: Record<string, string> = {
    independent_living: `
**Independent Living Domain Guidelines:**
- Focus on practical daily living skills (cooking, cleaning, personal hygiene, money management)
- Level ${skillLevel} (${levelLabel}): ${
  skillLevel <= 2 
    ? 'Break tasks into very small steps with high support. Include reminders and checklists.'
    : skillLevel <= 4
    ? 'Moderate independence with support available. Include decision-making opportunities.'
    : 'Encourage full independence with minimal supervision. Focus on problem-solving.'
}
- Safety is paramount: Always include safety checks for cooking, cleaning chemicals, money handling
- Build toward long-term independence: Each step should reduce support level over time
- Include concrete quality indicators (e.g., "food is cooked to safe temperature", "sink is free of food particles")
`,
    
    employment: `
**Employment Domain Guidelines:**
- Focus on career exploration, job readiness, workplace skills, and job retention
- Level ${skillLevel} (${levelLabel}): ${
  skillLevel <= 2
    ? 'Start with exploration and basic skills. Use role-playing and guided practice.'
    : skillLevel <= 4
    ? 'Include real-world applications like mock interviews, resume building. Practice professional communication.'
    : 'Focus on career advancement, networking, and leadership skills. Encourage independent job search.'
}
- Professional context: Use workplace-appropriate language and scenarios
- Include soft skills: Communication, time management, teamwork, problem-solving
- Progression: Exploration → Preparation → Application → Interview → Job Start → Retention
`,
    
    education: `
**Education Domain Guidelines:**
- Focus on academic skills, study habits, classroom participation, and learning strategies
- Level ${skillLevel} (${levelLabel}): ${
  skillLevel <= 2
    ? 'Focus on foundational study skills. Use visual aids and structured routines.'
    : skillLevel <= 4
    ? 'Build time management and note-taking skills. Introduce independent study strategies.'
    : 'Emphasize advanced research, critical thinking, and self-directed learning.'
}
- Academic integrity: Always emphasize honest, original work
- Include self-advocacy: Encourage asking for help, accommodations when needed
- Balance: Mix academic tasks with organizational and social-emotional learning
`,
    
    social_skills: `
**Social Skills Domain Guidelines:**
- Focus on communication, friendship, emotional regulation, and social problem-solving
- Level ${skillLevel} (${levelLabel}): ${
  skillLevel <= 2
    ? 'Start with basic greetings, turn-taking, personal space. Use scripts and role-play.'
    : skillLevel <= 4
    ? 'Practice conversation skills, reading social cues, group dynamics. Include reflection.'
    : 'Focus on complex social situations, conflict resolution, advocacy, leadership.'
}
- Neurodiversity-affirming: Respect different communication styles, avoid forcing eye contact
- Safety: Include consent, boundaries, recognizing unsafe situations
- Authenticity: Help learner develop genuine connections, not just "masking"
`,
    
    health: `
**Health Domain Guidelines:**
- Focus on physical health, mental wellness, medical self-management, healthy habits
- Level ${skillLevel} (${levelLabel}): ${
  skillLevel <= 2
    ? 'Simple daily routines: brushing teeth, taking medications with reminders, basic hygiene.'
    : skillLevel <= 4
    ? 'Build consistency in health habits. Introduce self-monitoring (sleep logs, mood tracking).'
    : 'Focus on independent health management: scheduling appointments, advocating in medical settings.'
}
- Medical safety: Always verify with healthcare providers for medication, diet, exercise changes
- Mental health: Normalize seeking support, include coping strategies
- Sustainable habits: Emphasize gradual, realistic changes over extreme goals
`,
    
    recreation_fun: `
**Recreation & Fun Domain Guidelines:**
- Focus on hobbies, leisure activities, social recreation, and personal interests
- Level ${skillLevel} (${levelLabel}): ${
  skillLevel <= 2
    ? 'Simple, structured activities with clear steps. Focus on enjoyment and engagement.'
    : skillLevel <= 4
    ? 'Balance solo and group activities. Encourage trying new things with support.'
    : 'Foster independence in planning and organizing activities. Include social leadership opportunities.'
}
- Joy-focused: This domain is about enjoyment, not just skill-building
- Inclusion: Suggest adaptive equipment or modifications if needed
- Social connection: Where appropriate, build in opportunities to share interests with others
`
  };
  
  return domainGuidelines[domain] || domainGuidelines.independent_living;
}

/**
 * Build the comprehensive system prompt for PM step generation
 */
function buildPMSystemPrompt(input: PMGoalCreationInput): string {
  const domainGuidance = getDomainGuidance(input.domain, input.skillAssessment.calculatedLevel);
  
  return `You are an expert transition skills coach specializing in Progressive Mastery for neurodivergent learners (ages 14-26). Your role is to generate personalized, theory-aligned practice steps that build independence gradually.

# CRITICAL SAFETY INSTRUCTIONS (Layer 2)

**YOU MUST REFUSE** to generate steps for goals involving:
1. Violence, self-harm, or harm to others
2. Illegal activities (drugs, theft, hacking, underage drinking/smoking, etc.)
3. Sexual content or exploitation
4. Dangerous activities without proper safety measures
5. Harassment, bullying, manipulation, or revenge
6. Content inappropriate for minors (ages 14-26)

**If you detect ANY safety concerns:**
- Return EXACTLY this JSON structure (nothing else):
  {
    "steps": [
      {
        "title": "[SAFETY_VIOLATION_SIGNAL]",
        "description": "[SAFETY_VIOLATION_SIGNAL]",
        "estimatedDuration": 0,
        "supportLevel": "high",
        "difficulty": 1,
        "weekNumber": "Week 1",
        "phase": 1
      }
    ]
  }
- DO NOT explain why or provide alternative suggestions
- DO NOT generate any steps

# GOAL CONTEXT

**Goal:** ${input.title}
**Domain:** ${input.domain}
**Duration:** ${input.duration_weeks} weeks
**Skill Level:** ${input.skillAssessment.calculatedLevel}/6 (${input.skillAssessment.levelLabel})
**Starting Frequency:** ${input.smartStart.startingFrequency}x per week
**Target Frequency:** ${input.smartStart.targetFrequency}x per week
**Ramp Period:** ${input.smartStart.rampWeeks} weeks
**Motivation:** ${input.motivation}
${input.barriers ? `**Barriers:** ${input.barriers}` : ''}
${input.prerequisites.hasEverything ? '' : `**Prerequisites Needed:** ${input.prerequisites.needs}`}
${input.teachingHelper ? `**Teaching Helper:** ${input.teachingHelper.helperName} (Support types: ${input.teachingHelper.supportTypes.join(', ')})` : '**Learning:** Independently'}

${domainGuidance}

# PROGRESSIVE MASTERY FRAMEWORK

Generate **8-12 practice steps** following this 4-phase structure:

**Phase 1 (Weeks 1-2): Foundation with High Support**
- Support Level: HIGH
- Focus: Basic skill introduction, building confidence
- Include: Safety training, tool familiarization, success criteria
- Steps should be short (5-15 min), highly structured

**Phase 2 (Weeks 3-4): Guided Practice**
- Support Level: MEDIUM-HIGH
- Focus: Repetition with decreasing prompts
- Include: Checklists, self-monitoring, problem-solving practice
- Steps should be moderate (15-30 min), some independence

**Phase 3 (Weeks 5-6): Developing Independence**
- Support Level: MEDIUM-LOW
- Focus: More complex variations, decision-making
- Include: Quality self-assessment, efficiency improvements
- Steps should be longer (30-45 min), mostly independent

**Phase 4 (Weeks 7-${input.duration_weeks}): Mastery & Generalization**
- Support Level: LOW to MINIMAL
- Focus: Full independence, adapting to new contexts
- Include: Teaching others, handling unexpected challenges
- Steps should be comprehensive (45-60 min), fully independent

# STEP QUALITY REQUIREMENTS

Each step MUST include:
1. **title**: Clear, action-oriented (10-80 chars). NO placeholders like "[Goal]" or "[Name]"
2. **description**: Detailed instructions (50-400 chars). Specific, concrete, actionable
3. **estimatedDuration**: Realistic time in minutes
4. **supportLevel**: "high" | "medium" | "low" | "minimal" | "none" (decreasing over time)
5. **difficulty**: 1-5 rating (increasing gradually)
6. **weekNumber**: "Week X" or "Week X-Y" (aligned with duration)
7. **phase**: 1, 2, 3, or 4 (matching Progressive Mastery phases)
8. **prerequisites**: Array of what must be mastered first (can be empty for Phase 1)
9. **safetyNotes**: Important safety considerations (or null if none)
10. **qualityIndicators**: 2-4 concrete signs of success
11. **independenceIndicators**: 2-3 signs learner is ready for less support
12. **practiceCount**: Recommended number of practice attempts for this step

# VALIDATION CHECKS

**Title & Description Quality:**
- NO generic placeholders ("[Name]", "[Goal]", "[Helper]")
- NO vague actions ("practice", "continue", "keep going")
- YES specific, concrete actions

**Goal Alignment:**
- At least 60% of steps MUST explicitly reference the goal: "${input.title}"
- Use goal-specific vocabulary, not generic skill-building

**Progressive Difficulty:**
- Steps get progressively harder (difficulty should increase)
- Support level should decrease over time
- Practice count should decrease as independence grows

# OUTPUT FORMAT

Return ONLY valid JSON matching this schema (no markdown, no explanation):

{
  "steps": [
    {
      "title": "Start with the activation cue",
      "description": "When [trigger], I will [first concrete action]. Use a timer and checklist.",
      "estimatedDuration": 15,
      "supportLevel": "high",
      "difficulty": 1,
      "weekNumber": "Week 1",
      "phase": 1,
      "prerequisites": [],
      "safetyNotes": "Ask for help if you feel unsafe or unsure",
      "qualityIndicators": ["Completes without assistance", "Follows all safety rules"],
      "independenceIndicators": ["Asks clarifying questions", "Refers to checklist without prompting"],
      "practiceCount": 5
    }
  ]
}

**Remember:** If ANY safety concerns arise, return the SAFETY_VIOLATION_SIGNAL structure instead.`;
}

/**
 * Validate generated steps for basic format compliance
 */
function validateBasicFormat(steps: GeneratedStep[], input: PMGoalCreationInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (steps.length < 8 || steps.length > 12) {
    errors.push(`Expected 8-12 steps, got ${steps.length}`);
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
 * Call OpenAI API to generate PM steps with retry logic
 */
async function callAIWithRetry(
  payload: PMGoalCreationInput,
  retryGuidance: string = ''
): Promise<GeneratedStep[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  
  const systemPrompt = buildPMSystemPrompt(payload);
  
  const userPrompt = retryGuidance 
    ? `${retryGuidance}\n\nNow generate the steps following all requirements.`
    : `Generate ${payload.duration_weeks > 8 ? '10-12' : '8-10'} Progressive Mastery steps for this goal.`;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    console.log(`🔄 Generation attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}`);
    const attemptStart = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
      
      console.log('📤 Calling OpenAI API...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 4000
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const attemptDuration = Date.now() - attemptStart;
      console.log(`⏱️ Attempt ${attempt} took ${attemptDuration}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API error:', response.status, errorText);
        
        // Handle specific error codes
        if (response.status === 429) {
          lastError = new Error('OpenAI rate limit exceeded. Please try again in a moment.');
          if (attempt < MAX_GENERATION_ATTEMPTS) {
            const backoffDelay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
            console.log(`⏳ Backing off ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          }
        } else if (response.status === 401) {
          throw new Error('OpenAI API key invalid or expired. Please check your OPENAI_API_KEY.');
        } else if (response.status === 408 || response.status === 504) {
          // Timeout/gateway timeout - retry
          lastError = new Error(`Request timeout (${response.status})`);
          if (attempt < MAX_GENERATION_ATTEMPTS) {
            const backoffDelay = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ Backing off ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          }
        } else if (response.status >= 500) {
          // Server error - retry
          lastError = new Error(`OpenAI service error (${response.status})`);
          if (attempt < MAX_GENERATION_ATTEMPTS) {
            const backoffDelay = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ Backing off ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          }
        }
        
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('OpenAI returned empty response');
      }
      
      console.log('📥 OpenAI response received, parsing JSON...');
      const parsed: GenerationResponse = JSON.parse(content);
      
      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        throw new Error('OpenAI response missing "steps" array');
      }
      
      console.log(`✅ Successfully generated ${parsed.steps.length} steps on attempt ${attempt}`);
      return parsed.steps;
      
    } catch (error: any) {
      const attemptDuration = Date.now() - attemptStart;
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.error(`❌ Attempt ${attempt} timed out after ${attemptDuration}ms`);
        lastError = new Error(`Request timed out after ${AI_TIMEOUT_MS / 1000}s`);
      } else if (error.message?.includes('API key') || error.message?.includes('Rate limit')) {
        // Don't retry auth/rate limit errors
        throw error;
      } else {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        lastError = error;
      }
      
      // Exponential backoff for retries
      if (attempt < MAX_GENERATION_ATTEMPTS) {
        const backoffDelay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Backing off ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  // All attempts failed
  console.error(`❌ All ${MAX_GENERATION_ATTEMPTS} generation attempts failed`);
  throw lastError || new Error('Step generation failed after all retries');
}

/**
 * Fallback to Lovable AI Gateway if OpenAI fails
 * Uses Google Gemini 2.5 Flash model for step generation
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
    : `Generate ${payload.duration_weeks > 8 ? '10-12' : '8-10'} Progressive Mastery steps for this goal.`;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    console.log(`🔄 Lovable AI fallback attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}`);
    const attemptStart = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
      
      console.log('📤 Calling Lovable AI Gateway (fallback)...');
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
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
          if (attempt < MAX_GENERATION_ATTEMPTS) {
            const backoffDelay = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ Backing off ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          }
        }
        
        throw new Error(`Lovable AI error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Lovable AI returned empty response');
      }
      
      console.log('📥 Lovable AI response received, parsing JSON...');
      const parsed: GenerationResponse = JSON.parse(content);
      
      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        throw new Error('Lovable AI response missing "steps" array');
      }
      
      console.log(`✅ Lovable AI fallback generated ${parsed.steps.length} steps on attempt ${attempt}`);
      return parsed.steps;
      
    } catch (error: any) {
      const attemptDuration = Date.now() - attemptStart;
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.error(`❌ Lovable AI attempt ${attempt} timed out after ${attemptDuration}ms`);
        lastError = new Error(`Lovable AI timed out after ${AI_TIMEOUT_MS / 1000}s`);
      } else {
        console.error(`❌ Lovable AI attempt ${attempt} failed:`, error.message);
        lastError = error;
      }
      
      if (attempt < MAX_GENERATION_ATTEMPTS) {
        const backoffDelay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Backing off ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  console.error(`❌ All ${MAX_GENERATION_ATTEMPTS} Lovable AI attempts failed`);
  throw lastError || new Error('Lovable AI fallback failed after all retries');
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

      // 8. Generate steps using OpenAI API with Lovable AI fallback
      console.log('🤖 Starting AI step generation with Layer 2 safety...');
      const generationStart = Date.now();

      let generatedSteps: GeneratedStep[] | null = null;
      
      try {
        console.log('🤖 Attempting OpenAI generation (primary)...');
        const rawSteps = await callAIWithRetry(payload);
        
        // Check for Layer 2 safety signal
        if (containsSafetySignal(rawSteps)) {
          console.error('⚠️ Layer 2 safety violation detected in generated steps');
          return await handleLayer2Violation(supabase, userId, payload, JSON.stringify(rawSteps));
        }
        
        // Validate step format
        const validation = validateBasicFormat(rawSteps, payload);
        
        if (validation.valid) {
          console.log(`✅ OpenAI validation passed - generated ${rawSteps.length} steps`);
          generatedSteps = rawSteps;
        } else {
          console.error(`❌ OpenAI validation failed:`, validation.errors);
          console.warn('⚠️ Returning steps despite validation errors to avoid blocking user');
          generatedSteps = rawSteps; // Allow through with warnings
        }
      } catch (openaiError: any) {
        console.warn('⚠️ OpenAI failed, trying Lovable AI Gateway fallback...', openaiError.message);
        
        try {
          const rawSteps = await callLovableAIWithRetry(payload);
          
          // Check for Layer 2 safety signal
          if (containsSafetySignal(rawSteps)) {
            console.error('⚠️ Layer 2 safety violation detected in Lovable AI steps');
            return await handleLayer2Violation(supabase, userId, payload, JSON.stringify(rawSteps));
          }
          
          // Validate step format
          const validation = validateBasicFormat(rawSteps, payload);
          
          if (validation.valid) {
            console.log(`✅ Lovable AI validation passed - generated ${rawSteps.length} steps`);
            generatedSteps = rawSteps;
          } else {
            console.warn('⚠️ Lovable AI validation warnings:', validation.errors);
            generatedSteps = rawSteps; // Allow through with warnings
          }
          
        } catch (lovableError: any) {
          console.error('❌ Both OpenAI and Lovable AI failed:', {
            openai: openaiError.message,
            lovable: lovableError.message
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

      const generationDuration = Date.now() - generationStart;
      console.log(`⏱️ Total generation time: ${generationDuration}ms`);

      // 9. Prepare final response with metadata
      const response = {
        steps: generatedSteps,
        metadata: {
          modelUsed: AI_MODEL,
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
