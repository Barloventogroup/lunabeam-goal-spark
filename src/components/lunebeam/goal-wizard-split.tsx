import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, CheckCircle, Sparkles, Heart, Star } from 'lucide-react';
import { GoalFlow } from '@/data/comprehensive-goals';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { DateRange } from 'react-day-picker';

interface GoalWizardSplitProps {
  goal: GoalFlow;
  onComplete: (data: {
    goal: string;
    selectedOption?: string;
    customInputs?: Record<string, string>;
    followUps?: Record<string, string>;
    dateRange?: DateRange;
    times?: Record<string, string>;
    scaffoldingLevel?: 'basic' | 'detailed';
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
  scaffoldingLevel?: 'basic' | 'detailed';
}

export const GoalWizardSplit: React.FC<GoalWizardSplitProps> = ({
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
  const [showScaffolding, setShowScaffolding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Build steps array based on goal structure
  const steps = [];
  
  if (goal.options) {
    steps.push({ type: 'options', title: 'Choose an option', data: goal.options });
  }
  
  if (goal.custom_inputs) {
    goal.custom_inputs.forEach(input => {
      steps.push({ type: 'custom_input', title: input, data: input, required: false });
    });
  }
  
  if (goal.required_inputs) {
    goal.required_inputs.forEach(input => {
      if (input === 'Start date' || input === 'End date') {
        if (!steps.find(s => s.type === 'date_range')) {
          steps.push({ type: 'date_range', title: 'Select dates', data: 'dates', required: true });
        }
      } else if (input === 'Days per week') {
        steps.push({ type: 'days_per_week', title: 'How many days per week?', data: input, required: true });
      } else if (input === 'Bedtime' || input === 'Wake time') {
        steps.push({ type: 'time', title: input, data: input, required: true });
      } else if (input === 'Duration' || input === 'Duration per session' || input === 'Duration (minutes)') {
        steps.push({ type: 'duration', title: input, data: input, required: true });
      } else if (input === 'Frequency') {
        steps.push({ type: 'frequency', title: 'How often?', data: input, required: true });
      } else if (input === 'How much?') {
        steps.push({ type: 'amount', title: 'How much?', data: input, required: true });
      } else {
        steps.push({ type: 'required_input', title: input, data: input, required: true });
      }
    });
  }
  
  if (goal.follow_ups) {
    goal.follow_ups.forEach(followUp => {
      if (followUp === 'Start date' || followUp === 'End date') {
        if (!steps.find(s => s.type === 'date_range')) {
          steps.push({ type: 'date_range', title: 'Select dates', data: 'dates', required: false });
        }
      } else if (followUp === 'Days per week') {
        steps.push({ type: 'days_per_week', title: 'How many days per week?', data: followUp, required: false });
      } else if (followUp === 'Bedtime' || followUp === 'Wake time') {
        steps.push({ type: 'time', title: followUp, data: followUp, required: false });
      } else {
        steps.push({ type: 'follow_up', title: followUp, data: followUp, required: false });
      }
    });
  }

  // Add scaffolding and preview steps
  steps.push({ type: 'scaffolding', title: 'Customize your plan', data: 'scaffolding' });
  steps.push({ type: 'preview', title: 'Review your plan', data: 'preview' });

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  const getEncouragingMessage = () => {
    const messages = [
      "You're making great progress! 🌟",
      "That's a solid step! Keep going! 💪",
      "Great choice! You're building something amazing! ✨",
      "You're doing fantastic! Almost there! 🎉",
      "Perfect! I love your commitment! ❤️",
      "Excellent decision! You've got this! 🚀"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getCurrentMessage = () => {
    if (!currentStepData) return "Let's get started! 🌟";
    
    const required = currentStepData.required ? " (This is important for your success!)" : "";
    
    switch (currentStepData.type) {
      case 'options':
        return `Great! Let's personalize your "${goal.goal}" goal. What resonates most with you? 🎯`;
      case 'custom_input':
        return `Perfect! Now let's add some specific details to make this goal uniquely yours! ✨`;
      case 'required_input':
        return `This is important! Let's specify ${currentStepData.title.toLowerCase()} to make your goal concrete and achievable! 💪${required}`;
      case 'date_range':
        return `Awesome! When would you like to start working on this goal? Having a timeline helps you stay focused! 📅${required}`;
      case 'days_per_week':
        return `Excellent choice! How often would you like to work on this? Consistency is key to success! 💪${required}`;
      case 'duration':
        return `Perfect! How long will you spend on this each time? Setting clear time boundaries helps you succeed! ⏱️${required}`;
      case 'frequency':
        return `Great question! How often will you do this? Regular practice makes all the difference! 🔄${required}`;
      case 'amount':
        return `Fantastic! Let's set a specific target amount. Clear goals are easier to achieve! 🎯${required}`;
      case 'time':
        return `Great thinking! Setting a specific time helps build lasting habits. What works best for your schedule? ⏰${required}`;
      case 'follow_up':
        return `You're doing amazing! Let's add one more detail to make your plan complete! 🌟`;
      case 'scaffolding':
        return `Fantastic progress! Now, how would you like me to structure your action plan? I want to make sure it fits your style perfectly! 🎨`;
      case 'preview':
        return `Outstanding! Here's your personalized plan. You're about to embark on something incredible! 🚀`;
      default:
        return "You're making excellent progress! Keep it up! 💫";
    }
  };

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
    } else if (currentStepData.type === 'follow_up' || currentStepData.type === 'required_input' || 
               currentStepData.type === 'duration' || currentStepData.type === 'frequency' || 
               currentStepData.type === 'amount') {
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

  const handleScaffoldingChoice = (level: 'basic' | 'detailed') => {
    setWizardData(prev => ({ ...prev, scaffoldingLevel: level }));
    setShowScaffolding(false);
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
        dateRange: wizardData.dateRange,
        times: wizardData.times,
        scaffoldingLevel: wizardData.scaffoldingLevel
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
    
    switch (currentStepData.type) {
      case 'options':
        return wizardData.selectedOption !== undefined && !showCustomInput;
      case 'date_range':
        return currentStepData.required ? wizardData.dateRange?.from !== undefined : true;
      case 'days_per_week':
        return currentStepData.required ? wizardData.followUps[currentStepData.data as string] !== undefined : true;
      case 'duration':
        return currentStepData.required ? wizardData.followUps[currentStepData.data as string] !== undefined : true;
      case 'frequency':
        return currentStepData.required ? wizardData.followUps[currentStepData.data as string] !== undefined : true;
      case 'amount':
        return currentStepData.required ? wizardData.followUps[currentStepData.data as string] !== undefined : true;
      case 'time':
        return currentStepData.required ? wizardData.times[currentStepData.data as string] !== undefined : true;
      case 'required_input':
        return wizardData.followUps[currentStepData.data as string] !== undefined;
      case 'custom_input':
        return !currentStepData.required || wizardData.customInputs[currentStepData.data as string] !== undefined;
      case 'follow_up':
        return !currentStepData.required || wizardData.followUps[currentStepData.data as string] !== undefined;
      case 'scaffolding':
        return wizardData.scaffoldingLevel !== undefined;
      default:
        return true;
    }
  };

  const generateStepsPreview = () => {
    const steps = [];
    const isDetailed = wizardData.scaffoldingLevel === 'detailed';
    
    if (goal.goal === "Walk for exercise") {
      if (isDetailed) {
        steps.push("Choose comfortable walking shoes");
        steps.push("Plan your walking route");
        steps.push("Set daily walking reminders");
        steps.push("Track your walking progress");
        steps.push("Gradually increase walking distance");
      } else {
        steps.push("Start daily walking routine");
        steps.push("Track progress weekly");
      }
    } else if (goal.goal === "Practice for interview") {
      if (isDetailed) {
        steps.push("Research the company thoroughly");
        steps.push("Review common interview questions");
        steps.push("Practice answers out loud");
        steps.push("Prepare questions to ask interviewer");
        steps.push("Do mock interviews with friends");
      } else {
        steps.push("Research company and practice answers");
        steps.push("Do mock interview sessions");
      }
    } else {
      // Generic steps based on goal type
      if (isDetailed) {
        steps.push("Set up your environment for success");
        steps.push("Break down the goal into daily actions");
        steps.push("Create accountability checkpoints");
        steps.push("Track progress and adjust as needed");
      } else {
        steps.push("Start working on your goal");
        steps.push("Check progress regularly");
      }
    }
    
    return steps;
  };

  // If no steps, go directly to completion
  if (totalSteps === 0) {
    onComplete({
      goal: goal.goal
    });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-background/50 backdrop-blur-sm border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{goal.goal}</h1>
          <p className="text-sm text-foreground-soft">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>
      </div>

      {/* Top Section - Interactive Messages (1/3 of screen) */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="h-1/3 p-4 bg-primary/5 flex flex-col justify-center">
          <Card className="max-w-md mx-auto border-primary/20 bg-background/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-lg text-foreground font-medium leading-relaxed">
                {getCurrentMessage()}
              </p>
              {currentStep > 0 && (
                <p className="text-sm text-primary mt-2 font-medium">
                  {getEncouragingMessage()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 bg-background/50">
          <div className="max-w-md mx-auto">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500" 
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section - Options and Inputs (2/3 of screen) */}
        <div className="h-2/3 p-4 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-4">
            
            {/* Options Step */}
            {currentStepData.type === 'options' && (
              <div className="space-y-3">
                <div className="grid gap-3">
                  {(currentStepData.data as string[]).map((option, index) => (
                    <Button
                      key={index}
                      variant={wizardData.selectedOption === option ? "default" : "outline"}
                      className="h-auto p-4 text-left justify-start hover:scale-[1.02] transition-all"
                      onClick={() => handleOptionSelect(option)}
                    >
                      <div className="flex items-center w-full">
                        <span className="flex-1 text-base">{option}</span>
                        {wizardData.selectedOption === option && (
                          <CheckCircle className="h-5 w-5 ml-2 text-primary-foreground" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
                
                {/* Custom input inline */}
                {showCustomInput && (
                  <Card className="mt-4 border-primary/30 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <Label className="text-sm font-medium text-foreground">Tell me your custom option:</Label>
                      <Input
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Type your idea here..."
                        className="border-primary/30"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCustomSubmit();
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCustomSubmit} 
                          disabled={!customInput.trim()}
                          className="flex-1"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Perfect!
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCustomInput(false)}
                          className="flex-1"
                        >
                          Back
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Date Range Step */}
            {currentStepData.type === 'date_range' && (
              <div className="space-y-4">
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <DateRangePicker
                      dateRange={wizardData.dateRange}
                      onDateRangeChange={handleDateRangeChange}
                      placeholder="Pick your start and end dates"
                      className="w-full"
                    />
                  </CardContent>
                </Card>
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full h-12 text-base font-medium"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Looks great!
                </Button>
              </div>
            )}

            {/* Days per Week Step */}
            {currentStepData.type === 'days_per_week' && (
              <div className="space-y-4">
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                        <Button
                          key={days}
                          variant={wizardData.followUps[currentStepData.data as string] === days.toString() ? "default" : "outline"}
                          className="h-12 text-base font-medium hover:scale-105 transition-all"
                          onClick={() => {
                            setWizardData(prev => ({
                              ...prev,
                              followUps: { ...prev.followUps, [currentStepData.data as string]: days.toString() }
                            }));
                          }}
                        >
                          {days}
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-foreground-soft text-center mt-3">
                      How many days per week feels right for you?
                    </p>
                  </CardContent>
                </Card>
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full h-12 text-base font-medium"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  That's perfect!
                </Button>
              </div>
            )}

            {/* Time Step */}
            {currentStepData.type === 'time' && (
              <div className="space-y-4">
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <TimePicker
                      time={wizardData.times[currentStepData.data as string] || ''}
                      onTimeChange={(time) => handleTimeChange(currentStepData.data as string, time)}
                      label={`What time works best for ${currentStepData.title.toLowerCase()}?`}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full h-12 text-base font-medium"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Great timing!
                </Button>
              </div>
            )}

            {/* Custom Input Step */}
            {(currentStepData.type === 'custom_input' || currentStepData.type === 'follow_up') && (
              <div className="space-y-4">
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <Label className="text-sm font-medium mb-2 block">
                      Tell me about {currentStepData.title.toLowerCase()}:
                    </Label>
                    <Input
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder={`Share your thoughts about ${currentStepData.title.toLowerCase()}...`}
                      className="border-primary/30"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && customInput.trim()) {
                          handleInputSubmit(currentStepData.data as string, customInput);
                          setCustomInput('');
                        }
                      }}
                    />
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      handleInputSubmit(currentStepData.data as string, customInput);
                      setCustomInput('');
                    }}
                    disabled={!customInput.trim()}
                    className="flex-1 h-12 text-base font-medium"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Add this!
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleNext}
                    className="flex-1 h-12 text-base font-medium"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            )}

            {/* Required Input, Duration, Frequency, Amount Steps */}
            {(currentStepData.type === 'required_input' || currentStepData.type === 'duration' || 
              currentStepData.type === 'frequency' || currentStepData.type === 'amount') && (
              <div className="space-y-4">
                <Card className="border-primary/20 border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-medium text-foreground">
                        {currentStepData.title} *
                      </Label>
                    </div>
                    
                    {/* Duration-specific options */}
                    {currentStepData.type === 'duration' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {["5 min", "10 min", "15 min", "20 min", "30 min", "45 min", "1 hour", "2 hours", "Custom"].map((option) => (
                            <Button
                              key={option}
                              variant={wizardData.followUps[currentStepData.data as string] === option ? "default" : "outline"}
                              className="h-10 text-sm hover:scale-105 transition-all"
                              onClick={() => {
                                if (option === "Custom") {
                                  setShowCustomInput(true);
                                } else {
                                  setWizardData(prev => ({
                                    ...prev,
                                    followUps: { ...prev.followUps, [currentStepData.data as string]: option }
                                  }));
                                }
                              }}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Frequency-specific options */}
                    {currentStepData.type === 'frequency' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {["Daily", "Every other day", "3x per week", "2x per week", "Weekly", "Custom"].map((option) => (
                            <Button
                              key={option}
                              variant={wizardData.followUps[currentStepData.data as string] === option ? "default" : "outline"}
                              className="h-12 text-sm hover:scale-105 transition-all"
                              onClick={() => {
                                if (option === "Custom") {
                                  setShowCustomInput(true);
                                } else {
                                  setWizardData(prev => ({
                                    ...prev,
                                    followUps: { ...prev.followUps, [currentStepData.data as string]: option }
                                  }));
                                }
                              }}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amount-specific options */}
                    {currentStepData.type === 'amount' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {["1 page", "5 pages", "10 pages", "1 chapter", "30 minutes", "1 hour", "Custom amount"].map((option) => (
                            <Button
                              key={option}
                              variant={wizardData.followUps[currentStepData.data as string] === option ? "default" : "outline"}
                              className="h-12 text-sm hover:scale-105 transition-all"
                              onClick={() => {
                                if (option === "Custom amount") {
                                  setShowCustomInput(true);
                                } else {
                                  setWizardData(prev => ({
                                    ...prev,
                                    followUps: { ...prev.followUps, [currentStepData.data as string]: option }
                                  }));
                                }
                              }}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generic text input for required_input */}
                    {currentStepData.type === 'required_input' && (
                      <div className="space-y-3">
                        <Input
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder={`Enter ${currentStepData.title.toLowerCase()}...`}
                          className="border-primary/30"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && customInput.trim()) {
                              handleInputSubmit(currentStepData.data as string, customInput);
                              setCustomInput('');
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Custom input for duration/frequency/amount */}
                    {showCustomInput && currentStepData.type !== 'required_input' && (
                      <div className="space-y-3 mt-3 p-3 bg-primary/5 rounded-lg">
                        <Label className="text-sm font-medium">Enter custom {currentStepData.title.toLowerCase()}:</Label>
                        <Input
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder={`Type your custom ${currentStepData.title.toLowerCase()}...`}
                          className="border-primary/30"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && customInput.trim()) {
                              setWizardData(prev => ({
                                ...prev,
                                followUps: { ...prev.followUps, [currentStepData.data as string]: customInput.trim() }
                              }));
                              setCustomInput('');
                              setShowCustomInput(false);
                              handleNext();
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              setWizardData(prev => ({
                                ...prev,
                                followUps: { ...prev.followUps, [currentStepData.data as string]: customInput.trim() }
                              }));
                              setCustomInput('');
                              setShowCustomInput(false);
                              handleNext();
                            }}
                            disabled={!customInput.trim()}
                            className="flex-1"
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            Perfect!
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCustomInput(false)}
                            className="flex-1"
                          >
                            Back
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Continue button for required inputs */}
                {currentStepData.type === 'required_input' && (
                  <Button 
                    onClick={() => {
                      handleInputSubmit(currentStepData.data as string, customInput);
                      setCustomInput('');
                    }}
                    disabled={!customInput.trim()}
                    className="w-full h-12 text-base font-medium"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Got it!
                  </Button>
                )}
                
                {/* Continue button for duration/frequency/amount when not in custom mode */}
                {(currentStepData.type === 'duration' || currentStepData.type === 'frequency' || currentStepData.type === 'amount') && 
                 !showCustomInput && canProceed() && (
                  <Button 
                    onClick={handleNext}
                    className="w-full h-12 text-base font-medium"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Perfect choice!
                  </Button>
                )}
              </div>
            )}

            {/* Scaffolding Step */}
            {currentStepData.type === 'scaffolding' && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <Button
                    variant={wizardData.scaffoldingLevel === 'basic' ? "default" : "outline"}
                    className="h-auto p-4 text-left justify-start hover:scale-[1.02] transition-all"
                    onClick={() => handleScaffoldingChoice('basic')}
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className="font-semibold text-base mb-1">Simple milestones</span>
                      <span className="text-sm text-muted-foreground">
                        Give me high-level goals to reach
                      </span>
                    </div>
                  </Button>
                  <Button
                    variant={wizardData.scaffoldingLevel === 'detailed' ? "default" : "outline"}
                    className="h-auto p-4 text-left justify-start hover:scale-[1.02] transition-all"
                    onClick={() => handleScaffoldingChoice('detailed')}
                  >
                    <div className="flex flex-col items-start w-full">
                      <span className="font-semibold text-base mb-1">Step-by-step checklist</span>
                      <span className="text-sm text-muted-foreground">
                        Break it down into detailed daily actions
                      </span>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {currentStepData.type === 'preview' && (
              <div className="space-y-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4 text-foreground">Your Personalized Plan</h3>
                    <div className="space-y-3">
                      {generateStepsPreview().map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-foreground font-medium">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Button 
                  onClick={handleNext}
                  className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/80"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Create My Goal!
                </Button>
              </div>
            )}

            {/* Continue Button for options step when not in custom input mode */}
            {currentStepData.type === 'options' && !showCustomInput && canProceed() && (
              <Button 
                onClick={handleNext}
                className="w-full h-12 text-base font-medium"
              >
                <Star className="h-4 w-4 mr-2" />
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};