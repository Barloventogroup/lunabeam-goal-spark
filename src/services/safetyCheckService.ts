import { supabase } from '@/integrations/supabase/client';

export interface SafetyCheckResult {
  safe: boolean;
  errors: string[];
  warnings: string[];
  triggeredKeywords?: string[];
  triggeredEmojis?: string[];
}

export interface WizardData {
  goalTitle: string;
  startDate: Date;
  endDate?: Date;
  goalMotivation?: string;
  customMotivation?: string;
  customChallenges?: string;
  frequency?: number;
  goalType?: string;
  category?: string;
  [key: string]: any;
}

/**
 * Performs comprehensive safety checks on goal data before creation
 * Layer 1: Keywords and emojis (client-side validation)
 */
export async function performSafetyCheck(wizardData: WizardData): Promise<SafetyCheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Validate required fields
  if (!wizardData.goalTitle?.trim()) {
    errors.push('Goal title is required');
  }
  
  if (!wizardData.startDate) {
    errors.push('Start date is required');
  }
  
  // 2. Layer 1 keyword/emoji check (dangerous content)
  const dangerousKeywords = [
    'kill', 'suicide', 'self-harm', 'self harm', 'cut myself', 'hurt myself',
    'trafficking', 'illegal', 'steal', 'theft', 'fraud', 'scam',
    'cocaine', 'heroin', 'meth', 'methamphetamine', 'weed', 'marijuana',
    'sell drugs', 'buy drugs', 'drug deal', 'black market',
    'hack', 'bypass security', 'break into', 'weapon', 'bomb', 'gun',
    'sexually explicit', 'porn', 'xxx', 'sex tape',
    'revenge', 'harm someone', 'hurt someone', 'get back at'
  ];
  
  const dangerousEmojis = [
    '🔫', '🔪', '💣', '🗡️', '⚔️', '🧨', '💊', '💉', '🚬', '🍃', '🌿', '💥'
  ];
  
  // Only check the raw goal title
  const titleOnly = (wizardData.goalTitle || '').toLowerCase();
  
  // Use word boundary regex to match whole words only
  const triggeredKeywords = dangerousKeywords.filter(kw => {
    const wordBoundaryRegex = new RegExp(`\\b${kw}\\b`, 'i');
    return wordBoundaryRegex.test(titleOnly);
  });
  
  const triggeredEmojis = dangerousEmojis.filter(emoji => titleOnly.includes(emoji));
  
  if (triggeredKeywords.length > 0 || triggeredEmojis.length > 0) {
    errors.push("I'm sorry, I cannot process that request. Please try rephrasing your goal, focusing on positive, legal, and healthy outcomes.");
    
    // Log violation to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('safety_violations_log').insert({
          user_id: user.id,
          violation_layer: 'layer_1_keywords_goal_creation',
          goal_title: wizardData.goalTitle,
          goal_category: wizardData.category,
          triggered_keywords: [...triggeredKeywords, ...triggeredEmojis],
          violation_reason: `Goal creation blocked: ${[...triggeredKeywords, ...triggeredEmojis].join(', ')}`
        });
        
        // Notify via email
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'safety_violation',
            userId: user.id,
            goalTitle: wizardData.goalTitle,
            layer: 'layer_1_keywords_goal_creation',
            triggeredKeywords: [...triggeredKeywords, ...triggeredEmojis]
          }
        }).catch(err => console.error('Failed to send safety violation email:', err));
      }
    } catch (logError) {
      console.error('Failed to log safety violation:', logError);
    }
    
    return {
      safe: false,
      errors,
      warnings,
      triggeredKeywords,
      triggeredEmojis
    };
  }
  
  return {
    safe: errors.length === 0,
    errors,
    warnings
  };
}
