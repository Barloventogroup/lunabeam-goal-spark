import { Step, Goal } from '@/types';

export interface ValidationResult {
  canComplete: boolean;
  reason?: string;
  friendlyMessage?: string;
  blockedBy?: Step[];
}

export interface ValidationError {
  type: 'dependency' | 'week_progression' | 'required_steps';
  message: string;
  friendlyMessage: string;
  suggestions?: string[];
}

class StepValidationService {
  /**
   * Validates if a step can be completed based on dependencies and week progression
   */
  async validateStepCompletion(
    stepId: string, 
    allSteps: Step[], 
    goal: Goal
  ): Promise<ValidationResult> {
    const step = allSteps.find(s => s.id === stepId);
    if (!step) {
      return {
        canComplete: false,
        reason: 'Step not found',
        friendlyMessage: "Hmm, we can't find that step. Try refreshing the page?"
      };
    }

    // Check if step is already completed
    if (step.status === 'done') {
      return {
        canComplete: false,
        reason: 'Already completed',
        friendlyMessage: "You've already completed this step! Great work! 🎉"
      };
    }

    // Check direct step dependencies
    const dependencyValidation = this.checkStepDependencies(step, allSteps);
    if (!dependencyValidation.canComplete) {
      return dependencyValidation;
    }

    // Check week progression for structured goals
    const weekValidation = this.checkWeekProgression(step, allSteps);
    if (!weekValidation.canComplete) {
      return weekValidation;
    }

    // Check required steps within the same session
    const sessionValidation = this.checkSessionRequirements(step, allSteps);
    if (!sessionValidation.canComplete) {
      return sessionValidation;
    }

    return { canComplete: true };
  }

  /**
   * Check if all step dependencies are completed
   */
  private checkStepDependencies(step: Step, allSteps: Step[]): ValidationResult {
    if (!step.dependency_step_ids || step.dependency_step_ids.length === 0) {
      return { canComplete: true };
    }

    const incompleteDependencies = step.dependency_step_ids
      .map(depId => allSteps.find(s => s.id === depId))
      .filter(depStep => depStep && depStep.status !== 'done');

    if (incompleteDependencies.length > 0) {
      const blockedBy = incompleteDependencies.filter(Boolean) as Step[];
      const dependencyTitles = blockedBy.map(s => s.title).join(', ');
      
      return {
        canComplete: false,
        reason: 'Missing dependencies',
        friendlyMessage: `Almost there! First, you'll need to complete: ${dependencyTitles}. Take your time - each step builds on the last one.`,
        blockedBy
      };
    }

    return { canComplete: true };
  }

  /**
   * Check if previous weeks/sessions are completed for structured goals
   */
  private checkWeekProgression(step: Step, allSteps: Step[]): ValidationResult {
    // Extract week and session information from step title
    const currentWeekMatch = step.title.match(/Week (\d+)/i);
    const currentSessionMatch = step.title.match(/Session (\d+)/i);
    
    if (!currentWeekMatch) {
      return { canComplete: true }; // No week structure, allow completion
    }

    const currentWeek = parseInt(currentWeekMatch[1]);
    const currentSession = currentSessionMatch ? parseInt(currentSessionMatch[1]) : 1;

    // Find all steps from previous weeks that should be completed
    const previousSteps = allSteps.filter(s => {
      const weekMatch = s.title.match(/Week (\d+)/i);
      if (!weekMatch) return false;
      
      const stepWeek = parseInt(weekMatch[1]);
      return stepWeek < currentWeek && s.is_required && s.status !== 'done' && s.status !== 'skipped';
    });

    if (previousSteps.length > 0) {
      const weekNumbers = [...new Set(previousSteps.map(s => {
        const match = s.title.match(/Week (\d+)/i);
        return match ? parseInt(match[1]) : 0;
      }))].sort().join(', ');

      return {
        canComplete: false,
        reason: 'Previous weeks incomplete',
        friendlyMessage: `Let's take this step by step! You'll want to finish Week ${weekNumbers} first. This helps build your confidence and skills gradually. You've got this! 💪`,
        blockedBy: previousSteps
      };
    }

    // Check if previous sessions in the same week are completed
    const currentWeekSteps = allSteps.filter(s => {
      const weekMatch = s.title.match(/Week (\d+)/i);
      const sessionMatch = s.title.match(/Session (\d+)/i);
      if (!weekMatch) return false;
      
      const stepWeek = parseInt(weekMatch[1]);
      const stepSession = sessionMatch ? parseInt(sessionMatch[1]) : 1;
      
      return stepWeek === currentWeek && 
             stepSession < currentSession && 
             s.is_required && 
             s.status !== 'done' && 
             s.status !== 'skipped';
    });

    if (currentWeekSteps.length > 0) {
      return {
        canComplete: false,
        reason: 'Previous sessions incomplete',
        friendlyMessage: `You're doing great! Let's finish the earlier sessions in Week ${currentWeek} first. This keeps everything organized and helps you build momentum. 🚀`,
        blockedBy: currentWeekSteps
      };
    }

    return { canComplete: true };
  }

