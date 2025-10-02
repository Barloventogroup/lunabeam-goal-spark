export const stepGenerationAnalytics = {
  async logStepGeneration(params: {
    goalId: string;
    userId: string;
    method: 'ai' | 'milestone' | 'rules' | 'manual';
    success: boolean;
    stepsGenerated: number;
    error?: string;
    timeMs: number;
  }): Promise<void> {
    try {
      console.log('[Step Gen Analytics]', {
        ...params,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log step generation:', error);
    }
  }
};
