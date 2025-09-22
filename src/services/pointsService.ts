import { supabase } from '@/integrations/supabase/client';
import { Substep, PointsLogEntry } from '@/types';

export interface UserPoints {
  id: string;
  user_id: string;
  category: string;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryPoints {
  category: string;
  points: number;
  displayName: string;
  emoji: string;
}

export interface PointsSummary {
  totalPoints: number;
  categoryBreakdown: CategoryPoints[];
}

const CATEGORY_CONFIG = {
  independent_living: { displayName: 'Independent Living', emoji: '🏠' },
  education: { displayName: 'Education', emoji: '📘' },
  postsecondary: { displayName: 'Postsecondary', emoji: '🎓' },
  recreation_fun: { displayName: 'Recreation / Fun', emoji: '🎉' },
  social_skills: { displayName: 'Social Skills', emoji: '🗣️' },
  employment: { displayName: 'Employment', emoji: '💼' },
  self_advocacy: { displayName: 'Self-Advocacy', emoji: '🧑‍🤝‍🧑' },
  health: { displayName: 'Health', emoji: '❤️' },
  general: { displayName: 'General', emoji: '⭐' }
};

// Step type mappings for each category
const STEP_TYPE_CONFIGS = {
  education: {
    habit: 5, action: 5, milestone: 20, scaffolding: 2,
    goal_completion_bonus: 10
  },
  independent_living: {
    habit: 5, self_check: 5, practice: 10, skill: 10, safety: 10, money: 10,
    milestone: 20, independent: 20, scaffolding: 2,
    goal_completion_bonus: 15
  },
  postsecondary: {
    exploration: 5, preparation: 15, milestone: 25, high_stakes: 25,
    scaffolding: 2, goal_completion_bonus: 20
  },
  recreation_fun: {
    solo: 5, group: 10, milestone: 20, leadership: 20, streak: 20,
    scaffolding: 2, goal_completion_bonus: 10
  },
  social_skills: {
    basic: 5, applied: 15, milestone: 25, leadership: 25, advanced: 25,
    scaffolding: 2, goal_completion_bonus: 20
  },
  employment: {
    exploration: 5, prep: 5, experience: 15, milestone: 30, high_stakes: 30,
    scaffolding: 2, goal_completion_bonus: 25
  },
  self_advocacy: {
    basic: 5, applied: 15, milestone: 30, leadership: 30,
    scaffolding: 2, goal_completion_bonus: 20
  },
  health: {
    habit: 5, log: 5, supported: 10, milestone: 20, streak: 20,
    scaffolding: 2, goal_completion_bonus: 15
  },
  general: {
    habit: 5, action: 5, milestone: 10, scaffolding: 2,
    goal_completion_bonus: 10
  }
};

export const pointsService = {
  // Calculate Total Possible Points for a goal
  async calculateTotalPossiblePoints(
    category: string,
    frequencyPerWeek: number,
    durationWeeks: number,
    plannedMilestonesCount: number = 0,
    plannedScaffoldCount: number = 0,
    stepType: string = 'habit'
  ): Promise<number> {
    const { data, error } = await supabase
      .rpc('calculate_total_possible_points', {
        p_category: category,
        p_frequency_per_week: frequencyPerWeek,
        p_duration_weeks: durationWeeks,
        p_planned_milestones_count: plannedMilestonesCount,
        p_planned_scaffold_count: plannedScaffoldCount,
        p_step_type: stepType
      });

    if (error) throw error;
    return data || 0;
  },

  // Get all points for the current user
  async getUserPoints(): Promise<UserPoints[]> {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .order('category');

    if (error) throw error;
    return data || [];
  },

  // Get points summary with category breakdown
  async getPointsSummary(): Promise<PointsSummary> {
    const userPoints = await this.getUserPoints();
    
    const categoryBreakdown: CategoryPoints[] = Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
      const pointsRecord = userPoints.find(p => p.category === category);
      return {
        category,
        points: pointsRecord?.total_points || 0,
        displayName: config.displayName,
        emoji: config.emoji
      };
    });

    // Net available points should include ALL categories (including negatives like redemptions)
    const totalPoints = userPoints.reduce((sum, p) => sum + p.total_points, 0);

