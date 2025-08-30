import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle } from 'lucide-react';
import { GoalFlow } from '@/data/comprehensive-goals';

interface GoalWizardFlowProps {
  goal: GoalFlow;
  onComplete: (data: {
    goal: string;
    selectedOption?: string;
    customInputs?: Record<string, string>;
    followUps?: Record<string, string>;
    outputs?: string[];
  }) => void;
  onBack: () => void;
}

interface WizardData {
  selectedOption?: string;
  customInputs: Record<string, string>;
  followUps: Record<string, string>;
}

export const GoalWizardFlow: React.FC<GoalWizardFlowProps> = ({
  goal,
  onComplete,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    customInputs: {},
    followUps: {}
  });
  const [customInput, setCustomInput] = useState('');

  // Build steps array based on goal structure
  const steps = [];
  
  if (goal.options) {
    steps.push({ type: 'options', title: 'Choose an option', data: goal.options });
  }
  
  if (goal.custom_inputs) {
    goal.custom_inputs.forEach(input => {
      steps.push({ type: 'custom_input', title: input, data: input });
    });
  }
  
  if (goal.follow_ups) {
    goal.follow_ups.forEach(followUp => {
      steps.push({ type: 'follow_up', title: followUp, data: followUp });
    });
  }

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  const handleOptionSelect = (option: string) => {
    if (option === 'Custom') {
      // Handle custom input inline
      return;
    }
    setWizardData(prev => ({ ...prev, selectedOption: option }));
    handleNext();
  };

  const handleCustomInputSubmit = (key: string, value: string) => {
    if (currentStepData.type === 'custom_input') {
      setWizardData(prev => ({
        ...prev,
        customInputs: { ...prev.customInputs, [key]: value }
      }));
    } else if (currentStepData.type === 'follow_up') {
      setWizardData(prev => ({
        ...prev,
        followUps: { ...prev.followUps, [key]: value }
      }));
    }
    handleNext();
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the wizard
      onComplete({
        goal: goal.goal,
        selectedOption: wizardData.selectedOption,
        customInputs: wizardData.customInputs,
        followUps: wizardData.followUps,
        outputs: goal.outputs || []
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const canProceed = () => {
    if (!currentStepData) return false;
    
    if (currentStepData.type === 'options') {
      return wizardData.selectedOption !== undefined;
    }
    
    return true; // Custom inputs and follow-ups are optional
  };

  // If no steps, go directly to completion
  if (totalSteps === 0) {
    onComplete({
      goal: goal.goal,
      outputs: goal.outputs || []
    });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{goal.goal}</h1>
            <p className="text-foreground-soft">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-background rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {currentStepData.title}
              </h2>
            </div>

            {/* Options Step */}
            {currentStepData.type === 'options' && (
              <div className="space-y-3">
                <div className="grid gap-3">
                  {(currentStepData.data as string[]).map((option, index) => (
                    <Button
                      key={index}
                      variant={wizardData.selectedOption === option ? "default" : "outline"}
                      className="h-auto p-4 text-left justify-start"
                      onClick={() => handleOptionSelect(option)}
                    >
                      <div className="flex items-center w-full">
                        <span className="flex-1">{option}</span>
                        {wizardData.selectedOption === option && (
                          <CheckCircle className="h-4 w-4 ml-2" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Input Step */}
            {(currentStepData.type === 'custom_input' || currentStepData.type === 'follow_up') && (
              <div className="space-y-4">
                <Input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={`Enter ${currentStepData.title.toLowerCase()}...`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customInput.trim()) {
                      handleCustomInputSubmit(currentStepData.data as string, customInput);
                      setCustomInput('');
                    }
                  }}
                />
                <Button 
                  onClick={() => {
                    handleCustomInputSubmit(currentStepData.data as string, customInput);
                    setCustomInput('');
                  }}
                  disabled={!customInput.trim()}
                  className="w-full"
                >
                  Continue
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleNext}
                  className="w-full text-muted-foreground"
                >
                  Skip this step
                </Button>
              </div>
            )}

            {/* What you'll get preview */}
            {goal.outputs && goal.outputs.length > 0 && currentStep === totalSteps - 1 && (
              <div className="mt-6 pt-6 border-t">
                <Label className="text-sm font-medium mb-3 block">What you'll get:</Label>
                <div className="flex flex-wrap gap-2">
                  {goal.outputs.map((output, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {output}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStepData.type === 'options' && (
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full h-12 text-base font-medium"
          >
            {currentStep === totalSteps - 1 ? (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Create Goal
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};