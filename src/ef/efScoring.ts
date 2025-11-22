/**
 * Executive Function Friction & Priority Scoring
 * 
 * Purpose: Convert Tier-0 assessment responses into friction scores and priority areas.
 * This is NOT diagnostic - it identifies relative friction levels to inform goal planning
 * and scaffolding strategies.
 * 
 * Key Concepts:
 * - Friction: How much a challenge interferes with daily activities
 * - Priority Areas: Pillars with higher friction that may benefit from support
 * - Levels: LOW/MEDIUM/HIGH relative friction (not clinical severity)
 */

import type { EfPillarId, EfItem } from './efModel';
import { EF_PILLARS, getAllPillarIds } from './efModel';

// ============================================================================
// RESPONSE SCALE DEFINITIONS
// ============================================================================

/**
 * Response scale for Tier-0 screener
 * Focus on observable impact, not clinical significance
 */
export type EfResponseValue = 0 | 1 | 2 | 3;

/**
 * Response labels for UI display
 */
export const EF_RESPONSE_LABELS: Record<EfResponseValue, string> = {
  0: 'Not an issue',
  1: 'A little',
  2: 'Sometimes causes stress',
  3: 'Often derails school/home/work'
};

/**
 * Individual item response
 */
export interface EfItemResponse {
  itemId: string;
  value: EfResponseValue;
}

// ============================================================================
// FRICTION SCORING TYPES
// ============================================================================

/**
 * Friction level classification
 * Based on average response across items in a pillar
 */
export type FrictionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Friction score for a single pillar
 */
export interface PillarFrictionScore {
  pillarId: EfPillarId;
  average: number;              // 0–3 average response
  level: FrictionLevel;         // Classification based on thresholds
  itemCount: number;            // Number of items in this pillar
  responseCount: number;        // Number of responses received
}

/**
 * Priority area for goal planning
 * Identifies pillars that may benefit from focused support
 */
export interface EfPriorityArea {
  pillarId: EfPillarId;
  level: FrictionLevel;
  average: number;
  pillarLabel: string;          // Display name for UI
}

/**
 * Complete friction profile
 */
export interface EfFrictionProfile {
  priorityAreas: EfPriorityArea[];
  topFocusAreas: EfPillarId[];   // Top 1-3 areas to work on
  assessmentDate: string;
  totalItemsResponded: number;
}

// ============================================================================
// FRICTION LEVEL THRESHOLDS
// ============================================================================

/**
 * Thresholds for classifying friction levels
 * Based on average response values (0-3 scale)
 */
const FRICTION_THRESHOLDS = {
  LOW_MAX: 0.7,        // 0.0 - 0.7 = LOW friction
  MEDIUM_MAX: 1.5      // 0.8 - 1.5 = MEDIUM friction
                       // 1.6 - 3.0 = HIGH friction
} as const;

/**
 * Map average score to friction level
 */
