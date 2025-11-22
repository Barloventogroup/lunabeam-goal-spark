/**
 * Executive Function (EF) Skills Assessment Module
 * 
 * Purpose: Behavioral skills assessment for goal planning and scaffolding support.
 * This is NOT a diagnostic tool - it focuses on observable behaviors in daily life contexts
 * to inform personalized goal strategies and support planning.
 * 
 * Key Concepts:
 * - Pillars: User-facing categories (e.g., "Getting started & finishing")
 * - Domains: Internal mapping to research constructs (e.g., "Task Initiation")
 * - Items: Behavioral statements with individual and observer perspectives
 * - Context: Where the behavior occurs (school, work, home, social, general)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * EF Pillar IDs - User-facing categories
 * These are the main groupings shown in the UI
 */
export type EfPillarId =
  | 'GETTING_STARTED_FINISHING'
  | 'PLANNING_ORGANIZATION_TIME'
  | 'FOCUS_WORKING_MEMORY'
  | 'EMOTIONS_STRESS_OVERWHELM'
  | 'FLEXIBILITY_CHANGE'
  | 'SELF_ADVOCACY_INDEPENDENCE';

/**
 * Internal EF Domain IDs - For clinical/research mapping
 * These map to established EF constructs but are not shown directly to users
 */
export type EfDomainId =
  | 'TASK_INITIATION'
  | 'SUSTAINED_ATTENTION'
  | 'WORKING_MEMORY'
  | 'PLANNING'
  | 'ORGANIZATION_MATERIALS'
  | 'TIME_MANAGEMENT'
  | 'EMOTIONAL_REGULATION'
  | 'COGNITIVE_FLEXIBILITY'
  | 'SELF_MONITORING'
  | 'SELF_ADVOCACY';

/**
 * Context where EF challenge occurs
 */
export type EfContext = 
  | 'SCHOOL' 
  | 'WORK' 
  | 'HOME' 
  | 'SOCIAL' 
  | 'GENERAL';

/**
 * Individual EF assessment item
 * Each item has both individual (first-person) and observer (third-person) wording
 */
export interface EfItem {
  id: string;                     // Unique item ID (e.g., "gs_1", "po_1")
  pillarId: EfPillarId;           // Which pillar this belongs to
  domainIds: EfDomainId[];        // 1-2 underlying domains
  context: EfContext;             // Where this challenge shows up
  textIndividual: string;         // First-person wording
  textObserver: string;           // Third-person wording for supporters
}

/**
 * Pillar definition with display info
 */
export interface EfPillar {
  id: EfPillarId;
  label: string;                  // Display name
  description: string;            // Brief explanation for users
  icon?: string;                  // Optional emoji/icon
  color?: string;                 // Optional UI color hint
}

/**
 * Domain definition (internal use)
 */
export interface EfDomain {
  id: EfDomainId;
  label: string;
  description: string;
}

/**
 * EF Assessment Result for a single item
 */
export interface EfAssessmentResult {
  pillar_id: EfPillarId;
  item_id: string;
  rating: number;                 // e.g., 1-5 Likert scale
  assessment_date: string;
}

/**
 * Complete EF Profile for a user
 */
export interface EfProfile {
  user_id: string;
  results: EfAssessmentResult[];
  primary_challenges: EfPillarId[];  // Top 1-2 pillars
  assessment_date: string;
  perspective: 'individual' | 'observer';
}

// ============================================================================
// EF PILLAR DEFINITIONS (User-Facing)
// ============================================================================

export const EF_PILLARS: Record<EfPillarId, EfPillar> = {
  GETTING_STARTED_FINISHING: {
    id: 'GETTING_STARTED_FINISHING',
    label: 'Getting started & finishing',
    description: 'Starting tasks without delay and following through to completion',
    icon: '🚀',
    color: 'blue'
  },
  PLANNING_ORGANIZATION_TIME: {
    id: 'PLANNING_ORGANIZATION_TIME',
    label: 'Planning, organizing & time',
    description: 'Managing materials, planning steps, and estimating time',
    icon: '📋',
    color: 'purple'
  },
  FOCUS_WORKING_MEMORY: {
    id: 'FOCUS_WORKING_MEMORY',
    label: 'Focus & remembering',
    description: 'Staying focused and holding information in mind while working',
    icon: '🎯',
    color: 'green'
  },
  EMOTIONS_STRESS_OVERWHELM: {
    id: 'EMOTIONS_STRESS_OVERWHELM',
    label: 'Emotions & stress',
    description: 'Managing frustration, stress, and emotional responses',
    icon: '💚',
    color: 'pink'
  },
  FLEXIBILITY_CHANGE: {
    id: 'FLEXIBILITY_CHANGE',
    label: 'Handling change & switching',
    description: 'Adapting when plans change and switching between tasks',
    icon: '🔄',
    color: 'orange'
  },
  SELF_ADVOCACY_INDEPENDENCE: {
    id: 'SELF_ADVOCACY_INDEPENDENCE',
    label: 'Self-advocacy & independence',
    description: 'Asking for help, self-monitoring, and building independence',
    icon: '🌟',
    color: 'yellow'
  }
};

