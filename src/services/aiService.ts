import { supabase } from '../integrations/supabase/client';

export interface OnboardingGuidanceRequest {
  userProfile?: {
    interests?: string[];
    strengths?: string[];
    challenges?: string[];
  };
  currentGoals?: any[];
  step: 'goal_suggestion' | 'goal_refinement' | 'support_planning';
}

export interface ReflectionAnalysisRequest {
  reflection: string;
  goalContext?: {
    title: string;
    id: string;
  };
  checkInData?: {
    count_of_attempts?: number;
    minutes_spent?: number;
    confidence_1_5?: number;
  };
  analysisType?: 'encouragement' | 'pattern_analysis' | 'next_steps';
}

export interface CoachingRequest {
  question: string;
  mode?: 'onboarding' | 'goal_setting' | 'assist';
  userSnapshot?: {
    preferred_name?: string;
    strengths?: string[];
    interests?: string[];
    challenges?: string[];
    supports_opted_in?: string[];
    language_preference?: any;
  };
  currentGoals?: any[];
  recentCheckIns?: any[];
  context?: string;
}

export interface MicroStepsRequest {
  flow: 'individual' | 'supporter';
  goalTitle: string;
  category: string;
  motivation: string;
  startDayOfWeek: string;
  startTime: string;
  startDateTime: string;
  hasPrerequisite: boolean;
  prerequisiteText: string;
  prerequisiteIsConcrete: boolean;
  barrier1: string;
  barrier2: string;
  supportedPersonName?: string;
}

export interface MicroStep {
  title: string;
  description: string;
}

export class AIService {
  static async getOnboardingGuidance(request: OnboardingGuidanceRequest) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-onboarding-guide', {
        body: request
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting onboarding guidance:', error);
      throw new Error('Failed to get AI guidance. Please try again.');
    }
  }

  static async analyzeReflection(request: ReflectionAnalysisRequest) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-reflection-analysis', {
        body: request
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error analyzing reflection:', error);
      throw new Error('Failed to analyze reflection. Please try again.');
    }
  }

  static async getCoachingGuidance(request: CoachingRequest) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: request
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting coaching guidance:', error);
      throw new Error('Failed to get coaching guidance. Please try again.');
    }
  }

  static async getMicroSteps(request: any): Promise<{ microSteps?: MicroStep[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('individual-microsteps', {
        body: request
      });

      if (error) {
        console.error('Individual microsteps generation error:', error);
        return { error: error.message };
      }

      return { microSteps: data.microSteps };
    } catch (err) {
      console.error('Unexpected error calling individual-microsteps:', err);
      return { error: 'Failed to generate micro-steps' };
    }
  }

  static async getSupporterSetupSteps(request: any): Promise<{ steps?: MicroStep[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('supporter-setup-steps', {
        body: request
      });

      if (error) {
        console.error('Supporter setup steps generation error:', error);
        return { error: error.message };
      }

      return { steps: data.steps };
    } catch (err) {
      console.error('Unexpected error calling supporter-setup-steps:', err);
      return { error: 'Failed to generate supporter setup steps' };
    }
  }
}