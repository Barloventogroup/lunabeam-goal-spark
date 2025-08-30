import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { ArrowLeft, Calendar, Bot } from 'lucide-react';
import { GoalFlow } from '@/data/comprehensive-goals';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface GoalWizardChatProps {
  goal: GoalFlow;
  onComplete: (data: {
    goal: string;
    selectedOption?: string;
    customInputs?: Record<string, string>;
    followUps?: Record<string, string>;
    dateRange?: DateRange;
    times?: Record<string, string>;
    startDate?: Date;
    scaffoldingLevel?: 'simple' | 'detailed';
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
  startDate?: Date;
  scaffoldingLevel?: 'simple' | 'detailed';
}

export const GoalWizardChat: React.FC<GoalWizardChatProps> = ({
  goal,
  onComplete,
  onBack
}) => {
  const [wizardData, setWizardData] = useState<WizardData>({
    customInputs: {},
    followUps: {},
    times: {}
  });
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Build conversation flow based on goal structure
  const buildConversationFlow = () => {
    const flow = [];
    
    // Welcome message
    flow.push({
      type: 'bot',
      content: `Great choice! Let's set up your "${goal.goal}" goal together. I'll guide you through each step to make sure it's perfect for you. 🎯`,
      options: [],
      customInputEnabled: false
    });

    // Options step
    if (goal.options) {
      flow.push({
        type: 'bot',
        content: `To get started, what sounds like the best approach for you?`,
        options: [...goal.options, 'Custom'],
        customInputEnabled: true,
        stepData: { type: 'options', data: goal.options }
      });
    }

    // Custom inputs
    if (goal.custom_inputs) {
      goal.custom_inputs.forEach(input => {
        flow.push({
          type: 'bot',
          content: `Perfect! Now, could you tell me ${input.toLowerCase()}?`,
          options: [],
          customInputEnabled: true,
          inputType: 'text',
          inputLabel: input,
          stepData: { type: 'custom_input', data: input }
        });
      });
    }

    // Follow-ups
    if (goal.follow_ups) {
      goal.follow_ups.forEach(followUp => {
        if (followUp === 'Start date') {
          flow.push({
            type: 'bot',
            content: `Excellent! When would you like to start this goal? Pick a date that feels right for you.`,
            options: [],
            customInputEnabled: false,
            inputType: 'date',
            inputLabel: 'Start date',
            stepData: { type: 'start_date', data: followUp }
          });
        } else if (followUp === 'Days per week') {
          flow.push({
            type: 'bot',
            content: `That's a solid choice! How many days per week would you like to work on this? Choose what feels manageable for you.`,
            options: ['1', '2', '3', '4', '5', '6', '7'],
            customInputEnabled: false,
            inputType: 'days_per_week',
            stepData: { type: 'days_per_week', data: followUp }
          });
        } else if (followUp === 'Bedtime' || followUp === 'Wake time') {
          flow.push({
            type: 'bot',
            content: `Great progress! What time works best for your ${followUp.toLowerCase()}?`,
            options: [],
            customInputEnabled: false,
            inputType: 'time',
            inputLabel: followUp,
            stepData: { type: 'time', data: followUp }
          });
        } else {
          flow.push({
            type: 'bot',
            content: `Awesome! One more thing - ${followUp.toLowerCase()}?`,
            options: [],
            customInputEnabled: true,
            inputType: 'text',
            inputLabel: followUp,
            stepData: { type: 'follow_up', data: followUp }
          });
        }
      });
    }

    // Scaffolding question
    flow.push({
      type: 'bot',
      content: `You're doing great! Before we finalize your plan, would you like me to break this goal into smaller, easier steps for you, or do you prefer a simple milestone to reach?`,
      options: ['Break it down into detailed steps', 'Keep it simple with main milestones'],
      customInputEnabled: false,
      stepData: { type: 'scaffolding', data: 'scaffoldingLevel' }
    });

    // Final confirmation
    flow.push({
      type: 'bot',
      content: `Perfect! Let me show you what your plan will look like. Does this feel right to you?`,
      options: ['Yes, create this goal!', 'Let me adjust something'],
      customInputEnabled: false,
      stepData: { type: 'confirmation', data: 'final' }
    });

    return flow;
  };

  const conversationFlow = buildConversationFlow();

  useEffect(() => {
    // Set initial message
    setCurrentMessage(conversationFlow[0]?.content || '');
  }, []);

  const handleUserResponse = (response: string, inputType?: string) => {
    processUserResponse(response, inputType);
  };

  const processUserResponse = (response: string, inputType?: string) => {
    const currentFlowStep = conversationFlow[currentStep];
    const stepData = currentFlowStep?.stepData;

    if (stepData) {
      switch (stepData.type) {
        case 'options':
          if (response === 'Custom') {
            setShowCustomInput(true);
            return;
          }
          setWizardData(prev => ({ ...prev, selectedOption: response }));
          break;
          
        case 'custom_input':
          setWizardData(prev => ({
            ...prev,
            customInputs: { ...prev.customInputs, [stepData.data]: response }
          }));
          break;
          
        case 'follow_up':
          setWizardData(prev => ({
            ...prev,
            followUps: { ...prev.followUps, [stepData.data]: response }
          }));
          break;
          
        case 'days_per_week':
          setWizardData(prev => ({
            ...prev,
            followUps: { ...prev.followUps, [stepData.data]: response }
          }));
          break;
          
        case 'scaffolding':
          const level = response.includes('detailed') ? 'detailed' : 'simple';
          setWizardData(prev => ({ ...prev, scaffoldingLevel: level }));
          break;
          
        case 'confirmation':
          if (response.includes('Yes')) {
            onComplete({
              goal: goal.goal,
              selectedOption: wizardData.selectedOption,
              customInputs: wizardData.customInputs,
              followUps: wizardData.followUps,
              dateRange: wizardData.dateRange,
              times: wizardData.times,
              startDate: wizardData.startDate,
              scaffoldingLevel: wizardData.scaffoldingLevel
            });
            return;
          } else {
            setCurrentStep(Math.max(0, currentStep - 2));
            setCurrentMessage(conversationFlow[currentStep - 1]?.content || '');
            return;
          }
      }
    }

    // Move to next step
    const nextStep = currentStep + 1;
    if (nextStep < conversationFlow.length) {
      setCurrentStep(nextStep);
      setCurrentMessage(conversationFlow[nextStep]?.content || '');
      setShowCustomInput(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setWizardData(prev => ({ ...prev, startDate: date }));
      handleUserResponse(format(date, 'PPP'), 'date');
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    const currentFlowStep = conversationFlow[currentStep];
    const stepData = currentFlowStep?.stepData;
    
    if (stepData) {
      setWizardData(prev => ({
        ...prev,
        times: { ...prev.times, [stepData.data]: time }
      }));
      handleUserResponse(time, 'time');
    }
  };

  const handleSendMessage = () => {
    if (currentInput.trim()) {
      handleUserResponse(currentInput.trim());
      setCurrentInput('');
    }
  };

  const currentFlowStep = conversationFlow[currentStep];
  const showDatePicker = currentFlowStep?.inputType === 'date';
  const showTimePicker = currentFlowStep?.inputType === 'time';
  const showOptionsButtons = currentFlowStep?.options && currentFlowStep.options.length > 0;
  const showTextInput = (currentFlowStep?.customInputEnabled && !showDatePicker && !showTimePicker) || showCustomInput;

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-background/50 backdrop-blur-sm">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Goal Setup</h1>
          <p className="text-sm text-muted-foreground">Let's create your perfect goal</p>
        </div>
      </div>

      {/* Top Half - Interactive Message */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <Card className="border-none shadow-lg bg-background/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-lg leading-relaxed text-foreground">
                    {currentMessage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Half - Options/Input */}
      <div className="p-6 border-t bg-background/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              {/* Option Buttons */}
              {showOptionsButtons && !showCustomInput && (
                <div className="grid gap-3">
                  {currentFlowStep.options!.map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full text-left justify-start h-auto p-4 text-base"
                      onClick={() => handleUserResponse(option)}
                    >
                      <span>{option}</span>
                    </Button>
                  ))}
                </div>
              )}

              {/* Date Picker */}
              {showDatePicker && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">{currentFlowStep.inputLabel}</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 text-base",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-5 w-5" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Time Picker */}
              {showTimePicker && (
                <div className="space-y-4">
                  <TimePicker
                    time={selectedTime}
                    onTimeChange={handleTimeSelect}
                    label={currentFlowStep.inputLabel}
                  />
                </div>
              )}

              {/* Text Input */}
              {showTextInput && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {currentFlowStep?.inputLabel || 'Your response'}
                  </p>
                  <div className="flex gap-3">
                    <Input
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder={`Type your ${currentFlowStep?.inputLabel?.toLowerCase() || 'response'}...`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 h-12 text-base"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!currentInput.trim()}
                      className="h-12 px-6"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};