  /**
   * Check if required steps within the same session/grouping are completed
   */
  private checkSessionRequirements(step: Step, allSteps: Step[]): ValidationResult {
    // For sub-steps, check if they can be completed independently
    // or if there are ordering requirements within the same session
    
    const isSubStep = !step.title.match(/Week (\d+).*Session (\d+)/i);
    if (!isSubStep) {
      return { canComplete: true }; // Main steps can usually be completed
    }

    // Find the parent main step for this sub-step
    const stepIndex = step.order_index;
    const nearbySteps = allSteps.filter(s => 
      Math.abs((s.order_index || 0) - stepIndex) <= 5 && // Within 5 positions
      s.id !== step.id
    ).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    // Find the main step that comes before this sub-step
    const parentMainStep = nearbySteps
      .filter(s => (s.order_index || 0) < stepIndex)
      .reverse()
      .find(s => s.title.match(/Week (\d+).*Session (\d+)/i));

    if (parentMainStep && parentMainStep.status !== 'done' && parentMainStep.is_required) {
      return {
        canComplete: false,
        reason: 'Main step not completed',
        friendlyMessage: `Let's start with the main task first: "${parentMainStep.title}". Once you've got that down, this step will be much easier! 🎯`,
        blockedBy: [parentMainStep]
      };
    }

    return { canComplete: true };
  }

  /**
   * Get suggestions for what the user should do next
   */
  getNextStepSuggestions(blockedBy: Step[]): string[] {
    if (!blockedBy || blockedBy.length === 0) return [];

    const suggestions: string[] = [];
    
    // Sort blocked steps by priority (week, then session, then order)
    const sortedBlocked = blockedBy.sort((a, b) => {
      const aWeek = this.extractWeekNumber(a.title);
      const bWeek = this.extractWeekNumber(b.title);
      if (aWeek !== bWeek) return aWeek - bWeek;
      
      const aSession = this.extractSessionNumber(a.title);
      const bSession = this.extractSessionNumber(b.title);
      if (aSession !== bSession) return aSession - bSession;
      
      return (a.order_index || 0) - (b.order_index || 0);
    });

    const nextStep = sortedBlocked[0];
    if (nextStep) {
      suggestions.push(`Start with: "${nextStep.title}"`);
      
      if (nextStep.explainer) {
        suggestions.push(`Tip: ${nextStep.explainer}`);
      }
      
      if (sortedBlocked.length > 1) {
        suggestions.push(`Then you'll have ${sortedBlocked.length - 1} more step${sortedBlocked.length > 2 ? 's' : ''} to complete`);
      }
    }

    return suggestions;
  }

  private extractWeekNumber(title: string): number {
    const match = title.match(/Week (\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }

  private extractSessionNumber(title: string): number {
    const match = title.match(/Session (\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }
}

export const stepValidationService = new StepValidationService();