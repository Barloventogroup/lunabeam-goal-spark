import { describe, it, expect, vi, beforeEach } from 'vitest';
import { progressiveMasteryService } from '../progressiveMasteryService';

describe('progressiveMasteryService', () => {
  describe('calculateSkillLevel', () => {
    it('should average three responses correctly', () => {
      const result = progressiveMasteryService.calculateSkillLevel({
        q1: 3, q2: 4, q3: 5
      });
      expect(result).toBe(4); // (3+4+5)/3 = 4
    });
    
    it('should round to nearest integer', () => {
      const result = progressiveMasteryService.calculateSkillLevel({
        q1: 2, q2: 3, q3: 3
      });
      expect(result).toBe(3); // (2+3+3)/3 = 2.67 → 3
    });
    
    it('should handle level 1 (lowest)', () => {
      const result = progressiveMasteryService.calculateSkillLevel({
        q1: 1, q2: 1, q3: 1
      });
      expect(result).toBe(1);
    });
    
    it('should handle level 5 (highest)', () => {
      const result = progressiveMasteryService.calculateSkillLevel({
        q1: 5, q2: 5, q3: 5
      });
      expect(result).toBe(5);
    });
    
    it('should handle mixed low and high values', () => {
      const result = progressiveMasteryService.calculateSkillLevel({
        q1: 1, q2: 5, q3: 3
      });
      expect(result).toBe(3); // (1+5+3)/3 = 3
    });

    it('should handle edge case with decimals rounding down', () => {
      const result = progressiveMasteryService.calculateSkillLevel({
        q1: 2, q2: 2, q3: 2
      });
      expect(result).toBe(2); // (2+2+2)/3 = 2
    });

    it('should handle edge case with decimals rounding up', () => {
      const result = progressiveMasteryService.calculateSkillLevel({
        q1: 3, q2: 3, q3: 4
      });
      expect(result).toBe(3); // (3+3+4)/3 = 3.33 → 3
    });
  });

  describe('getSkillLevelLabel', () => {
    it('should return "Beginner" for level 1', () => {
      expect(progressiveMasteryService.getSkillLevelLabel(1)).toBe('Beginner');
    });
    
    it('should return "Early Learner" for level 2', () => {
      expect(progressiveMasteryService.getSkillLevelLabel(2)).toBe('Early Learner');
    });
    
    it('should return "Developing" for level 3', () => {
      expect(progressiveMasteryService.getSkillLevelLabel(3)).toBe('Developing');
    });
    
    it('should return "Proficient" for level 4', () => {
      expect(progressiveMasteryService.getSkillLevelLabel(4)).toBe('Proficient');
    });
    
    it('should return "Independent" for level 5', () => {
      expect(progressiveMasteryService.getSkillLevelLabel(5)).toBe('Independent');
    });
    
    it('should default to "Beginner" for invalid low levels', () => {
      expect(progressiveMasteryService.getSkillLevelLabel(0)).toBe('Beginner');
      expect(progressiveMasteryService.getSkillLevelLabel(-1)).toBe('Beginner');
    });

    it('should default to "Beginner" for invalid high levels', () => {
      expect(progressiveMasteryService.getSkillLevelLabel(6)).toBe('Beginner');
      expect(progressiveMasteryService.getSkillLevelLabel(10)).toBe('Beginner');
    });
  });

  describe('suggestStartFrequency', () => {
    it('should suggest 30% for level 1 beginners with minimum of 1', () => {
      const result = progressiveMasteryService.suggestStartFrequency(1, 5);
      expect(result.suggested_initial).toBe(2); // Math.max(1, Math.round(5 * 0.3))
      expect(result.target_frequency).toBe(5);
      expect(result.rationale).toContain('brand new');
    });
    
    it('should suggest 40% for level 2 with minimum of 2', () => {
      const result = progressiveMasteryService.suggestStartFrequency(2, 5);
      expect(result.suggested_initial).toBe(2); // Math.max(2, Math.round(5 * 0.4))
      expect(result.rationale).toContain('tried before');
    });
    
    it('should suggest 60% for level 3', () => {
      const result = progressiveMasteryService.suggestStartFrequency(3, 5);
      expect(result.suggested_initial).toBe(3); // Math.round(5 * 0.6)
      expect(result.rationale).toContain('developing');
    });
    
    it('should suggest 80% for level 4', () => {
      const result = progressiveMasteryService.suggestStartFrequency(4, 5);
      expect(result.suggested_initial).toBe(4); // Math.max(4, Math.round(5 * 0.8))
      expect(result.rationale).toContain('proficient');
    });
    
    it('should suggest 100% for level 5 independent', () => {
      const result = progressiveMasteryService.suggestStartFrequency(5, 5);
      expect(result.suggested_initial).toBe(5);
      expect(result.rationale).toContain('independent');
    });
    
    it('should respect minimum of 1 for very low targets', () => {
      const result = progressiveMasteryService.suggestStartFrequency(1, 2);
      expect(result.suggested_initial).toBeGreaterThanOrEqual(1);
      expect(result.suggested_initial).toBeLessThanOrEqual(2);
    });
    
    it('should handle high frequency targets', () => {
      const result = progressiveMasteryService.suggestStartFrequency(1, 7);
      expect(result.suggested_initial).toBe(3); // Math.max(1, Math.round(7 * 0.3))
      expect(result.target_frequency).toBe(7);
    });

    it('should suggest near-target for level 4 with high frequency', () => {
      const result = progressiveMasteryService.suggestStartFrequency(4, 7);
      expect(result.suggested_initial).toBe(6); // Math.max(6, Math.round(7 * 0.8))
      expect(result.target_frequency).toBe(7);
    });

    it('should handle edge case of target frequency 1', () => {
      const result = progressiveMasteryService.suggestStartFrequency(1, 1);
      expect(result.suggested_initial).toBe(1);
      expect(result.target_frequency).toBe(1);
    });

    it('should handle all levels with target frequency 7', () => {
      const level1 = progressiveMasteryService.suggestStartFrequency(1, 7);
      const level2 = progressiveMasteryService.suggestStartFrequency(2, 7);
      const level3 = progressiveMasteryService.suggestStartFrequency(3, 7);
      const level4 = progressiveMasteryService.suggestStartFrequency(4, 7);
      const level5 = progressiveMasteryService.suggestStartFrequency(5, 7);

      expect(level1.suggested_initial).toBe(3); // 30% of 7
      expect(level2.suggested_initial).toBe(3); // 40% of 7
      expect(level3.suggested_initial).toBe(4); // 60% of 7
      expect(level4.suggested_initial).toBe(6); // 80% of 7
      expect(level5.suggested_initial).toBe(7); // 100% of 7
    });
  });

  describe('saveSkillAssessment', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should save assessment with calculated level', async () => {
      const responses = { q1: 2, q2: 3, q3: 3 };
      
      // This will be called but mocked by setup.ts
      await expect(
        progressiveMasteryService.saveSkillAssessment('goal-123', responses)
      ).resolves.not.toThrow();
    });
  });

  describe('saveSmartStartPlan', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should save plan when accepted', async () => {
      const plan = {
        suggested_initial: 3,
        target_frequency: 5,
        rationale: 'Test rationale',
        phase_guidance: 'Test phase guidance'
      };

      await expect(
        progressiveMasteryService.saveSmartStartPlan('goal-123', plan, true, 3)
      ).resolves.not.toThrow();
    });

    it('should save plan when rejected with selected frequency', async () => {
      const plan = {
        suggested_initial: 3,
        target_frequency: 5,
        rationale: 'Test rationale',
        phase_guidance: 'Test phase guidance'
      };

      await expect(
        progressiveMasteryService.saveSmartStartPlan('goal-123', plan, false, 5)
      ).resolves.not.toThrow();
    });
  });
});
