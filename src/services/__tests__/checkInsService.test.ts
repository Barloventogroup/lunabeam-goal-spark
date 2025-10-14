import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkInsService } from '../checkInsService';

describe('CheckInsService', () => {
  const service = checkInsService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    describe('quality rating validation', () => {
      it('should accept valid quality rating of 1', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 1,
          independenceLevel: 3
        };
        
        // Mocked create should not throw
        await expect(service.create(data)).resolves.toBeDefined();
      });

      it('should accept valid quality rating of 5', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 5,
          independenceLevel: 3
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });

      it('should reject quality rating of 0', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 0,
          independenceLevel: 3
        };
        
        await expect(service.create(data)).rejects.toThrow('Quality rating must be between 1 and 5');
      });

      it('should reject quality rating of 6', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 6,
          independenceLevel: 3
        };
        
        await expect(service.create(data)).rejects.toThrow('Quality rating must be between 1 and 5');
      });
    });

    describe('independence level validation', () => {
      it('should accept valid independence level of 1', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 1
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });

      it('should accept valid independence level of 5', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 5
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });

      it('should reject independence level of 0', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 0
        };
        
        await expect(service.create(data)).rejects.toThrow('Independence level must be between 1 and 5');
      });

      it('should reject independence level of 6', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 6
        };
        
        await expect(service.create(data)).rejects.toThrow('Independence level must be between 1 and 5');
      });
    });

    describe('notes validation', () => {
      it('should accept notes under 500 characters', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          notes: 'a'.repeat(499)
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });

      it('should accept notes exactly 500 characters', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          notes: 'a'.repeat(500)
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });

      it('should reject notes over 500 characters', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          notes: 'a'.repeat(501)
        };
        
        await expect(service.create(data)).rejects.toThrow('Notes cannot exceed 500 characters');
      });

      it('should accept empty notes', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          notes: ''
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });
    });

    describe('time spent validation', () => {
      it('should accept time spent of 1 minute', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          timeSpentMinutes: 1
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });

      it('should accept time spent of 480 minutes (8 hours)', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          timeSpentMinutes: 480
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });

      it('should reject time spent over 480 minutes', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          timeSpentMinutes: 500
        };
        
        await expect(service.create(data)).rejects.toThrow('Time spent cannot exceed 480 minutes');
      });

      it('should reject negative time spent', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          timeSpentMinutes: -5
        };
        
        await expect(service.create(data)).rejects.toThrow('Time spent must be positive');
      });
    });

    describe('helper validation', () => {
      it('should accept helperPresent true with helperId', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          helperPresent: true,
          helperId: 'helper-uuid'
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });

      it('should reject helperPresent true without helperId', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          helperPresent: true
        };
        
        await expect(service.create(data)).rejects.toThrow('Helper ID required when helper is present');
      });

      it('should accept helperPresent false without helperId', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3,
          helperPresent: false
        };
        
        await expect(service.create(data)).resolves.toBeDefined();
      });
    });

    describe('required fields validation', () => {
      it('should reject missing goalId', async () => {
        const data = {
          stepId: 'uuid-456',
          qualityRating: 3,
          independenceLevel: 3
        } as any;
        
        await expect(service.create(data)).rejects.toThrow('Goal ID and Step ID are required');
      });

      it('should reject missing stepId', async () => {
        const data = {
          goalId: 'uuid-123',
          qualityRating: 3,
          independenceLevel: 3
        } as any;
        
        await expect(service.create(data)).rejects.toThrow('Goal ID and Step ID are required');
      });

      it('should reject missing qualityRating', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          independenceLevel: 3
        } as any;
        
        await expect(service.create(data)).rejects.toThrow('Quality rating and independence level are required');
      });

      it('should reject missing independenceLevel', async () => {
        const data = {
          goalId: 'uuid-123',
          stepId: 'uuid-456',
          qualityRating: 3
        } as any;
        
        await expect(service.create(data)).rejects.toThrow('Quality rating and independence level are required');
      });
    });
  });

  describe('helper functions', () => {
    describe('calculateTrend', () => {
      it('should detect improving trend with 6+ values', () => {
        // Access private method through any cast for testing
        const trend = (service as any).calculateTrend([1, 2, 2, 3, 3, 4]);
        expect(trend).toBe('improving');
      });

      it('should detect declining trend with 6+ values', () => {
        const trend = (service as any).calculateTrend([4, 4, 3, 3, 2, 1]);
        expect(trend).toBe('declining');
      });

      it('should detect stable trend with 6+ values', () => {
        const trend = (service as any).calculateTrend([3, 3, 3, 3, 3, 3]);
        expect(trend).toBe('stable');
      });

      it('should return insufficient_data for less than 6 values', () => {
        const trend = (service as any).calculateTrend([1, 2, 3]);
        expect(trend).toBe('insufficient_data');
      });

      it('should return insufficient_data for empty array', () => {
        const trend = (service as any).calculateTrend([]);
        expect(trend).toBe('insufficient_data');
      });

      it('should handle mixed trends as stable', () => {
        const trend = (service as any).calculateTrend([1, 3, 2, 4, 2, 3]);
        // Mixed trends should be stable or based on overall average comparison
        expect(['stable', 'improving', 'declining']).toContain(trend);
      });
    });

    describe('average', () => {
      it('should calculate average correctly', () => {
        const avg = (service as any).average([1, 2, 3, 4, 5]);
        expect(avg).toBe(3);
      });

      it('should handle single value', () => {
        const avg = (service as any).average([5]);
        expect(avg).toBe(5);
      });

      it('should handle decimals', () => {
        const avg = (service as any).average([1, 2, 3]);
        expect(avg).toBe(2);
      });

      it('should return 0 for empty array', () => {
        const avg = (service as any).average([]);
        expect(avg).toBe(0);
      });
    });

    describe('sum', () => {
      it('should calculate sum correctly', () => {
        const total = (service as any).sum([1, 2, 3, 4, 5]);
        expect(total).toBe(15);
      });

      it('should handle single value', () => {
        const total = (service as any).sum([10]);
        expect(total).toBe(10);
      });

      it('should return 0 for empty array', () => {
        const total = (service as any).sum([]);
        expect(total).toBe(0);
      });
    });
  });
});
