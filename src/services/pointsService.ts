import { supabase } from '@/integrations/supabase/client';

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

export const pointsService = {
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

    const totalPoints = categoryBreakdown.reduce((sum, cat) => sum + cat.points, 0);

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

  // Calculate what points a step would earn (for preview)
  calculateStepPoints(goalDomain: string, stepTitle: string, stepNotes: string = ''): number {
    const category = this.mapDomainToCategory(goalDomain);
    const titleLower = stepTitle.toLowerCase();
    const notesLower = stepNotes.toLowerCase();
    const combinedText = `${titleLower} ${notesLower}`;

    let points = 5; // Default points

    switch (category) {
      case 'independent_living':
        if (/(?:daily|chore|hygiene|clean|brush|shower|bath|wash)/.test(combinedText)) {
          points = 5;
        } else if (/(?:safety|cook|money|budget|finance|bank|shop|grocery)/.test(combinedText)) {
          points = 10;
        } else if (/(?:travel|alone|independent|weekly budget|milestone|major)/.test(combinedText)) {
          points = 20;
        }
        break;

      case 'education':
        if (/(?:homework|study|class|participation|complete|assignment)/.test(combinedText)) {
          points = 5;
        } else if (/(?:project|test prep|group work|finish|research)/.test(combinedText)) {
          points = 10;
        } else if (/(?:exam|pass|term|present|milestone|graduate)/.test(combinedText)) {
          points = 20;
        }
        break;

      case 'postsecondary':
        if (/(?:study|homework|practice|quiz|session)/.test(combinedText)) {
          points = 5;
        } else if (/(?:campus|visit|group project|test prep)/.test(combinedText)) {
          points = 15;
        } else if (/(?:application|submit|certificate|earn)/.test(combinedText)) {
          points = 25;
        }
        break;

      case 'recreation_fun':
        if (/(?:solo|hobby|art|game|draw|paint|music)/.test(combinedText)) {
          points = 5;
        } else if (/(?:group|friend|invite|social|recreation)/.test(combinedText)) {
          points = 10;
        } else if (/(?:lead|leading|organize|4-week|streak|event)/.test(combinedText)) {
          points = 20;
        }
        break;

      case 'social_skills':
        if (/(?:greet|introduction|role-play|hello|short)/.test(combinedText)) {
          points = 5;
        } else if (/(?:group conversation|join|activity|participate)/.test(combinedText)) {
          points = 15;
        } else if (/(?:lead|leading|presentation|present|10.*interaction)/.test(combinedText)) {
          points = 25;
        }
        break;

      case 'employment':
        if (/(?:career|interest|assessment|resume|draft)/.test(combinedText)) {
          points = 5;
        } else if (/(?:job shadow|mock interview|volunteer)/.test(combinedText)) {
          points = 15;
        } else if (/(?:job application|interview|workday|first day)/.test(combinedText)) {
          points = 30;
        }
        break;

      case 'self_advocacy':
        if (/(?:ask|help|choice|decide|making choice)/.test(combinedText)) {
          points = 5;
        } else if (/(?:meeting|planning|participate|disclosure|practice)/.test(combinedText)) {
          points = 15;
        } else if (/(?:lead meeting|advocacy|independent|community)/.test(combinedText)) {
          points = 30;
        }
        break;

      case 'health':
        if (/(?:log|exercise|meal|sleep|mindfulness|track)/.test(combinedText)) {
          points = 5;
        } else if (/(?:therapy|wellness|group|counseling|attend)/.test(combinedText)) {
          points = 10;
        } else if (/(?:30-day|streak|medical plan|maintain)/.test(combinedText)) {
          points = 20;
        }
        break;
    }

    return points;
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