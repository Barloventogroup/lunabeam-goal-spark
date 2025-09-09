import { supabase } from '@/integrations/supabase/client';
import { GoalDomain } from '@/types';

/**
 * Map goal titles to their correct domains based on our hardcoded categories
 */
const getCorrectDomainForGoal = (title: string): GoalDomain => {
  const titleLower = title.toLowerCase();
  
  // Health & Well Being goals
  if (titleLower.includes('walk') || titleLower.includes('stretch') || 
      titleLower.includes('sleep') || titleLower.includes('eat') || 
      titleLower.includes('drink') || titleLower.includes('water')) {
    return 'health';
  }
  
  // Education goals
  if (titleLower.includes('read') || titleLower.includes('write') || 
      titleLower.includes('plan') || titleLower.includes('study') || 
      titleLower.includes('review') || titleLower.includes('solve')) {
    return 'school';
  }
  
  // Employment goals
  if (titleLower.includes('interview') || titleLower.includes('resume') || 
      titleLower.includes('thank-you') || titleLower.includes('companies') || 
      titleLower.includes('people that can help')) {
    return 'work';
  }
  
  // Independent Living goals
  if (titleLower.includes('make bed') || titleLower.includes('set table') || 
      titleLower.includes('laundry') || titleLower.includes('cook') || 
      titleLower.includes('clean') || titleLower.includes('shopping list')) {
    return 'life';
  }
  
  // Social Skills goals
  if (titleLower.includes('say hi') || titleLower.includes('eye contact') || 
      titleLower.includes('text') || titleLower.includes('handshake') || 
      titleLower.includes('fist pump') || titleLower.includes('compliment')) {
    return 'social_skills';
  }
  
  // Postsecondary goals
  if (titleLower.includes('research colleges') || titleLower.includes('application') || 
      titleLower.includes('financial aid') || titleLower.includes('campus') || 
      titleLower.includes('disability office') || titleLower.includes('supports')) {
    return 'postsecondary';
  }
  
  // Fun/Recreation goals
  if (titleLower.includes('art') || titleLower.includes('craft') || 
      titleLower.includes('sport') || titleLower.includes('game') || 
      titleLower.includes('music') || titleLower.includes('listen') ||
      titleLower.includes('movie') || titleLower.includes('watch') || 
      titleLower.includes('build') || titleLower.includes('photo') || 
      titleLower.includes('video') || titleLower.includes('fun activity')) {
    return 'fun_recreation';
  }
  
  // Default fallback
  return 'life';
};

/**
 * Fix goals that have incorrect domain assignments
 */
export const fixGoalDomains = async (): Promise<void> => {
  try {
    const { data: goals, error } = await supabase
      .from('goals')
      .select('id, title, domain')
      .eq('status', 'active');
    
    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }
    
    const goalsToUpdate = goals?.filter(goal => {
      const correctDomain = getCorrectDomainForGoal(goal.title);
      return goal.domain !== correctDomain;
    }) || [];
    
    console.log(`Found ${goalsToUpdate.length} goals that need domain correction`);
    
    for (const goal of goalsToUpdate) {
      const correctDomain = getCorrectDomainForGoal(goal.title);
      console.log(`Updating goal "${goal.title}" from ${goal.domain} to ${correctDomain}`);
      
      const { error: updateError } = await supabase
        .from('goals')
        .update({ domain: correctDomain })
        .eq('id', goal.id);
        
      if (updateError) {
        console.error(`Error updating goal ${goal.id}:`, updateError);
      }
    }
    
    console.log('Goal domain correction completed');
  } catch (error) {
    console.error('Error in fixGoalDomains:', error);
  }
};