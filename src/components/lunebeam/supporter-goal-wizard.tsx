import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, addWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, HandHelping, Sparkles } from 'lucide-react';
import { goalsService, stepsService } from '@/services/goalsService';
import { supabase } from '@/integrations/supabase/client';
import { generateMicroStepsSmart, type MicroStep } from '@/services/microStepsGenerator';
import type { GoalDomain } from '@/types';

interface SupporterGoalWizardProps {
  onComplete: (goalData: any) => void;
  onCancel: () => void;
  initialIndividualId?: string;
}

interface SupporterMicroStep {
  title: string;
  description: string;
}

interface WizardData {
  supportedPersonId: string;
  supportedPersonName: string;
  goalTitle: string;
  category: string;
  goalMotivation: string;
  goalType: string;
  challengeAreas: string[];
  customPrerequisites: string;
  startDate: Date;
  endDate?: Date;
  frequency: number;
  timeOfDay: string;
  customTime: string;
  supporterRole: string;
}

// Keep same categories and options from original wizard
const categories = [
  { id: 'health', title: 'Health & Well Being', emoji: '🌱' },
  { id: 'education', title: 'Education - High School', emoji: '📘' },
  { id: 'employment', title: 'Employment', emoji: '💼' },
  { id: 'independent_living', title: 'Independent Living', emoji: '🏠' },
  { id: 'social_skills', title: 'Social / Self-Advocacy', emoji: '🗣️' },
  { id: 'postsecondary', title: 'Postsecondary - Learning After HS', emoji: '🎓' },
  { id: 'fun_recreation', title: 'Fun / Recreation', emoji: '🎉' }
];

const motivations = [
  { id: 'independence', label: 'Focus on Independence', description: 'Build their self-reliance' },
  { id: 'confidence', label: 'Build Confidence', description: 'Help them believe in themselves' },
  { id: 'future_skill', label: 'Future Skill', description: 'Prepare for what comes next' },
  { id: 'enjoyment', label: 'Enjoyment', description: 'Make it fun and engaging' }
];

const supporterRoles = [
  { id: 'cheerleader', label: 'Cheerleader', emoji: '📣', description: 'Provide encouragement and celebration' },
  { id: 'accountability_partner', label: 'Accountability Partner', emoji: '🛡️', description: 'Regular check-ins to stay on track' },
  { id: 'hands_on_helper', label: 'Hands-on Helper', emoji: '🤝', description: 'Direct assistance when needed' },
  { id: 'active_coworking', label: 'Active Co-working', emoji: '👥', description: 'Work side-by-side with them' },
  { id: 'proximity', label: 'Proximity', emoji: '👀', description: 'Be nearby without direct involvement' }
];

const frequencies = [
  { id: 'daily', label: 'Daily', value: 7 },
  { id: 'weekdays', label: 'Weekdays only', value: 5 },
  { id: 'three_times', label: '3 times per week', value: 3 },
  { id: 'twice', label: '2 times per week', value: 2 },
  { id: 'weekly', label: 'Once per week', value: 1 }
];

