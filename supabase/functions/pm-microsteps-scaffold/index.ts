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
  violation_layer: 'layer_1_keywords' | 'layer_2_generation' | 'layer_3_judge';
  goal_title: string;
  goal_category?: string;
  motivation?: string;
  barriers?: string;
  triggered_keywords?: string[];
  violation_reason: string;
  user_email?: string;
  user_age?: number;
  skill_level?: number;
  is_self_registered?: boolean;
}

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

// Layer 1 Safety Check Function
function checkLayer1Safety(payload: PMGoalCreationInput): string[] | null {
  const titleLower = payload.title.toLowerCase();
  const motivationLower = (payload.motivation || '').toLowerCase();
  const barriersLower = (payload.barriers || '').toLowerCase();
  const prerequisitesLower = (payload.prerequisites?.needs || '').toLowerCase();
  
  const combinedInput = `${titleLower} ${motivationLower} ${barriersLower} ${prerequisitesLower}`;
  
  const triggeredKeywords = dangerousKeywords.filter(keyword =>
    combinedInput.includes(keyword.toLowerCase())
  );
  
  return triggeredKeywords.length > 0 ? triggeredKeywords : null;
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
      if (typeof payload.title !== 'string' || payload.title.length < 10 || payload.title.length > 100) {
        console.error('❌ Invalid title:', payload.title);
        return new Response(
          JSON.stringify({ 
            error: 'Goal title must be between 10 and 100 characters',
            code: 'INVALID_TITLE'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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

      // 7. LAYER 1: Fast keyword safety check
      console.log('🔍 Running Layer 1 safety check...');
      const safetyCheckStart = Date.now();
      
      const triggeredKeywords = checkLayer1Safety(payload);
      console.log(`⏱️ Safety check took ${Date.now() - safetyCheckStart}ms`);

      if (triggeredKeywords) {
        console.error('⚠️ LAYER 1 SAFETY VIOLATION detected:', triggeredKeywords);

        // Get user profile for logging
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, is_self_registered')
          .eq('user_id', userId)
          .single();

        // Log to safety_violations_log
        const violationLog: SafetyViolationLog = {
          user_id: userId,
          violation_layer: 'layer_1_keywords',
          goal_title: payload.title,
          goal_category: payload.domain,
          motivation: payload.motivation,
          barriers: payload.barriers,
          triggered_keywords: triggeredKeywords,
          violation_reason: `Explicit dangerous keywords detected: ${triggeredKeywords.join(', ')}`,
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
          triggeredKeywords
        ).catch(err => console.error('Notification error:', err));

        // Return error to user immediately
        return new Response(
          JSON.stringify({
            error: "I'm sorry, I cannot process that request. Please try rephrasing your goal, focusing on positive, legal, and healthy outcomes.",
            code: 'SAFETY_VIOLATION',
            safety_violation: true,
            no_retry: true
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Layer 1 safety check passed');

      // 8. Placeholder response (OpenAI generation will be added in Phase 3)
      const response = {
        message: "Layer 1 safety passed - OpenAI generation coming in Phase 3",
        status: "safety_validated",
        input: {
          goalId: payload.goalId,
          title: payload.title,
          domain: payload.domain,
          skillLevel: payload.skillAssessment.calculatedLevel,
          levelLabel: payload.skillAssessment.levelLabel,
          startingFrequency: payload.smartStart.startingFrequency,
          targetFrequency: payload.smartStart.targetFrequency,
          rampWeeks: payload.smartStart.rampWeeks,
          motivation: payload.motivation,
          barriers: payload.barriers,
          prerequisites: payload.prerequisites,
          teachingHelper: payload.teachingHelper
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
