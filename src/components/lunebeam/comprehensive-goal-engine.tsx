import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Sparkles, Calendar, FileText } from 'lucide-react';
import { getGoalsForCategory, normalizeCategoryName, GoalFlow } from '@/data/comprehensive-goals';

interface ComprehensiveGoalEngineProps {
  category: string;
  onSelectGoal: (goalData: {
    goal: string;
    selectedOption?: string;
    customInputs?: Record<string, string>;
    followUps?: Record<string, string>;
    outputs?: string[];
  }) => void;
  onBack: () => void;
}

interface GoalSelectionData {
  selectedOption?: string;
  customInputs: Record<string, string>;
  followUps: Record<string, string>;
}

export const ComprehensiveGoalEngine: React.FC<ComprehensiveGoalEngineProps> = ({
  category,
  onSelectGoal,
  onBack
}) => {
  const [selectedGoal, setSelectedGoal] = useState<GoalFlow | null>(null);
  const [goalData, setGoalData] = useState<GoalSelectionData>({
    customInputs: {},
    followUps: {}
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');

  const goals = getGoalsForCategory(category);
  const categoryDisplayName = normalizeCategoryName(category);

  const handleGoalSelect = (goal: GoalFlow) => {
    setSelectedGoal(goal);
    setGoalData({
      customInputs: {},
      followUps: {}
    });
    setShowCustomInput(false);
  };

  const handleOptionSelect = (option: string) => {
    if (option === 'Custom') {
      setShowCustomInput(true);
      setGoalData(prev => ({ ...prev, selectedOption: undefined }));
    } else {
      setGoalData(prev => ({ ...prev, selectedOption: option }));
      setShowCustomInput(false);
    }
  };

  const handleCustomInputChange = (key: string, value: string) => {
    setGoalData(prev => ({
      ...prev,
      customInputs: { ...prev.customInputs, [key]: value }
    }));
  };

  const handleFollowUpChange = (key: string, value: string) => {
    setGoalData(prev => ({
      ...prev,
      followUps: { ...prev.followUps, [key]: value }
    }));
  };

  const handleCustomSubmit = () => {
    if (customInputValue.trim()) {
      setGoalData(prev => ({ ...prev, selectedOption: customInputValue.trim() }));
      setShowCustomInput(false);
    }
  };

  const handleCreateGoal = () => {
    if (!selectedGoal) return;

    onSelectGoal({
      goal: selectedGoal.goal,
      selectedOption: goalData.selectedOption,
      customInputs: goalData.customInputs,
      followUps: goalData.followUps,
      outputs: selectedGoal.outputs || []
    });
  };

  const canCreateGoal = selectedGoal && (
    goalData.selectedOption || 
    Object.keys(goalData.customInputs).length > 0 ||
    (!selectedGoal.options && !selectedGoal.custom_inputs)
  );

  // Goal list view
  if (!selectedGoal) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4">
        <div className="max-w-md mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
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
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-2 hover:border-primary/30"
                onClick={() => handleGoalSelect(goal)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{goal.goal}</h3>
                      {goal.options && (
                        <p className="text-sm text-foreground-soft">
                          Options: {goal.options.slice(0, 3).join(', ')}
                          {goal.options.length > 3 && '...'}
                        </p>
                      )}
                      {goal.outputs && (
                        <div className="flex items-center gap-1 mt-2">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {goal.outputs.length} output{goal.outputs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
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

  // Goal configuration view
  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedGoal(null)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{selectedGoal.goal}</h1>
            <p className="text-foreground-soft">Customize your goal</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Options */}
            {selectedGoal.options && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Choose an option:</Label>
                <div className="grid gap-2">
                  {selectedGoal.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={goalData.selectedOption === option ? "default" : "outline"}
                      className="justify-start h-auto p-3 text-left"
                      onClick={() => handleOptionSelect(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Input */}
            {showCustomInput && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Enter your custom option:</Label>
                <div className="flex gap-2">
                  <Input
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    placeholder="Type your custom option..."
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                  />
                  <Button onClick={handleCustomSubmit} disabled={!customInputValue.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Custom Inputs */}
            {selectedGoal.custom_inputs && selectedGoal.custom_inputs.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <Label className="text-sm font-medium">Additional details:</Label>
                {selectedGoal.custom_inputs.map((input, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{input}</Label>
                    <Input
                      value={goalData.customInputs[input] || ''}
                      onChange={(e) => handleCustomInputChange(input, e.target.value)}
                      placeholder={`Enter ${input.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Follow-ups */}
            {selectedGoal.follow_ups && selectedGoal.follow_ups.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <Label className="text-sm font-medium">Follow-up questions:</Label>
                {selectedGoal.follow_ups.map((followUp, index) => (
                  <div key={index} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{followUp}</Label>
                    <Input
                      value={goalData.followUps[followUp] || ''}
                      onChange={(e) => handleFollowUpChange(followUp, e.target.value)}
                      placeholder={`Enter ${followUp.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Outputs Preview */}
            {selectedGoal.outputs && selectedGoal.outputs.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <Label className="text-sm font-medium">What you'll get:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedGoal.outputs.map((output, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {output}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Goal Button */}
        <Button 
          onClick={handleCreateGoal} 
          disabled={!canCreateGoal}
          className="w-full h-12 text-base font-medium"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Create Goal
        </Button>
      </div>
    </div>
  );
};