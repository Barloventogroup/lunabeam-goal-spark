import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { CalendarIcon, Clock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { goalsService } from '@/services/goalsService';
import type { GoalDomain, GoalPriority } from '@/types';

interface FlowData {
  timeframe?: 'short_term' | 'mid_term' | 'long_term';
  first_action?: string;
  milestone?: string;
  starter_step?: string;
  due_at?: string;
  due_date?: string;
  start_due_at?: string;
}

interface GoalCreationFlowV2Props {
  onComplete?: () => void;
  onExit?: () => void;
}

export const GoalCreationFlowV2: React.FC<GoalCreationFlowV2Props> = ({
  onComplete,
  onExit
}) => {
  const [currentStep, setCurrentStep] = useState('greeting');
  const [flowData, setFlowData] = useState<FlowData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('18:00');
  const { toast } = useToast();

  // Save draft on data changes
  useEffect(() => {
    if (Object.keys(flowData).length > 0) {
      localStorage.setItem('goal_creation_draft_v2', JSON.stringify(flowData));
    }
  }, [flowData]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('goal_creation_draft_v2');
    if (draft) {
      try {
        setFlowData(JSON.parse(draft));
      } catch (e) {
        console.warn('Failed to load draft:', e);
      }
    }
  }, []);

  const updateFlowData = (key: keyof FlowData, value: string) => {
    setFlowData(prev => ({ ...prev, [key]: value }));
  };

  const handleExit = () => {
    // Save draft and close
    localStorage.setItem('goal_creation_draft_v2', JSON.stringify(flowData));
    toast({
      title: "Progress saved 📝",
      description: "You can continue where you left off anytime.",
    });
    onExit?.();
  };

  const handleTimeframeSelect = (timeframe: 'short_term' | 'mid_term' | 'long_term') => {
    updateFlowData('timeframe', timeframe);
    
    switch (timeframe) {
      case 'short_term':
        setCurrentStep('short_followup');
        break;
      case 'mid_term':
        setCurrentStep('mid_followup');
        break;
      case 'long_term':
        setCurrentStep('long_followup');
        break;
    }
  };

  const handleSaveGoal = async () => {
    setIsLoading(true);
    try {
      const title = flowData.first_action || flowData.milestone || flowData.starter_step || 'Untitled Goal';
      const dueDate = flowData.due_at || flowData.start_due_at || flowData.due_date;
      
      const goalData = {
        title,
        description: `${flowData.timeframe?.replace('_', '-')} goal`,
        domain: 'general' as GoalDomain,
        priority: 'medium' as GoalPriority,
        due_date: dueDate
      };

      await goalsService.createGoal(goalData);
      
      // Clear draft
      localStorage.removeItem('goal_creation_draft_v2');
      
      toast({
        title: "Goal created! 🎯",
        description: "Your reminders are all set up.",
      });
      
      onComplete?.();
    } catch (error) {
      toast({
        title: "Oops, something hiccupped",
        description: "Let's give that another shot.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderGreeting = () => (
    <Card className="p-6 space-y-4">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Welcome back 👋</h2>
        <p className="text-muted-foreground">
          Let's set up your goal in a few quick steps. You can exit anytime — I'll save your progress.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setCurrentStep('timeframe')} className="flex-1">
          Let's start
        </Button>
        <Button variant="outline" onClick={handleExit} size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  const renderTimeframe = () => (
    <Card className="p-6 space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Is this a short-term step or a long-term goal?</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => handleTimeframeSelect('short_term')}
          >
            <div className="text-left">
              <div className="font-medium">Today or this week</div>
              <div className="text-sm text-muted-foreground">Quick actions you can do soon</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => handleTimeframeSelect('mid_term')}
          >
            <div className="text-left">
              <div className="font-medium">Next 1–3 months</div>
              <div className="text-sm text-muted-foreground">Milestones and bigger steps</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => handleTimeframeSelect('long_term')}
          >
            <div className="text-left">
              <div className="font-medium">Long-term (6+ months)</div>
              <div className="text-sm text-muted-foreground">Big goals, broken into steps</div>
            </div>
          </Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCurrentStep('greeting')} className="flex-1">
          Back
        </Button>
        <Button variant="outline" onClick={handleExit} size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  const renderTextInput = (stepId: string, prompt: string, placeholder: string, saveKey: keyof FlowData, nextStep: string) => {
    const [inputValue, setInputValue] = useState(flowData[saveKey] || '');

    const handleNext = () => {
      if (inputValue.trim()) {
        updateFlowData(saveKey, inputValue.trim());
        setCurrentStep(nextStep);
      }
    };

    const handleBack = () => {
      if (stepId === 'short_followup' || stepId === 'mid_followup' || stepId === 'long_followup') {
        setCurrentStep('timeframe');
      }
    };

    return (
      <Card className="p-6 space-y-4">
        <div className="space-y-3">
          <h3 className="text-lg font-medium">{prompt}</h3>
          <Textarea
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <BackButton variant="text" onClick={handleBack} className="flex-1" />
          <Button 
            onClick={handleNext} 
            className="flex-1"
            disabled={!inputValue.trim()}
          >
            Next
          </Button>
          <Button variant="outline" onClick={handleExit} size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  const renderDateTimePicker = (stepId: string, prompt: string, helperText: string, saveKey: keyof FlowData, suggestions: string[], constraints: any, nextStep: string) => {
    const handleDateTimeSelect = (dateTime: string) => {
      updateFlowData(saveKey, dateTime);
      setCurrentStep(nextStep);
    };

    const handleCustomDateTime = () => {
      if (selectedDate) {
        const dateTimeString = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`;
        handleDateTimeSelect(dateTimeString);
      }
    };

    const handleBack = () => {
      switch (stepId) {
        case 'short_due':
          setCurrentStep('short_followup');
          break;
        case 'mid_due':
          setCurrentStep('mid_followup');
          break;
        case 'long_first_due':
          setCurrentStep('long_followup');
          break;
      }
    };

    const now = new Date();
    const maxDate = constraints.maxOffsetDays ? addDays(now, constraints.maxOffsetDays) : undefined;
    const minDate = constraints.minOffsetDays ? addDays(now, constraints.minOffsetDays) : now;

    return (
      <Card className="p-6 space-y-4">
        <div className="space-y-3">
          <h3 className="text-lg font-medium">{prompt}</h3>
          <p className="text-sm text-muted-foreground">{helperText}</p>
          
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Parse suggestion and create date string
                  const dateTime = new Date().toISOString(); // Simplified for demo
                  handleDateTimeSelect(dateTime);
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>

          <div className="space-y-3 border-t pt-3">
            <p className="text-sm text-muted-foreground">Or pick a custom time:</p>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border shadow-lg pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => 
                      isBefore(date, minDate) || (maxDate && isAfter(date, maxDate))
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
            
            <Button 
              onClick={handleCustomDateTime} 
              className="w-full"
              disabled={!selectedDate}
            >
              Set this time
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <BackButton variant="text" onClick={handleBack} className="flex-1" />
          <Button variant="outline" onClick={handleExit} size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  const renderSummary = () => {
    const timeframeLabels = {
      short_term: 'Today or this week',
      mid_term: 'Next 1–3 months',
      long_term: 'Long-term (6+ months)'
    };

    const handleBack = () => {
      if (flowData.timeframe === 'short_term') {
        setCurrentStep('short_due');
      } else if (flowData.timeframe === 'mid_term') {
        setCurrentStep('mid_due');
      } else {
        setCurrentStep('long_first_due');
      }
    };

    return (
      <Card className="p-6 space-y-4">
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Confirm your plan</h3>
          
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Timeframe:</span>
              <Badge variant="secondary">
                {flowData.timeframe ? timeframeLabels[flowData.timeframe] : 'Not set'}
              </Badge>
            </div>
            
            {flowData.first_action && (
              <div>
                <span className="text-sm font-medium">Action: </span>
                <span className="text-sm">{flowData.first_action}</span>
              </div>
            )}
            
            {flowData.milestone && (
              <div>
                <span className="text-sm font-medium">Milestone: </span>
                <span className="text-sm">{flowData.milestone}</span>
              </div>
            )}
            
            {flowData.starter_step && (
              <div>
                <span className="text-sm font-medium">Starter step: </span>
                <span className="text-sm">{flowData.starter_step}</span>
              </div>
            )}
            
            {(flowData.due_at || flowData.due_date || flowData.start_due_at) && (
              <div>
                <span className="text-sm font-medium">Due: </span>
                <span className="text-sm">
                  {flowData.due_at || flowData.start_due_at || flowData.due_date}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <BackButton variant="text" onClick={handleBack} className="flex-1" />
          <Button 
            onClick={handleSaveGoal} 
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save & set reminders'}
          </Button>
          <Button variant="outline" onClick={handleExit} size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  switch (currentStep) {
    case 'greeting':
      return renderGreeting();
    
    case 'timeframe':
      return renderTimeframe();
    
    case 'short_followup':
      return renderTextInput(
        'short_followup',
        "Great! What's the first small action you want to take?",
        "e.g., Send a quick 'hi' text to Sam",
        'first_action',
        'short_due'
      );
    
    case 'mid_followup':
      return renderTextInput(
        'mid_followup',
        "Okay, what milestone would show you're making progress?",
        "e.g., Apply to 3 internships",
        'milestone',
        'mid_due'
      );
    
    case 'long_followup':
      return renderTextInput(
        'long_followup',
        "Let's break this into smaller steps — what could you start with?",
        "e.g., Research one training program",
        'starter_step',
        'long_first_due'
      );
    
    case 'short_due':
      return renderDateTimePicker(
        'short_due',
        "When do you want to do this?",
        "Pick a time today or this week.",
        'due_at',
        ["today 6:00 PM", "tomorrow 10:00 AM", "this Friday 4:00 PM"],
        { min: "now", maxOffsetDays: 7 },
        'summary'
      );
    
    case 'mid_due':
      return renderDateTimePicker(
        'mid_due',
        "Target date for this milestone?",
        "Choose a date in the next 1–3 months.",
        'due_date',
        ["Next Friday", "End of this month", "In 6 weeks"],
        { minOffsetDays: 7, maxOffsetDays: 90 },
        'summary'
      );
    
    case 'long_first_due':
      return renderDateTimePicker(
        'long_first_due',
        "Pick a date to start your first small step.",
        "Tip: starting within the next 14 days helps momentum.",
        'start_due_at',
        ["tomorrow 10:00 AM", "this weekend", "next Monday"],
        { min: "now", maxOffsetDays: 14 },
        'summary'
      );
    
    case 'summary':
      return renderSummary();
    
    default:
      return renderGreeting();
  }
};