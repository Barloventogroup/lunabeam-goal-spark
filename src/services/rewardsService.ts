import { supabase } from "@/integrations/supabase/client";

export interface Reward {
  id: string;
  owner_id: string;
  name: string;
  category: 'small' | 'medium' | 'big';
  point_cost: number;
  description?: string;
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Redemption {
  id: string;
  reward_id: string;
  user_id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'fulfilled' | 'denied';
  approved_at?: string;
  approved_by?: string;
  fulfilled_at?: string;
  notes?: string;
  reward?: Reward;
}

// Suggested point ranges
export const REWARD_CATEGORIES = {
  small: { min: 50, max: 150, label: "Small Treat", examples: "ice cream, McDonald's trip, 30m extra screen time" },
  medium: { min: 200, max: 500, label: "Medium Reward", examples: "movie night, dinner out, new book/accessory" },
  big: { min: 800, max: 1500, label: "Big Reward", examples: "new game, special outing, small tech/clothing item" }
} as const;

export const ABSOLUTE_BOUNDS = { min: 10, max: 10000 };

export const rewardsService = {
  // Get all rewards (users see only active ones)
  async getRewards(options?: { activeOnly?: boolean; ownerOnly?: boolean }): Promise<Reward[]> {
    const { activeOnly = false, ownerOnly = false } = options || {};
    let query = (supabase as any).from('rewards').select('*').order('created_at', { ascending: false });
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (ownerOnly) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error('Not authenticated');
      query = query.eq('owner_id', userData.user.id);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Create reward (supporter only)
  async createReward(reward: Omit<Reward, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Promise<Reward> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data, error } = await (supabase as any)
      .from('rewards')
      .insert({
        ...reward,
        owner_id: user.data.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update reward (supporter only)
  async updateReward(id: string, updates: Partial<Reward>): Promise<Reward> {
    const { data, error } = await (supabase as any)
      .from('rewards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Archive/unarchive reward
  async toggleRewardActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await (supabase as any)
      .from('rewards')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  },

  // Request redemption (user only)
  async requestRedemption(rewardId: string): Promise<Redemption> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    // Check if user has enough points
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', user.data.user.id);

    const totalPoints = pointsData?.reduce((sum, p) => sum + p.total_points, 0) || 0;

    // Get reward cost
    const { data: reward } = await (supabase as any)
      .from('rewards')
      .select('point_cost')
      .eq('id', rewardId)
      .single();

    if (!reward) throw new Error('Reward not found');
    if (totalPoints < reward.point_cost) throw new Error('Insufficient points');

    const { data, error } = await (supabase as any)
      .from('redemptions')
      .insert({
        reward_id: rewardId,
        user_id: user.data.user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get redemptions (with reward info)
  async getRedemptions(userId?: string): Promise<Redemption[]> {
    let query = (supabase as any)
      .from('redemptions')
      .select(`
        *,
        reward:rewards(*)
      `)
      .order('requested_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Approve redemption (supporter only)
  async approveRedemption(redemptionId: string): Promise<void> {
    const { error } = await (supabase as any).rpc('process_redemption_approval', {
      p_redemption_id: redemptionId
    });

    if (error) throw error;
  },

  // Deny redemption (supporter only)
  async denyRedemption(redemptionId: string, notes?: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { error } = await (supabase as any)
      .from('redemptions')
      .update({
        status: 'denied',
        approved_by: user.data.user.id,
        approved_at: new Date().toISOString(),
        notes
      })
      .eq('id', redemptionId);

    if (error) throw error;
  },

  // Mark as fulfilled (supporter only)
  async fulfillRedemption(redemptionId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('redemptions')
      .update({
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      })
      .eq('id', redemptionId);

    if (error) throw error;
  },

  // Check if cost is within suggested range
  isWithinSuggestedRange(category: keyof typeof REWARD_CATEGORIES, cost: number): boolean {
    const range = REWARD_CATEGORIES[category];
    return cost >= range.min && cost <= range.max;
  },

  // Get suggestion warning text
  getSuggestionWarning(category: keyof typeof REWARD_CATEGORIES, cost: number): string | null {
    if (this.isWithinSuggestedRange(category, cost)) return null;
    const range = REWARD_CATEGORIES[category];
    return `Heads up: most families set this between ${range.min}–${range.max} pts. Your call!`;
  }
};