// ============================================================================
// EF DOMAIN DEFINITIONS (Internal Mapping)
// ============================================================================

export const EF_DOMAINS: Record<EfDomainId, EfDomain> = {
  TASK_INITIATION: {
    id: 'TASK_INITIATION',
    label: 'Task Initiation',
    description: 'Beginning tasks in a timely manner'
  },
  SUSTAINED_ATTENTION: {
    id: 'SUSTAINED_ATTENTION',
    label: 'Sustained Attention',
    description: 'Maintaining focus over time'
  },
  WORKING_MEMORY: {
    id: 'WORKING_MEMORY',
    label: 'Working Memory',
    description: 'Holding and manipulating information'
  },
  PLANNING: {
    id: 'PLANNING',
    label: 'Planning',
    description: 'Creating roadmaps to reach goals'
  },
  ORGANIZATION_MATERIALS: {
    id: 'ORGANIZATION_MATERIALS',
    label: 'Organization',
    description: 'Managing materials and workspace'
  },
  TIME_MANAGEMENT: {
    id: 'TIME_MANAGEMENT',
    label: 'Time Management',
    description: 'Estimating and allocating time'
  },
  EMOTIONAL_REGULATION: {
    id: 'EMOTIONAL_REGULATION',
    label: 'Emotional Regulation',
    description: 'Managing emotional responses'
  },
  COGNITIVE_FLEXIBILITY: {
    id: 'COGNITIVE_FLEXIBILITY',
    label: 'Cognitive Flexibility',
    description: 'Adapting to changes and new situations'
  },
  SELF_MONITORING: {
    id: 'SELF_MONITORING',
    label: 'Self-Monitoring',
    description: 'Tracking own performance and progress'
  },
  SELF_ADVOCACY: {
    id: 'SELF_ADVOCACY',
    label: 'Self-Advocacy',
    description: 'Requesting needed support'
  }
};

// ============================================================================
// TIER-0 ITEM BANK (8 Behavioral Items)
// ============================================================================

/**
 * Tier-0 Item Bank: Initial assessment items (1-2 per pillar)
 * 
 * Language Guidelines:
 * - Plain, behavioral, observable statements
 * - Context-specific when relevant (school/work/home)
 * - Avoid clinical/diagnostic terms
 * - Focus on everyday challenges
 * 
 * Note: Self-advocacy items can be added in Tier-1 expansion
 */