    return {
      totalPoints,
      categoryBreakdown: categoryBreakdown.filter(cat => cat.points > 0)
    };
  },

  // Get points for a specific category
  async getCategoryPoints(category: string): Promise<number> {
    const { data, error } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('category', category)
      .maybeSingle();

    if (error) throw error;
    return data?.total_points || 0;
  },

  // Get points log for a user
  async getPointsLog(userId?: string): Promise<PointsLogEntry[]> {
    const query = supabase
      .from('points_log')
      .select('*')
      .order('awarded_at', { ascending: false });

    if (userId) {
      query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Substeps management
  async getSubsteps(stepId: string): Promise<Substep[]> {
    const { data, error } = await supabase
      .from('substeps')
      .select('*')
      .eq('step_id', stepId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  async createSubstep(stepId: string, title: string, description?: string, isPlanned: boolean = false): Promise<Substep> {
    const { data, error } = await supabase
      .from('substeps')
      .insert({
        step_id: stepId,
        title,
        description,
        is_planned: isPlanned
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async checkInSubstep(substepId: string): Promise<void> {
    const { error } = await supabase
      .from('substeps')
      .update({ initiated_at: new Date().toISOString() })
      .eq('id', substepId);

    if (error) throw error;
  },

  async completeSubstep(substepId: string): Promise<Substep> {
    const { data, error } = await supabase
      .from('substeps')
      .update({ 
        completed_at: new Date().toISOString(),
        points_awarded: 2 // Scaffolding substeps always worth 2 points
      })
      .eq('id', substepId)
      .select()
      .single();

    if (error) throw error;

    // Award points and log (done via trigger)
    return data;
  },

  async deleteSubstep(substepId: string): Promise<void> {
    const { error } = await supabase
      .from('substeps')
      .delete()
      .eq('id', substepId);

    if (error) throw error;
  },

  // Calculate what points a step would earn (for preview)
  calculateStepPoints(goalDomain: string, stepType: string = 'habit', stepTitle: string = '', stepNotes: string = ''): number {
    const category = this.mapDomainToCategory(goalDomain);
    const config = STEP_TYPE_CONFIGS[category] || STEP_TYPE_CONFIGS.general;
    
    // Try to get specific step type points, fall back to habit/action
    return config[stepType] || config.habit || config.action || 5;
  },

  // Get goal completion bonus for a category
  getGoalCompletionBonus(category: string): number {
    const config = STEP_TYPE_CONFIGS[category] || STEP_TYPE_CONFIGS.general;
    return config.goal_completion_bonus || 10;
  },

  // Parse goal parameters for TPP calculation
  parseGoalForTPP(goalTitle: string, goalDescription: string = ''): {
    frequencyPerWeek: number;
    durationWeeks: number;
    stepType: string;
    milestonesCount: number;
  } {
    const text = (goalTitle + ' ' + goalDescription).toLowerCase();
    
    // Extract frequency (times per week)
    let frequencyPerWeek = 1; // default
    const freqMatch = text.match(/(\d+)\s*(?:x|times?)\s*(?:per\s+)?week/i);
    if (freqMatch) {
      frequencyPerWeek = parseInt(freqMatch[1], 10);
    }

    // Extract duration (in weeks)
    let durationWeeks = 4; // default
    const weekMatch = text.match(/(?:for\s+)?(\d+)\s*weeks?/i);
    if (weekMatch) {
      durationWeeks = parseInt(weekMatch[1], 10);
    }

    // Determine primary step type based on content
    let stepType = 'habit';
    if (text.includes('application') || text.includes('interview') || text.includes('submit')) {
      stepType = 'milestone';
    } else if (text.includes('practice') || text.includes('prep') || text.includes('visit')) {
      stepType = 'preparation';
    }

    // Count milestones
    let milestonesCount = 0;
    if (text.includes('application') || text.includes('certificate') || text.includes('graduate')) {
      milestonesCount = 1;
    }

    return { frequencyPerWeek, durationWeeks, stepType, milestonesCount };
  },

  // Map goal domain to category
  mapDomainToCategory(domain: string): string {
    const mapping: Record<string, string> = {
      'independent-living': 'independent_living',
      'education': 'education',
      'postsecondary': 'postsecondary',
      'recreation': 'recreation_fun',
      'social': 'social_skills',
      'employment': 'employment',
      'self-advocacy': 'self_advocacy',
      'health': 'health'
    };
    return mapping[domain] || 'general';
  },

  // Get category display info
  getCategoryInfo(category: string) {
    return CATEGORY_CONFIG[category] || { displayName: 'Unknown', emoji: '❓' };
  }
};