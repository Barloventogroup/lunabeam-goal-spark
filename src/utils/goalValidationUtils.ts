import { differenceInWeeks, parseISO } from 'date-fns';

interface FrequencyInfo {
  frequency: number;
  period: 'day' | 'week' | 'month';
  totalSessions?: number;
}

/**
 * Parse frequency information from goal title or description
 * Examples: "3 times/week", "daily", "2x per week", "once a week"
 */
export function parseGoalFrequency(title: string, description?: string): FrequencyInfo | null {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Pattern for "X times/week" or "X times per week"
  const timesPerWeekMatch = text.match(/(\d+)\s*times?\s*(?:\/|per)\s*week/);
  if (timesPerWeekMatch) {
    return {
      frequency: parseInt(timesPerWeekMatch[1]),
      period: 'week'
    };
  }
  
  // Pattern for "X times/day" or "X times per day"
  const timesPerDayMatch = text.match(/(\d+)\s*times?\s*(?:\/|per)\s*day/);
  if (timesPerDayMatch) {
    return {
      frequency: parseInt(timesPerDayMatch[1]),
      period: 'day'
    };
  }
  
  // Pattern for "Xx per week" or "X per week"
  const xPerWeekMatch = text.match(/(\d+)x?\s*per\s*week/);
  if (xPerWeekMatch) {
    return {
      frequency: parseInt(xPerWeekMatch[1]),
      period: 'week'
    };
  }
  
  // Pattern for "daily"
  if (text.includes('daily') || text.includes('every day')) {
    return {
      frequency: 7,
      period: 'week'
    };
  }
  
  // Pattern for "weekly" or "once a week"
  if (text.includes('weekly') || text.includes('once a week') || text.includes('1x per week')) {
    return {
      frequency: 1,
      period: 'week'
    };
  }
  
  return null;
}

/**
 * Validate if the goal's due date allows enough time for the specified frequency
 */
export function validateGoalFrequencyWithDueDate(
  title: string,
  description: string | undefined,
  startDate: string | undefined,
  dueDate: string | undefined
): { isValid: boolean; error?: string; minRequiredWeeks?: number } {
  if (!dueDate) {
    return { isValid: true };
  }
  
  const frequency = parseGoalFrequency(title, description);
  if (!frequency) {
    return { isValid: true }; // Can't validate if we can't parse frequency
  }
  
  const start = startDate ? parseISO(startDate) : new Date();
  const end = parseISO(dueDate);
  const availableWeeks = differenceInWeeks(end, start) + 1; // +1 to include the current week
  
  if (frequency.period === 'week') {
    // For weekly frequencies, we need at least enough weeks to complete the sessions
    const minRequiredWeeks = Math.ceil(frequency.frequency); // At least 1 week per session
    
    if (availableWeeks < minRequiredWeeks) {
      return {
        isValid: false,
        error: `Hey! Your goal needs ${frequency.frequency} sessions per week, but you only have ${availableWeeks} week(s) until your deadline. That's not enough time to build this habit properly.`,
        minRequiredWeeks
      };
    }
    
    // Also check if we can realistically fit the sessions
    if (frequency.frequency > 7) {
      return {
        isValid: false,
        error: `Whoa! ${frequency.frequency} sessions per week means more than once per day. That might be too much! Try aiming for 7 or fewer sessions per week.`
      };
    }
  } else if (frequency.period === 'day') {
    // For daily frequencies, check if we have enough days
    const totalDays = availableWeeks * 7;
    const requiredDays = frequency.frequency;
    
    if (totalDays < requiredDays) {
      return {
        isValid: false,
        error: `Your goal needs ${frequency.frequency} sessions per day, but you only have ${totalDays} day(s) until your deadline. You'll need more time to complete this goal!`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Get minimum required date for a goal based on its frequency
 */
export function getMinRequiredDate(
  title: string,
  description: string | undefined,
  startDate?: string
): Date | null {
  const frequency = parseGoalFrequency(title, description);
  if (!frequency || frequency.period !== 'week') {
    return null;
  }
  
  const start = startDate ? parseISO(startDate) : new Date();
  const minWeeks = Math.ceil(frequency.frequency);
  
  const minDate = new Date(start);
  minDate.setDate(minDate.getDate() + (minWeeks * 7) - 1); // -1 because we include the start week
  
  return minDate;
}