export function mapToFrictionLevel(average: number): FrictionLevel {
  if (average <= FRICTION_THRESHOLDS.LOW_MAX) {
    return 'LOW';
  } else if (average <= FRICTION_THRESHOLDS.MEDIUM_MAX) {
    return 'MEDIUM';
  } else {
    return 'HIGH';
  }
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Compute friction scores for all pillars
 * 
 * @param items - All EF items (typically from EF_ITEM_BANK)
 * @param responses - User responses to those items
 * @returns Friction score for each pillar
 */
export function computePillarFrictionScores(
  items: EfItem[],
  responses: EfItemResponse[]
): PillarFrictionScore[] {
  const pillarIds = getAllPillarIds();
  const responseMap = new Map(responses.map(r => [r.itemId, r.value]));
  
  return pillarIds.map(pillarId => {
    // Get all items for this pillar
    const pillarItems = items.filter(item => item.pillarId === pillarId);
    const itemCount = pillarItems.length;
    
    // Get responses for items in this pillar
    const pillarResponses = pillarItems
      .map(item => responseMap.get(item.id))
      .filter((value): value is EfResponseValue => value !== undefined);
    
    const responseCount = pillarResponses.length;
    
    // Calculate average (0 if no responses)
    const average = responseCount > 0
      ? pillarResponses.reduce((sum, val) => sum + val, 0) / responseCount
      : 0;
    
    const level = mapToFrictionLevel(average);
    
    return {
      pillarId,
      average: Math.round(average * 100) / 100, // Round to 2 decimal places
      level,
      itemCount,
      responseCount
    };
  });
}

/**
 * Compute priority areas from friction scores
 * Converts friction scores into actionable priority list
 * 
 * @param items - All EF items
 * @param responses - User responses
 * @returns Priority areas sorted by friction (descending)
 */
export function computeEfPriorities(
  items: EfItem[],
  responses: EfItemResponse[]
): EfPriorityArea[] {
  const frictionScores = computePillarFrictionScores(items, responses);
  
  // Convert to priority areas and add display labels
  const priorityAreas = frictionScores.map(score => ({
    pillarId: score.pillarId,
    level: score.level,
    average: score.average,
    pillarLabel: EF_PILLARS[score.pillarId].label
  }));
  
  // Sort by average friction (descending)
  return priorityAreas.sort((a, b) => b.average - a.average);
}

/**
 * Get top N focus areas based on friction scores
 * Identifies pillars to prioritize for goal planning and scaffolding
 * 
 * @param priorities - Priority areas (should be sorted)
 * @param maxAreas - Maximum number of areas to return (default: 3)
 * @returns Array of pillar IDs representing top focus areas
 */
export function getTopEfFocusAreas(
  priorities: EfPriorityArea[],
  maxAreas: number = 3
): EfPillarId[] {
  return priorities
    .slice(0, maxAreas)
    .filter(p => p.level !== 'LOW') // Only include MEDIUM or HIGH friction areas
    .map(p => p.pillarId);
}

/**
 * Create complete friction profile from responses
 * Convenience function that combines scoring and prioritization
 * 
 * @param items - All EF items
 * @param responses - User responses
 * @param topAreasCount - Number of top areas to identify (default: 3)
 * @returns Complete friction profile
 */
export function createEfFrictionProfile(
  items: EfItem[],
  responses: EfItemResponse[],
  topAreasCount: number = 3
): EfFrictionProfile {
  const priorityAreas = computeEfPriorities(items, responses);
  const topFocusAreas = getTopEfFocusAreas(priorityAreas, topAreasCount);
  
  return {
    priorityAreas,
    topFocusAreas,
    assessmentDate: new Date().toISOString(),
    totalItemsResponded: responses.length
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get response label for a given value
 */
export function getResponseLabel(value: EfResponseValue): string {
  return EF_RESPONSE_LABELS[value];
}

/**
 * Get all response options for UI rendering
 */
export function getResponseOptions(): Array<{ value: EfResponseValue; label: string }> {
  return [0, 1, 2, 3].map(value => ({
    value: value as EfResponseValue,
    label: EF_RESPONSE_LABELS[value as EfResponseValue]
  }));
}

/**
 * Check if a pillar should be considered a priority
 * (MEDIUM or HIGH friction)
 */
export function isPriorityArea(area: EfPriorityArea): boolean {
  return area.level === 'MEDIUM' || area.level === 'HIGH';
}

/**
 * Get friction level color hint for UI
 */
export function getFrictionLevelColor(level: FrictionLevel): string {
  switch (level) {
    case 'LOW':
      return 'green';
    case 'MEDIUM':
      return 'yellow';
    case 'HIGH':
      return 'red';
  }
}

/**
 * Get friction level description for UI
 */
export function getFrictionLevelDescription(level: FrictionLevel): string {
  switch (level) {
    case 'LOW':
      return 'Minimal friction - this area is going well';
    case 'MEDIUM':
      return 'Moderate friction - could benefit from some support';
    case 'HIGH':
      return 'High friction - strong candidate for focused support';
  }
}

/**
 * Validate that responses match available items
 * Returns array of invalid item IDs
 */
export function validateResponses(
  items: EfItem[],
  responses: EfItemResponse[]
): string[] {
  const validItemIds = new Set(items.map(item => item.id));
  return responses
    .filter(response => !validItemIds.has(response.itemId))
    .map(response => response.itemId);
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(
  totalItems: number,
  responsesReceived: number
): number {
  if (totalItems === 0) return 0;
  return Math.round((responsesReceived / totalItems) * 100);
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  EF_RESPONSE_LABELS,
  computePillarFrictionScores,
  computeEfPriorities,
  getTopEfFocusAreas,
  createEfFrictionProfile,
  mapToFrictionLevel,
  getResponseLabel,
  getResponseOptions,
  isPriorityArea,
  getFrictionLevelColor,
  getFrictionLevelDescription,
  validateResponses,
  calculateCompletionPercentage
};