export const SupporterGoalWizard: React.FC<SupporterGoalWizardProps> = ({
  onComplete,
  onCancel,
  initialIndividualId
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    supportedPersonId: initialIndividualId || '',
    supportedPersonName: '',
    goalTitle: '',
    category: '',
    goalMotivation: '',
    goalType: 'reminder',
    challengeAreas: [],
    customPrerequisites: '',
    startDate: new Date(),
    frequency: 3,
    timeOfDay: 'afternoon',
    customTime: '18:00',
    supporterRole: 'cheerleader'
  });
  const [supportedPeople, setSupportedPeople] = useState<any[]>([]);
  const [individualSteps, setIndividualSteps] = useState<MicroStep[]>([]);
  const [supporterSteps, setSupporterSteps] = useState<SupporterMicroStep[]>([]);
  const [generatingSteps, setGeneratingSteps] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSupportedPeople();
  }, []);

  useEffect(() => {
    if (data.supportedPersonId) {
      const person = supportedPeople.find(p => p.id === data.supportedPersonId);
      if (person) {
        updateData({ supportedPersonName: person.name });
      }
    }
  }, [data.supportedPersonId, supportedPeople]);

  const loadSupportedPeople = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: supporters } = await supabase
        .from('supporters')
        .select('individual_id')
        .eq('supporter_id', user.id);

      if (supporters && supporters.length > 0) {
        const individualIds = supporters.map(s => s.individual_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, avatar_url')
          .in('user_id', individualIds);

        if (profiles) {
          setSupportedPeople(
            profiles.map(p => ({ id: p.user_id, name: p.first_name, avatar_url: p.avatar_url }))
          );
        }
      }
    } catch (error) {
      console.error('Error loading supported people:', error);
    }
  };

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = async () => {
    // Generate steps when moving from step 7 to step 8
    if (currentStep === 7) {
      await generateBothStepSets();
    }

    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const generateBothStepSets = async () => {
    setGeneratingSteps(true);
    try {
      // Generate individual steps
      const individualMicroSteps = await generateMicroStepsSmart(data as any, 'supporter');
      setIndividualSteps(individualMicroSteps);

      // Generate supporter steps via edge function
      const { data: supporterData, error } = await supabase.functions.invoke(
        'supporter-microsteps-scaffold',
        {
          body: {
            individualName: data.supportedPersonName,
            prerequisiteDetail: data.customPrerequisites || 'necessary tools',
            primaryMotivation: data.goalMotivation || 'independence',
            startTime: data.customTime || '18:00',
            startDay: format(data.startDate, 'EEEE'),
            supporterRole: data.supporterRole,
            goalTitle: data.goalTitle
          }
        }
      );

      if (error) throw error;
      setSupporterSteps(supporterData.supporterSteps || []);

    } catch (error) {
      console.error('Error generating steps:', error);
      toast({
        title: "Using fallback templates",
        description: "Could not personalize all steps.",
        variant: "default"
      });
    } finally {
      setGeneratingSteps(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const goalData = {
        title: data.goalTitle,
        description: `Goal for ${data.supportedPersonName} in ${data.category}`,
        domain: mapCategoryToDomain(data.category),
        owner_id: data.supportedPersonId,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
        due_date: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : undefined,
        priority: 'medium' as const,
        status: 'active' as const,
        frequency_per_week: data.frequency,
        duration_weeks: data.endDate ?
          Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) :
          4
      };

      const createdGoal = await goalsService.createGoal(goalData);

      // Create individual steps
      for (const step of individualSteps) {
        await stepsService.createStep(createdGoal.id, {
          title: step.title,
          notes: step.description,
          step_type: 'action',
          is_required: true,
          is_planned: true
        });
      }

      // Create supporter steps
      for (const step of supporterSteps) {
        await stepsService.createStep(createdGoal.id, {
          title: step.title,
          notes: step.description,
          step_type: 'scaffolding',
          is_required: true,
          is_planned: true
        });
      }

      toast({
        title: `Goal assigned to ${data.supportedPersonName}! 🎯`,
        description: 'Both individual and support steps created.'
      });

      onComplete(goalData);
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const mapCategoryToDomain = (category: string): GoalDomain => {
    const mapping: Record<string, GoalDomain> = {
      'health': 'health',
      'education': 'education',
      'employment': 'employment',
      'independent_living': 'independent_living',
      'social_skills': 'social_skills',
      'postsecondary': 'postsecondary',
      'fun_recreation': 'fun_recreation'
    };
    return mapping[category] || 'other';
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
        <div
          key={step}
          className={cn(
            "h-2 rounded-full transition-all",
            step <= currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
          )}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{data.supportedPersonName ? `Who is this goal for: ${data.supportedPersonName}?` : 'Who is this goal for?'}</CardTitle>
        <p className="text-muted-foreground">Select the person you're supporting</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={data.supportedPersonId} onValueChange={(v) => updateData({ supportedPersonId: v })}>
          {supportedPeople.map((person) => (
            <div key={person.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
              <RadioGroupItem value={person.id} id={person.id} />
              <Label htmlFor={person.id} className="flex-1 cursor-pointer">
                <div className="font-medium">{person.name}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">
          {`What is the one clear, observable action ${data.supportedPersonName || "[Individual's Name]"} needs to establish?`}
        </CardTitle>
        <p className="text-muted-foreground">Describe the goal in a few words</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Goal Title</Label>
          <Input
            placeholder="e.g., Complete homework every day"
            value={data.goalTitle}
            onChange={(e) => updateData({ goalTitle: e.target.value })}
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={data.category} onValueChange={(v) => updateData({ category: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">Why does this matter to them?</CardTitle>
        <p className="text-muted-foreground">What's their primary motivation?</p>
      </CardHeader>
      <CardContent>
        <RadioGroup value={data.goalMotivation} onValueChange={(v) => updateData({ goalMotivation: v })}>
          <div className="space-y-3">
            {motivations.map((motivation) => (
              <div key={motivation.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value={motivation.id} id={motivation.id} />
                <Label htmlFor={motivation.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{motivation.label}</div>
                  <div className="text-sm text-muted-foreground">{motivation.description}</div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">What do they need to get started?</CardTitle>
        <p className="text-muted-foreground">What materials, space, or prerequisites are needed?</p>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="e.g., A quiet workspace with desk and laptop, completed math textbook chapter 3"
          value={data.customPrerequisites}
          onChange={(e) => updateData({ customPrerequisites: e.target.value })}
          rows={4}
        />
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">When should they start?</CardTitle>
        <p className="text-muted-foreground">Set the timeline for this goal</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(data.startDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={data.startDate}
                onSelect={(date) => date && updateData({ startDate: date, endDate: addWeeks(date, 4) })}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label>How often per week?</Label>
          <Select value={data.frequency.toString()} onValueChange={(v) => updateData({ frequency: parseInt(v) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((freq) => (
                <SelectItem key={freq.id} value={freq.value.toString()}>
                  {freq.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep6 = () => (
    <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">What time works best?</CardTitle>
        <p className="text-muted-foreground">When should they typically work on this?</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Preferred Time</Label>
          <Input
            type="time"
            value={data.customTime}
            onChange={(e) => updateData({ customTime: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep7 = () => (
    <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">How will you support them?</CardTitle>
        <p className="text-muted-foreground">Choose your supporter role</p>
      </CardHeader>
      <CardContent>
        <RadioGroup value={data.supporterRole} onValueChange={(v) => updateData({ supporterRole: v })}>
          <div className="space-y-3">
            {supporterRoles.map((role) => (
              <div key={role.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value={role.id} id={role.id} />
                <Label htmlFor={role.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{role.emoji} {role.label}</div>
                  <div className="text-sm text-muted-foreground">{role.description}</div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );

  const renderStep8 = () => (
    <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">Review and Confirm</CardTitle>
        <p className="text-muted-foreground">
          Both {data.supportedPersonName}'s steps and your support actions
        </p>
      </CardHeader>
      <CardContent className="space-y-6 overflow-y-auto max-h-[500px]">
        {generatingSteps ? (
          <div className="flex items-center justify-center py-8">
            <Sparkles className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Generating personalized steps...</span>
          </div>
        ) : (
          <>
            {/* Individual's Steps */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">
                {data.supportedPersonName}'s Steps
              </h4>
              <div className="space-y-2">
                {individualSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="w-7 h-7 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-purple-700">{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-medium text-purple-900">{step.title}</span>
                      <p className="text-xs text-purple-700">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supporter's Steps */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <HandHelping className="h-5 w-5 text-blue-500" />
                Your Support Actions
              </h4>
              <div className="space-y-2">
                {supporterSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-blue-700">{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-sm font-medium text-blue-900">{step.title}</span>
                      <p className="text-xs text-blue-700">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      default: return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.supportedPersonId !== '';
      case 2: return data.goalTitle !== '' && data.category !== '';
      case 3: return data.goalMotivation !== '';
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return data.supporterRole !== '';
      case 8: return individualSteps.length > 0 && supporterSteps.length > 0 && !generatingSteps;
      default: return true;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-none px-4 pt-4">
        {renderStepIndicator()}
      </div>

      <div className="flex-1 overflow-y-auto">
        {renderCurrentStep()}
      </div>

      <div className="flex-none border-t bg-background p-4">
        <div className="flex justify-between gap-4">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}

          {currentStep < 8 ? (
            <Button onClick={nextStep} disabled={!canProceed() || generatingSteps}>
              {generatingSteps ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || loading}>
              {loading ? 'Creating...' : 'Create Goal'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
