import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, addWeeks, isAfter, isBefore } from 'date-fns';
import { CalendarIcon, Clock, X, Sparkles, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { goalsService } from '@/services/goalsService';
import type { GoalDomain, GoalPriority } from '@/types';
import { OwnerSelector } from '@/components/ui/owner-selector';
import { getAvailableOwners, getDefaultOwner, shouldShowOwnerSelector, type OwnerOption } from '@/utils/ownerSelectionUtils';
import { SkillAssessmentWizard } from './skill-assessment-wizard';
import { progressiveMasteryService } from '@/services/progressiveMasteryService';
import { PermissionsService } from '@/services/permissionsService';
import { notificationsService } from '@/services/notificationsService';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface FlowData {
  goal_title?: string;
  timeframe?: 'short_term' | 'mid_term' | 'long_term';
  first_action?: string;
  milestone?: string;
  starter_step?: string;
  due_at?: string;
  due_date?: string;
  start_due_at?: string;
  goal_type?: 'habit' | 'progressive_mastery';
  skill_assessment?: {
    q1_familiarity: number;
    q2_confidence: number;
    q3_independence: number;
    calculated_level: number;
    level_label: string;
  };
  target_frequency?: number;
  smart_start_plan?: {
    suggested_initial: number;
    user_selected_initial: number;
    suggestion_accepted: boolean;
    rationale: string;
    phase_guidance: string;
  };
  teaching_helper?: {
    id: string;
    name: string;
    relationship: string;
  };
  duration_weeks?: number | null;
}

interface GoalCreationFlowV2Props {
  onComplete?: () => void;
  onExit?: () => void;
  draftGoalId?: string;
  mode?: 'full' | 'lite';
}

export const GoalCreationFlowV2: React.FC<GoalCreationFlowV2Props> = ({
  onComplete,
  onExit,
  draftGoalId,
  mode = 'full'
}) => {
  const [currentStep, setCurrentStep] = useState('greeting');
  const [flowData, setFlowData] = useState<FlowData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('18:00');
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [showOwnerSelector, setShowOwnerSelector] = useState(false);
  const { toast } = useToast();

  // Load available owners on mount
  useEffect(() => {
    const loadOwners = async () => {
      const availableOwners = await getAvailableOwners();
      const defaultOwner = await getDefaultOwner();
      const shouldShow = await shouldShowOwnerSelector();
      setOwners(availableOwners);
      setShowOwnerSelector(shouldShow);
      if (defaultOwner) {
        setSelectedOwnerId(defaultOwner);
      }
    };
    loadOwners();
  }, []);

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

  // Load draft goal if in lite mode
  useEffect(() => {
    if (draftGoalId && mode === 'lite') {
      const loadDraft = async () => {
        try {
          const goal = await goalsService.getGoal(draftGoalId);
          const metadata = goal.metadata || {};
          
          setFlowData({
            goal_title: goal.title,
            timeframe: metadata.timeframe || 'mid_term',
          });
          
          // Skip greeting, start at timeframe confirmation
          setCurrentStep('goal_type_selection');
        } catch (error) {
          console.error('Failed to load draft goal:', error);
        }
      };
      loadDraft();
    }
  }, [draftGoalId, mode]);

  const updateFlowData = (key: keyof FlowData, value: any) => {
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
    setCurrentStep('goal_type_selection');
  };

  const handleGoalEntryComplete = () => {
    if (!flowData.goal_title?.trim() || !flowData.goal_type) return;
    
    if (flowData.goal_type === 'progressive_mastery') {
      setCurrentStep('skill_assessment');
    } else {
      // Habit flow - go to scheduling
      setCurrentStep('habit_scheduling');
    }
  };

  const handleSaveGoal = async () => {
    setIsLoading(true);
    try {
      const title = flowData.goal_title || flowData.first_action || flowData.milestone || flowData.starter_step || 'Untitled Goal';
      const dueDate = flowData.due_at || flowData.start_due_at || flowData.due_date;
      
      const goalData = {
        title,
        description: `${flowData.timeframe?.replace('_', '-')} goal`,
        domain: 'general' as GoalDomain,
        priority: 'medium' as GoalPriority,
        due_date: dueDate,
        owner_id: selectedOwnerId
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

  const handleSavePMGoal = async () => {
    setIsLoading(true);
    try {
      const title = flowData.goal_title || flowData.first_action || flowData.milestone || flowData.starter_step || 'Untitled Goal';
      const startDate = new Date().toISOString().split('T')[0];
      const dueDate = flowData.duration_weeks 
        ? addWeeks(new Date(), flowData.duration_weeks).toISOString().split('T')[0]
        : null;
      
      const goalData = {
        title,
        description: `Progressive Mastery goal: ${title}`,
        domain: 'general' as GoalDomain,
        priority: 'medium' as GoalPriority,
        goal_type: 'progressive_mastery',
        frequency_per_week: flowData.smart_start_plan?.user_selected_initial || 3,
        duration_weeks: flowData.duration_weeks,
        start_date: startDate,
        due_date: dueDate,
        owner_id: selectedOwnerId
      };

      const goal = await goalsService.createGoal(goalData);
      
      // Save Progressive Mastery metadata
      if (flowData.skill_assessment) {
        await progressiveMasteryService.saveSkillAssessment(goal.id, {
          q1: flowData.skill_assessment.q1_familiarity,
          q2: flowData.skill_assessment.q2_confidence,
          q3: flowData.skill_assessment.q3_independence
        });
      }

      if (flowData.smart_start_plan) {
        await progressiveMasteryService.saveSmartStartPlan(
          goal.id,
          {
            suggested_initial: flowData.smart_start_plan.suggested_initial,
            target_frequency: flowData.target_frequency || 3,
            rationale: flowData.smart_start_plan.rationale,
            phase_guidance: flowData.smart_start_plan.phase_guidance
          },
          flowData.smart_start_plan.suggestion_accepted,
          flowData.smart_start_plan.user_selected_initial
        );
      }

      if (flowData.teaching_helper) {
        await progressiveMasteryService.saveTeachingHelper(
          goal.id,
          flowData.teaching_helper.id,
          flowData.teaching_helper.name,
          flowData.teaching_helper.relationship as 'parent' | 'teacher' | 'coach'
        );

        // Trigger notification to helper
        await notificationsService.createNotification({
          user_id: flowData.teaching_helper.id,
          type: 'teaching_helper_assigned',
          title: 'New Teaching Helper Role',
          message: `You've been assigned as a teaching helper for ${title}`,
          data: { goalId: goal.id }
        });
      }
      
      // Clear draft
      localStorage.removeItem('goal_creation_draft_v2');
      
      toast({
        title: "Progressive Mastery Goal Created! 🚀",
        description: "Your learning journey begins now!",
      });
      
      onComplete?.();
    } catch (error) {
      console.error('Failed to create PM goal:', error);
      toast({
        title: "Oops, something went wrong",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderGreeting = () => {
    const isLiteMode = mode === 'lite';
    const title = isLiteMode ? "Let's set up your goal" : "Welcome back 👋";
    const subtitle = isLiteMode 
      ? `We'll help you break down: "${flowData.goal_title}"`
      : "Let's set up your goal in a few quick steps. You can exit anytime — I'll save your progress.";

    return (
      <Card className="p-6 space-y-4">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
          
          {/* Owner Selection */}
          <OwnerSelector
            owners={owners}
            selectedOwnerId={selectedOwnerId}
            onOwnerChange={setSelectedOwnerId}
            alwaysShow={showOwnerSelector}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setCurrentStep('goal_entry')} 
            className="flex-1"
            disabled={!selectedOwnerId}
          >
            Let's start
          </Button>
          <Button variant="outline" onClick={handleExit} size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  const renderGoalEntry = () => {
    const [localTitle, setLocalTitle] = useState(flowData.goal_title || '');

    return (
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">What do you want to achieve?</h2>
            <p className="text-sm text-muted-foreground">
              Describe your goal in a few words
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="goal-title">Your goal</Label>
            <Textarea
              id="goal-title"
              placeholder="e.g., Learn to play piano, Practice skateboarding, Get better at cooking"
              value={localTitle}
              onChange={(e) => {
                setLocalTitle(e.target.value);
                updateFlowData('goal_title', e.target.value);
              }}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <Label>How familiar are you with this activity?</Label>
            
            {/* Option 1: Habit */}
            <Card 
              className={cn(
                "cursor-pointer hover:shadow-md transition-all border-2",
                flowData.goal_type === 'habit' 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )} 
              onClick={() => updateFlowData('goal_type', 'habit')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {flowData.goal_type === 'habit' && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-2xl">🔄</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">Yes, I already know how to do this</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Track consistency and build a routine
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Option 2: Progressive Mastery */}
            <Card 
              className={cn(
                "cursor-pointer hover:shadow-md transition-all border-2 relative",
                flowData.goal_type === 'progressive_mastery' 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )} 
              onClick={() => updateFlowData('goal_type', 'progressive_mastery')}
            >
              <Badge className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                Recommended for learning
              </Badge>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {flowData.goal_type === 'progressive_mastery' && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-2xl">🎯</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">No, I'm learning or improving this skill</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Track your progress from beginner to independent
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex gap-2">
          <BackButton variant="text" onClick={() => setCurrentStep('greeting')} className="flex-1" />
          <Button 
            onClick={handleGoalEntryComplete} 
            className="flex-1"
            disabled={!localTitle.trim() || !flowData.goal_type}
          >
            Continue
          </Button>
          <Button variant="outline" onClick={handleExit} size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  const renderTextInput = (stepId: string, prompt: string, placeholder: string, saveKey: keyof FlowData, nextStep: string) => {
    const savedValue = flowData[saveKey];
    const [inputValue, setInputValue] = useState(typeof savedValue === 'string' ? savedValue : '');

    const handleNext = () => {
      if (inputValue.trim()) {
        updateFlowData(saveKey, inputValue.trim());
        setCurrentStep(nextStep);
      }
    };

    const handleBack = () => {
      if (stepId === 'short_followup' || stepId === 'mid_followup' || stepId === 'long_followup') {
        setCurrentStep('goal_type_selection');
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

  const renderHabitScheduling = () => (
    <Card className="p-6 space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-medium">When would you like to work on this?</h3>
        <p className="text-sm text-muted-foreground">
          Choose a target date or time to get started
        </p>
        
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => {
              const dateTime = new Date();
              dateTime.setHours(18, 0, 0, 0);
              updateFlowData('due_at', dateTime.toISOString());
              setCurrentStep('habit_summary');
            }}
          >
            <div className="text-left">
              <div className="font-medium">Today at 6:00 PM</div>
              <div className="text-sm text-muted-foreground">Start right away</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => {
              const dateTime = addDays(new Date(), 1);
              dateTime.setHours(10, 0, 0, 0);
              updateFlowData('due_at', dateTime.toISOString());
              setCurrentStep('habit_summary');
            }}
          >
            <div className="text-left">
              <div className="font-medium">Tomorrow at 10:00 AM</div>
              <div className="text-sm text-muted-foreground">Give yourself a day to prepare</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto p-4"
            onClick={() => {
              const dateTime = addDays(new Date(), 7);
              dateTime.setHours(9, 0, 0, 0);
              updateFlowData('due_at', dateTime.toISOString());
              setCurrentStep('habit_summary');
            }}
          >
            <div className="text-left">
              <div className="font-medium">Next week</div>
              <div className="text-sm text-muted-foreground">Plan ahead</div>
            </div>
          </Button>
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
                  disabled={(date) => isBefore(date, new Date())}
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
            onClick={() => {
              if (selectedDate) {
                const dateTimeString = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`;
                updateFlowData('due_at', dateTimeString);
                setCurrentStep('habit_summary');
              }
            }}
            className="w-full"
            disabled={!selectedDate}
          >
            Set this time
          </Button>
        </div>
      </div>
      
      <div className="flex gap-2">
        <BackButton variant="text" onClick={() => setCurrentStep('goal_entry')} className="flex-1" />
        <Button variant="outline" onClick={handleExit} size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  const renderHabitSummary = () => (
    <Card className="p-6 space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Confirm your plan</h3>
        
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <div>
            <span className="text-sm font-medium">Goal: </span>
            <span className="text-sm">{flowData.goal_title}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Type:</span>
            <Badge variant="secondary">Habit Goal</Badge>
          </div>
          
          {flowData.due_at && (
            <div>
              <span className="text-sm font-medium">Start: </span>
              <span className="text-sm">
                {format(new Date(flowData.due_at), 'MMM dd, yyyy \'at\' h:mm a')}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <BackButton variant="text" onClick={() => setCurrentStep('habit_scheduling')} className="flex-1" />
        <Button 
          onClick={handleSaveGoal} 
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Goal'}
        </Button>
        <Button variant="outline" onClick={handleExit} size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  const renderSkillAssessment = () => (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <SkillAssessmentWizard
        goalTitle={flowData.goal_title || flowData.first_action || flowData.milestone || flowData.starter_step || 'this skill'}
        onComplete={(assessment) => {
          updateFlowData('skill_assessment', {
            q1_familiarity: assessment.q1_familiarity,
            q2_confidence: assessment.q2_confidence,
            q3_independence: assessment.q3_independence,
            calculated_level: assessment.calculated_level,
            level_label: assessment.level_label
          });
          setCurrentStep('target_frequency');
        }}
        onBack={() => setCurrentStep('goal_entry')}
      />
    </div>
  );


  const renderTargetFrequency = () => (
    <Card className="p-6 space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-medium">
          How often would you eventually like to practice this?
        </h3>
        <p className="text-sm text-muted-foreground">
          Don't worry, we'll start slower and build up gradually!
        </p>
        
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(freq => (
            <Button
              key={freq}
              variant={flowData.target_frequency === freq ? 'default' : 'outline'}
              onClick={() => {
                updateFlowData('target_frequency', freq);
              }}
              className="h-16 flex flex-col items-center justify-center"
            >
              <span className="text-2xl font-bold">{freq}</span>
              <span className="text-xs">day{freq > 1 ? 's' : ''}/wk</span>
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2">
        <BackButton onClick={() => setCurrentStep('skill_assessment')} />
        <Button 
          onClick={() => setCurrentStep('smart_start_suggestion')} 
          className="flex-1"
          disabled={!flowData.target_frequency}
        >
          Next
        </Button>
        <Button variant="outline" onClick={handleExit} size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  const renderSmartStartSuggestion = () => {
    const [customFrequency, setCustomFrequency] = useState<number>();
    const [accepted, setAccepted] = useState(false);
    
    const suggestion = progressiveMasteryService.suggestStartFrequency(
      flowData.skill_assessment?.calculated_level || 1,
      flowData.target_frequency || 3
    );

    const selectedFrequency = customFrequency || suggestion.suggested_initial;

    return (
      <Card className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Your Smart Start Plan</h3>
            <Badge variant="secondary">
              {flowData.skill_assessment?.level_label || 'Beginner'} Level
            </Badge>
          </div>

          <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">We recommend starting with</p>
                <p className="text-3xl font-bold text-primary">
                  {suggestion.suggested_initial}x per week
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            
            <p className="text-sm">{suggestion.rationale}</p>
            <p className="text-sm text-muted-foreground">{suggestion.phase_guidance}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setAccepted(true);
                setCustomFrequency(undefined);
              }}
              variant={accepted && !customFrequency ? 'default' : 'outline'}
              className="w-full"
            >
              ✓ Accept Suggestion ({suggestion.suggested_initial}x/week)
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or customize</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(freq => (
                <Button
                  key={freq}
                  variant={customFrequency === freq ? 'default' : 'outline'}
                  onClick={() => {
                    setCustomFrequency(freq);
                    setAccepted(false);
                  }}
                  className="h-12"
                >
                  {freq}x
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <BackButton onClick={() => setCurrentStep('target_frequency')} />
          <Button 
            onClick={() => {
              const plan = {
                suggested_initial: suggestion.suggested_initial,
                user_selected_initial: selectedFrequency,
                suggestion_accepted: accepted,
                rationale: suggestion.rationale,
                phase_guidance: suggestion.phase_guidance
              };
              updateFlowData('smart_start_plan', plan);
              setCurrentStep('teaching_helper');
            }}
            className="flex-1"
          >
            Continue with {selectedFrequency}x/week
          </Button>
          <Button variant="outline" onClick={handleExit} size="icon">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  };

  const renderTeachingHelper = () => {
    const [selectedHelper, setSelectedHelper] = useState<string | null>(
      flowData.teaching_helper?.id || null
    );
    const [supporters, setSupporters] = useState<any[]>([]);
    const [supporterProfiles, setSupporterProfiles] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadSupporters = async () => {
        try {
          const supportersList = await PermissionsService.getSupporters(selectedOwnerId);
          setSupporters(supportersList);

          // Load profiles for supporters
          const profiles: Record<string, any> = {};
          for (const supporter of supportersList) {
            const { data } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('id', supporter.supporter_id)
              .single();
            if (data) {
              profiles[supporter.supporter_id] = data;
            }
          }
          setSupporterProfiles(profiles);
        } catch (error) {
          console.error('Failed to load supporters:', error);
        } finally {
          setLoading(false);
        }
      };
      loadSupporters();
    }, [selectedOwnerId]);

    return (
      <Card className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Who can help you learn this skill?</h3>
            <p className="text-sm text-muted-foreground">
              Choose someone who will guide and support your progress
            </p>
          </div>

          <div className="space-y-2">
            <Button
              variant={selectedHelper === 'none' ? 'default' : 'outline'}
              className="w-full justify-start h-auto p-4"
              onClick={() => setSelectedHelper('none')}
            >
              <div className="text-left">
                <div className="font-medium">🦸 On my own</div>
                <div className="text-sm text-muted-foreground">
                  I'll practice independently
                </div>
              </div>
            </Button>

            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading helpers...
              </div>
            ) : supporters.length > 0 ? (
              supporters.map(supporter => (
                <Button
                  key={supporter.id}
                  variant={selectedHelper === supporter.supporter_id ? 'default' : 'outline'}
                  className="w-full justify-start h-auto p-4"
                  onClick={() => setSelectedHelper(supporter.supporter_id)}
                >
                  <div className="text-left">
                    <div className="font-medium">
                      👤 {supporterProfiles[supporter.supporter_id]?.display_name || 
                           supporterProfiles[supporter.supporter_id]?.email || 
                           'Helper'}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {supporter.role}
                    </div>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No helpers available. You can add supporters later.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <BackButton onClick={() => setCurrentStep('smart_start_suggestion')} />
          <Button 
            onClick={() => {
              if (selectedHelper && selectedHelper !== 'none') {
                const supporter = supporters.find(s => s.supporter_id === selectedHelper);
                updateFlowData('teaching_helper', {
                  id: selectedHelper,
                  name: supporterProfiles[selectedHelper]?.display_name || 
                        supporterProfiles[selectedHelper]?.email || 
                        'Helper',
                  relationship: supporter?.role || 'supporter'
                });
              } else {
                updateFlowData('teaching_helper', undefined);
              }
              setCurrentStep('duration');
            }}
            className="flex-1"
            disabled={!selectedHelper}
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

  const renderDuration = () => (
    <Card className="p-6 space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">How long do you want to practice?</h3>
          <p className="text-sm text-muted-foreground">
            Choose a duration that gives you time to build mastery
          </p>
        </div>

        <div className="space-y-2">
          {[
            { weeks: 8, label: '8 weeks', description: 'Short intensive practice' },
            { weeks: 12, label: '12 weeks', description: 'Recommended for most skills' },
            { weeks: 16, label: '16 weeks', description: 'Extended deep practice' },
            { weeks: null, label: 'Ongoing', description: 'No end date, practice indefinitely' }
          ].map(option => (
            <Button
              key={option.weeks || 'ongoing'}
              variant={flowData.duration_weeks === option.weeks ? 'default' : 'outline'}
              className="w-full justify-start h-auto p-4"
              onClick={() => updateFlowData('duration_weeks', option.weeks)}
            >
              <div className="text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <BackButton onClick={() => setCurrentStep('teaching_helper')} />
        <Button 
          onClick={() => setCurrentStep('pm_summary')}
          className="flex-1"
          disabled={flowData.duration_weeks === undefined}
        >
          Next
        </Button>
        <Button variant="outline" onClick={handleExit} size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  const renderPMSummary = () => (
    <Card className="p-6 space-y-4">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Review Your Progressive Mastery Goal</h3>
        
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div>
            <span className="text-sm font-medium">Goal: </span>
            <span className="text-sm">{flowData.goal_title || flowData.first_action || flowData.milestone || flowData.starter_step}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Skill Level:</span>
            <Badge variant="secondary">
              {flowData.skill_assessment?.level_label || 'Beginner'}
            </Badge>
          </div>

          <div>
            <span className="text-sm font-medium">Starting Frequency: </span>
            <span className="text-sm">{flowData.smart_start_plan?.user_selected_initial}x per week</span>
          </div>

          <div>
            <span className="text-sm font-medium">Target Frequency: </span>
            <span className="text-sm">{flowData.target_frequency}x per week</span>
          </div>

          {flowData.teaching_helper && (
            <div>
              <span className="text-sm font-medium">Teaching Helper: </span>
              <span className="text-sm">{flowData.teaching_helper.name}</span>
            </div>
          )}

          <div>
            <span className="text-sm font-medium">Duration: </span>
            <span className="text-sm">
              {flowData.duration_weeks ? `${flowData.duration_weeks} weeks` : 'Ongoing'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <BackButton onClick={() => setCurrentStep('duration')} />
        <Button 
          onClick={handleSavePMGoal}
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Goal'}
        </Button>
        <Button variant="outline" onClick={handleExit} size="icon">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  switch (currentStep) {
    case 'greeting':
      return renderGreeting();
    
    case 'goal_entry':
      return renderGoalEntry();
    
    // Habit flow
    case 'habit_scheduling':
      return renderHabitScheduling();
    
    case 'habit_summary':
      return renderHabitSummary();
    
    // Progressive Mastery flow
    case 'skill_assessment':
      return renderSkillAssessment();
    
    case 'target_frequency':
      return renderTargetFrequency();
    
    case 'smart_start_suggestion':
      return renderSmartStartSuggestion();
    
    case 'teaching_helper':
      return renderTeachingHelper();
    
    case 'duration':
      return renderDuration();
    
    case 'pm_summary':
      return renderPMSummary();
    
    // Existing habit flow
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