import { supabase } from '@/integrations/supabase/client';

interface SubStep {
  id: string;
  title: string;
  description?: string;
  step_id: string;
}

interface MergeRule {
  keywords: string[];
  mergedTitle: string;
  mergedDescription: string;
  estimatedTime: number;
}

const MERGE_RULES: MergeRule[] = [
  {
    keywords: ['pick what to read', 'decide what sounds fun', 'pick something short'],
    mergedTitle: 'Choose Your Reading Material',
    mergedDescription: 'Pick something you want to read—book, article, comic, or short story. Aim for something engaging and manageable.',
    estimatedTime: 5
  },
  {
    keywords: ['find your reading spot', 'grab your reading spot'],
    mergedTitle: 'Set Up Your Reading Space',
    mergedDescription: 'Find a comfortable, distraction-free spot (bed, couch, favorite corner). Make it cozy like your ideal hangout space.',
    estimatedTime: 2
  },
  {
    keywords: ['set a timer', 'start reading'],
    mergedTitle: 'Begin Your Reading Session',
    mergedDescription: 'Set a timer for 5-15 minutes, then dive in. No pressure to finish everything—just enjoy the process.',
    estimatedTime: 15
  }
];

export const stepRationalizationService = {
  async rationalizeSubSteps(stepId: string): Promise<{ merged: number; kept: number }> {
    // Get all substeps for this step
    const { data: substeps, error } = await supabase
      .from('substeps')
      .select('*')
      .eq('step_id', stepId)
      .order('created_at');

    if (error) throw error;
    if (!substeps || substeps.length === 0) return { merged: 0, kept: 0 };

    let mergedCount = 0;
    let keptCount = 0;
    const processedSubsteps = new Set<string>();

    for (const rule of MERGE_RULES) {
      const matchingSubsteps = substeps.filter(substep => 
        !processedSubsteps.has(substep.id) &&
        rule.keywords.some(keyword => 
          substep.title.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (matchingSubsteps.length > 1) {
        // Create merged substep
        const { error: insertError } = await supabase
          .from('substeps')
          .insert({
            step_id: stepId,
            title: rule.mergedTitle,
            description: rule.mergedDescription,
            is_planned: true
          });

        if (!insertError) {
          // Delete the duplicates
          const idsToDelete = matchingSubsteps.map(s => s.id);
          await supabase
            .from('substeps')
            .delete()
            .in('id', idsToDelete);

          mergedCount += matchingSubsteps.length;
          matchingSubsteps.forEach(s => processedSubsteps.add(s.id));
        }
      } else if (matchingSubsteps.length === 1) {
        processedSubsteps.add(matchingSubsteps[0].id);
        keptCount++;
      }
    }

    // Count remaining unprocessed substeps
    const unprocessedCount = substeps.filter(s => !processedSubsteps.has(s.id)).length;
    keptCount += unprocessedCount;

    return { merged: mergedCount, kept: keptCount };
  },

  async rationalizeGoalSteps(goalId: string): Promise<{ totalMerged: number; totalKept: number }> {
    // Get all steps for this goal
    const { data: steps, error } = await supabase
      .from('steps')
      .select('id')
      .eq('goal_id', goalId);

    if (error) throw error;
    if (!steps) return { totalMerged: 0, totalKept: 0 };

    let totalMerged = 0;
    let totalKept = 0;

    for (const step of steps) {
      const result = await this.rationalizeSubSteps(step.id);
      totalMerged += result.merged;
      totalKept += result.kept;
    }

    return { totalMerged, totalKept };
  }
};