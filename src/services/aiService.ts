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
}