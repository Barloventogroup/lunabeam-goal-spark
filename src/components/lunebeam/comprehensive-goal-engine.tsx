import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { getGoalsForCategory, normalizeCategoryName, GoalFlow } from '@/data/comprehensive-goals';
import { GoalWizardSplit } from './goal-wizard-split';
import { DateRange } from 'react-day-picker';

interface ComprehensiveGoalEngineProps {
  category: string;
  onSelectGoal: (goalData: {
    goal: string;
    selectedOption?: string;
    customInputs?: Record<string, string>;
    followUps?: Record<string, string>;
    dateRange?: DateRange;
    times?: Record<string, string>;
  }) => void;
  onBack: () => void;
}

export const ComprehensiveGoalEngine: React.FC<ComprehensiveGoalEngineProps> = ({
  category,
  onSelectGoal,
  onBack
}) => {
  const [selectedGoal, setSelectedGoal] = useState<GoalFlow | null>(null);

  // Reset selected goal when category changes to prevent mixing
  React.useEffect(() => {
    setSelectedGoal(null);
  }, [category]);

  const goals = getGoalsForCategory(category);
  const categoryDisplayName = normalizeCategoryName(category);

  const handleGoalSelect = (goal: GoalFlow) => {
    setSelectedGoal(goal);
  };

  // Goal list view
  if (!selectedGoal) {
    return (
      <div className="min-h-[100dvh] bg-gradient-soft p-4">
        <div className="max-w-md mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
          <BackButton onClick={onBack} />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{categoryDisplayName} Goals</h1>
              <p className="text-foreground-soft">What would you like to work on?</p>
            </div>
          </div>

          {/* Goals List */}
          <div className="space-y-3">
            {goals.map((goal, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                onClick={() => handleGoalSelect(goal)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{goal.goal}</h3>
                  </div>
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Goal wizard flow
  return (
    <GoalWizardSplit
      goal={selectedGoal}
      onComplete={onSelectGoal}
      onBack={() => setSelectedGoal(null)}
    />
  );
};