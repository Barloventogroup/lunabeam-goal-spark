import { expect, vi } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis()
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null }))
  }
}));

// Add custom matchers
declare module 'vitest' {
  interface Assertion {
    toBeWithinRange(floor: number, ceiling: number): void;
  }
}

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`
    };
  }
});
