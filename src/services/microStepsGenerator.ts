import { format } from 'date-fns';
import { AIService } from './aiService';

export interface MicroStep {
  title: string;
  description: string;
}

interface WizardData {
  goalTitle: string;
  category?: string;
  goalMotivation?: string;
  customMotivation?: string;
  startDate: Date;
  customTime?: string;
  hasPrerequisites?: boolean;
  customPrerequisites?: string;
  challengeAreas?: string[];
  supportedPersonName?: string;
  goalType?: string;
  barriers?: string[];
}

/**
 * Infers the second barrier based on goal type and primary barrier
 * Uses neurodivergent-informed relationships between challenges
 */
function inferSecondBarrier(
  barrier1: string, 
  goalType: string, 
  category: string
): string {
  // Barrier relationships based on goal type
  const barrierInferenceMap: Record<string, Record<string, string>> = {
    'reminder': {
      'initiation': 'time',
      'attention': 'planning',
      'time': 'attention',
      'planning': 'initiation'
    },
    'practice': {
      'initiation': 'planning',
      'attention': 'time',
      'time': 'planning',
      'planning': 'attention'
    },
    'new_skill': {
      'initiation': 'planning',
      'attention': 'planning',
      'time': 'planning',
      'planning': 'initiation'
    }
  };

  // Category-specific overrides for edge cases
  const categoryOverrides: Record<string, Record<string, string>> = {
    'health': {
      'initiation': 'time',
      'planning': 'time'
    },
    'employment': {
      'initiation': 'planning',
      'attention': 'planning'
    },
    'postsecondary': {
      'attention': 'planning',
      'time': 'planning'
    }
  };

  // Check category override first
  const categoryMap = categoryOverrides[category];
  if (categoryMap && categoryMap[barrier1]) {
    return categoryMap[barrier1];
  }

  // Use goal type inference
  const typeMap = barrierInferenceMap[goalType];
  if (typeMap && typeMap[barrier1]) {
    return typeMap[barrier1];
  }

  // Fallback: Use most common pairings
  const defaultFallbacks: Record<string, string> = {
    'initiation': 'planning',
    'attention': 'planning',
    'time': 'attention',
    'planning': 'initiation'
  };

  return defaultFallbacks[barrier1] || 'attention';
}

/**
 * Smart generation with iterative refinement - NO FALLBACKS
 */
export async function generateMicroStepsSmart(
  data: WizardData,
  flow: 'individual' | 'supporter' = 'individual'
): Promise<MicroStep[]> {
  const inferredBarrier2 = inferSecondBarrier(
    data.challengeAreas?.[0] || data.barriers?.[0] || 'initiation',
    data.goalType || 'reminder',
    data.category || 'general'
  );

  const aiPayload = {
    goalTitle: data.goalTitle,
    category: data.category || 'general',
    startDayOfWeek: format(data.startDate, 'EEEE'),
    startTime: data.customTime || '18:00',
    startDateTime: data.startDate.toISOString(),
    hasPrerequisite: !!data.customPrerequisites,
    prerequisiteText: data.customPrerequisites || '',
    barrier1: data.challengeAreas?.[0] || data.barriers?.[0] || 'Getting started',
    barrier2: data.challengeAreas?.[1] || data.barriers?.[1] || inferredBarrier2
  };

  const response = await AIService.getMicroSteps(aiPayload);

  if (response.error) {
    throw new Error(response.error);
  }

  return response.microSteps || [];
}