export const EF_ITEM_BANK: EfItem[] = [
  // Getting Started & Finishing (2 items)
  {
    id: 'gs_1',
    pillarId: 'GETTING_STARTED_FINISHING',
    domainIds: ['TASK_INITIATION'],
    context: 'GENERAL',
    textIndividual: 'I put off starting tasks, even when I know they matter.',
    textObserver: 'They put off starting tasks, even when they know they matter.'
  },
  {
    id: 'gs_2',
    pillarId: 'GETTING_STARTED_FINISHING',
    domainIds: ['TASK_INITIATION', 'SELF_MONITORING'],
    context: 'SCHOOL',
    textIndividual: 'I start projects but have trouble finishing them.',
    textObserver: 'They start projects but have trouble finishing them.'
  },

  // Planning, Organization & Time (2 items)
  {
    id: 'po_1',
    pillarId: 'PLANNING_ORGANIZATION_TIME',
    domainIds: ['TIME_MANAGEMENT'],
    context: 'SCHOOL',
    textIndividual: 'I often underestimate how long school or work tasks will take.',
    textObserver: 'They often underestimate how long school or work tasks will take.'
  },
  {
    id: 'po_2',
    pillarId: 'PLANNING_ORGANIZATION_TIME',
    domainIds: ['ORGANIZATION_MATERIALS', 'PLANNING'],
    context: 'HOME',
    textIndividual: 'I lose track of materials I need (like books, supplies, or devices).',
    textObserver: 'They lose track of materials they need (like books, supplies, or devices).'
  },

  // Focus & Working Memory (2 items)
  {
    id: 'fw_1',
    pillarId: 'FOCUS_WORKING_MEMORY',
    domainIds: ['WORKING_MEMORY'],
    context: 'GENERAL',
    textIndividual: 'I forget what I was supposed to be doing in the middle of a task.',
    textObserver: 'They forget what they were supposed to be doing in the middle of a task.'
  },
  {
    id: 'fw_2',
    pillarId: 'FOCUS_WORKING_MEMORY',
    domainIds: ['SUSTAINED_ATTENTION', 'WORKING_MEMORY'],
    context: 'WORK',
    textIndividual: 'I get distracted easily and have trouble staying focused.',
    textObserver: 'They get distracted easily and have trouble staying focused.'
  },

  // Emotions & Stress (1 item for Tier-0)
  {
    id: 'es_1',
    pillarId: 'EMOTIONS_STRESS_OVERWHELM',
    domainIds: ['EMOTIONAL_REGULATION'],
    context: 'SCHOOL',
    textIndividual: 'When I get frustrated by school or work, it\'s hard to keep going.',
    textObserver: 'When they get frustrated by school or work, it\'s hard for them to keep going.'
  },

  // Flexibility & Change (1 item for Tier-0)
  {
    id: 'fc_1',
    pillarId: 'FLEXIBILITY_CHANGE',
    domainIds: ['COGNITIVE_FLEXIBILITY'],
    context: 'GENERAL',
    textIndividual: 'If plans change, it\'s hard for me to adjust and move on.',
    textObserver: 'If plans change, it\'s hard for them to adjust and move on.'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all items for a specific pillar
 */
export function getItemsByPillar(pillarId: EfPillarId): EfItem[] {
  return EF_ITEM_BANK.filter(item => item.pillarId === pillarId);
}

/**
 * Get all items for a specific domain
 */
export function getItemsByDomain(domainId: EfDomainId): EfItem[] {
  return EF_ITEM_BANK.filter(item => item.domainIds.includes(domainId));
}

/**
 * Get all items for a specific context
 */
export function getItemsByContext(context: EfContext): EfItem[] {
  return EF_ITEM_BANK.filter(item => item.context === context);
}

/**
 * Get item text based on perspective (individual vs observer)
 */
export function getItemText(item: EfItem, perspective: 'individual' | 'observer'): string {
  return perspective === 'individual' ? item.textIndividual : item.textObserver;
}

/**
 * Get all pillar IDs as array
 */
export function getAllPillarIds(): EfPillarId[] {
  return Object.keys(EF_PILLARS) as EfPillarId[];
}

/**
 * Get pillar display info
 */
export function getPillarInfo(pillarId: EfPillarId): EfPillar {
  return EF_PILLARS[pillarId];
}

/**
 * Get all domain IDs as array
 */
export function getAllDomainIds(): EfDomainId[] {
  return Object.keys(EF_DOMAINS) as EfDomainId[];
}

/**
 * Get domain display info
 */
export function getDomainInfo(domainId: EfDomainId): EfDomain {
  return EF_DOMAINS[domainId];
}

/**
 * Get an item by its ID
 */
export function getItemById(itemId: string): EfItem | undefined {
  return EF_ITEM_BANK.find(item => item.id === itemId);
}

/**
 * Get all items in the bank
 */
export function getAllItems(): EfItem[] {
  return EF_ITEM_BANK;
}

/**
 * Get count of items per pillar
 */
export function getItemCountByPillar(): Record<EfPillarId, number> {
  const counts = {} as Record<EfPillarId, number>;
  getAllPillarIds().forEach(pillarId => {
    counts[pillarId] = getItemsByPillar(pillarId).length;
  });
  return counts;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  EF_PILLARS,
  EF_DOMAINS,
  EF_ITEM_BANK,
  getItemsByPillar,
  getItemsByDomain,
  getItemsByContext,
  getItemText,
  getAllPillarIds,
  getPillarInfo,
  getAllDomainIds,
  getDomainInfo,
  getItemById,
  getAllItems,
  getItemCountByPillar
};
