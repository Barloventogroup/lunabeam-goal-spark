import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, CheckCircle, MessageSquare } from 'lucide-react';
import { GoalFlow } from '@/data/comprehensive-goals';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { DateRange } from 'react-day-picker';

interface GoalWizardEnhancedProps {
  goal: GoalFlow;
  onComplete: (data: {
    goal: string;
    selectedOption?: string;
    customInputs?: Record<string, string>;
    followUps?: Record<string, string>;
    dateRange?: DateRange;
    times?: Record<string, string>;
  }) => void;
  onBack: () => void;
}

interface WizardData {
  selectedOption?: string;
  customValue?: string;
  customInputs: Record<string, string>;
  followUps: Record<string, string>;
  dateRange?: DateRange;
  times: Record<string, string>;
}

export const GoalWizardEnhanced: React.FC<GoalWizardEnhancedProps> = ({
  goal,
  onComplete,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    customInputs: {},
    followUps: {},
    times: {}
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
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
      if (followUp === 'Start date' || followUp === 'End date') {
        if (!steps.find(s => s.type === 'date_range')) {
          steps.push({ type: 'date_range', title: 'Select dates', data: 'dates' });
        }
      } else if (followUp === 'Bedtime' || followUp === 'Wake time') {
        steps.push({ type: 'time', title: followUp, data: followUp });
      } else {
        steps.push({ type: 'follow_up', title: followUp, data: followUp });
      }
    });
  }

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  const handleOptionSelect = (option: string) => {
    if (option === 'Custom') {
      setShowCustomInput(true);
      return;
    }
    setWizardData(prev => ({ ...prev, selectedOption: option }));
    setShowCustomInput(false);
    handleNext();
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      setWizardData(prev => ({ 
        ...prev, 
        selectedOption: 'Custom',
        customValue: customInput.trim()
      }));
      setCustomInput('');
      setShowCustomInput(false);
      handleNext();
    }
  };

  const handleInputSubmit = (key: string, value: string) => {
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

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    setWizardData(prev => ({ ...prev, dateRange }));
  };

  const handleTimeChange = (key: string, time: string) => {
    setWizardData(prev => ({
      ...prev,
      times: { ...prev.times, [key]: time }
    }));
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
        dateRange: wizardData.dateRange,
        times: wizardData.times
      });
    }
  };

  const handleBack = () => {
    if (showCustomInput) {
      setShowCustomInput(false);
      setCustomInput('');
      return;
    }
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const canProceed = () => {
    if (!currentStepData) return false;
    
    if (currentStepData.type === 'options') {
      return wizardData.selectedOption !== undefined && !showCustomInput;
    }
    
    if (currentStepData.type === 'date_range') {
      return wizardData.dateRange?.from !== undefined;
    }
    
    if (currentStepData.type === 'time') {
      return wizardData.times[currentStepData.data as string] !== undefined;
    }
    
    return true;
  };

  // If no steps, go directly to completion
  if (totalSteps === 0) {
    onComplete({
      goal: goal.goal
    });
    return null;
  }

  // Get external resources for specific goals
  const getExternalResources = () => {
    if (goal.goal === "Practice for interview") {
      return [
        { name: "Google Interview Warmup", url: "https://grow.google/certificates/interview-warmup/" },
        { name: "Pramp - Free Mock Interviews", url: "https://www.pramp.com/" }
      ];
    }
    if (goal.goal === "Create resume") {
      return [
        { name: "Resume.io - AI Resume Builder", url: "https://resume.io/" },
        { name: "Canva Resume Builder", url: "https://www.canva.com/resumes/" }
      ];
    }
    return [];
  };

  const externalResources = getExternalResources();

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
                
                {/* Custom input inline */}
                {showCustomInput && (
                  <div className="space-y-3 mt-4 p-4 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Enter custom option:</Label>
                    <Input
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Type your custom option..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomSubmit();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleCustomSubmit} disabled={!customInput.trim()}>
                        Continue
                      </Button>
                      <Button variant="outline" onClick={() => setShowCustomInput(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Date Range Step */}
            {currentStepData.type === 'date_range' && (
              <div className="space-y-4">
                <DateRangePicker
                  dateRange={wizardData.dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  placeholder="Pick start and end dates"
                />
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Time Step */}
            {currentStepData.type === 'time' && (
              <div className="space-y-4">
                <TimePicker
                  time={wizardData.times[currentStepData.data as string] || ''}
                  onTimeChange={(time) => handleTimeChange(currentStepData.data as string, time)}
                  label={`Select ${currentStepData.title.toLowerCase()}`}
                />
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full"
                >
                  Continue
                </Button>
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
                      handleInputSubmit(currentStepData.data as string, customInput);
                      setCustomInput('');
                    }
                  }}
                />
                <Button 
                  onClick={() => {
                    handleInputSubmit(currentStepData.data as string, customInput);
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

            {/* External Resources */}
            {externalResources.length > 0 && currentStep === totalSteps - 1 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Helpful resources:</Label>
                </div>
                <div className="space-y-2">
                  {externalResources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">{resource.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStepData.type === 'options' && !showCustomInput && (
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
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};