import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, User, Users, Target, Calendar, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { goalsService, stepsService } from '@/services/goalsService';
import { goalProposalsService } from '@/services/goalProposalsService';
import { PermissionsService } from '@/services/permissionsService';
import { supabase } from '@/integrations/supabase/client';

interface GoalCreationWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
  initialIndividualId?: string;
}

interface WizardData {
  forWhom: 'self' | 'other';
  individualId?: string;
  individualName?: string;
  title: string;
  category: string;
  outcome: string;
  timelineStart?: string;
  timelineEnd?: string;
  frequency?: number;
  rationale?: string;
}

interface Individual {
  id: string;
  name: string;
}

const categories = [
  { value: 'Independent Living', label: 'Independent Living', icon: '🏠' },
  { value: 'Education', label: 'Education', icon: '📚' },
  { value: 'Social Skills', label: 'Social Skills', icon: '👥' },
  { value: 'Recreation & Fun', label: 'Recreation & Fun', icon: '🎮' },
  { value: 'Employment', label: 'Employment', icon: '💼' },
  { value: 'Health & Wellness', label: 'Health & Wellness', icon: '💪' },
  { value: 'Self-Advocacy', label: 'Self-Advocacy', icon: '🗣️' },
  { value: 'Other', label: 'Other', icon: '✨' }
];

export const GoalCreationWizard: React.FC<GoalCreationWizardProps> = ({
  onComplete,
  onCancel,
  initialIndividualId
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    forWhom: initialIndividualId ? 'other' : 'self',
    individualId: initialIndividualId,
    title: '',
    category: '',
    outcome: '',
    frequency: 3
  });
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [loading, setLoading] = useState(false);
  const [canAssignDirectly, setCanAssignDirectly] = useState(false);
  const { toast } = useToast();

  // Load supported individuals on mount
  useEffect(() => {
    loadSupportedIndividuals();
  }, []);

  // Check permissions when individual is selected
  useEffect(() => {
    if (data.individualId && data.forWhom === 'other') {
      checkAssignPermission();
    }
  }, [data.individualId, data.forWhom]);

  const loadSupportedIndividuals = async () => {
    try {
      const { data: supporters, error } = await supabase
        .from('supporters')
        .select(`
          individual_id,
          profiles!supporters_individual_id_fkey(first_name)
        `)
        .eq('supporter_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      const individualsList = (supporters || []).map(s => ({
        id: s.individual_id,
        name: (s as any).profiles?.first_name || 'Unknown'
      }));

      setIndividuals(individualsList);

      // If we have an initial individual ID, set the name
      if (initialIndividualId && individualsList.length > 0) {
        const individual = individualsList.find(i => i.id === initialIndividualId);
        if (individual) {
          setData(prev => ({ ...prev, individualName: individual.name }));
        }
      }
    } catch (error) {
      console.error('Failed to load individuals:', error);
    }
  };

  const checkAssignPermission = async () => {
    if (!data.individualId) return;

    try {
      const canAssign = await PermissionsService.checkPermission(
        data.individualId,
        'create_goals'
      );
      setCanAssignDirectly(canAssign);
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setCanAssignDirectly(false);
    }
  };

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (data.forWhom === 'self' || canAssignDirectly) {
        // Create goal directly
        const goalData = {
          title: data.title,
          description: data.outcome,
          domain: data.category.toLowerCase().replace(/\s+/g, '-') as any,
          start_date: data.timelineStart,
          due_date: data.timelineEnd,
          frequency_per_week: data.frequency
        };

        const goal = await goalsService.createGoal(goalData);
        
        // Create starter steps for the goal
        const stepCount = Math.min(data.frequency || 3, 3);
        const effortMinutes = data.title.match(/(\d+)\s*min/i)?.[1] || '30';
        
        try {
          for (let i = 1; i <= stepCount; i++) {
            await stepsService.createStep(goal.id, {
              title: `Week 1, Session ${i}: ${data.title}`,
              step_type: 'habit',
              is_required: true,
              estimated_effort_min: parseInt(effortMinutes),
              is_planned: true
            });
          }
        } catch (stepError) {
          console.error('Failed to create starter steps:', stepError);
          // Don't block goal creation if steps fail
          if (data.forWhom === 'other') {
            toast({
              title: `Goal assigned to ${data.individualName}!`,
              description: 'Steps will appear when they open the goal.',
            });
            setLoading(false);
            return;
          }
        }
        
        toast({
          title: data.forWhom === 'self' ? 'Goal created!' : `Goal assigned to ${data.individualName}!`,
          description: 'Ready to start making progress! 🎯'
        });
      } else {
        // Create proposal
        await goalProposalsService.createProposal({
          individual_id: data.individualId!,
          title: data.title,
          description: data.outcome,
          category: data.category,
          outcome: data.outcome,
          timeline_start: data.timelineStart,
          timeline_end: data.timelineEnd,
          frequency_per_week: data.frequency,
          rationale: data.rationale
        });

        toast({
          title: 'Proposal submitted!',
          description: `Sent for review by ${data.individualName}'s admins. 📝`
        });
      }

      onComplete?.();
    } catch (error) {
      console.error('Failed to submit:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <User className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Who is this goal for?</h2>
        <p className="text-muted-foreground text-sm">Choose who will be working on this goal</p>
      </div>

      <div className="space-y-3">
        <Button
          variant={data.forWhom === 'self' ? 'default' : 'outline'}
          className="w-full justify-start h-auto p-4"
          onClick={() => updateData({ forWhom: 'self' })}
        >
          <div className="flex items-center gap-3">
            <User className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Myself</div>
              <div className="text-sm text-muted-foreground">Create a personal goal</div>
            </div>
          </div>
        </Button>

        <div className="space-y-2">
          <Button
            variant={data.forWhom === 'other' ? 'default' : 'outline'}
            className="w-full justify-start h-auto p-4"
            onClick={() => updateData({ forWhom: 'other' })}
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Someone I support</div>
                <div className="text-sm text-muted-foreground">Create or suggest a goal for them</div>
              </div>
            </div>
          </Button>

          {data.forWhom === 'other' && !initialIndividualId && (
            <div className="ml-8 mt-2">
              <Select
                value={data.individualId || ''}
                onValueChange={(value) => {
                  const individual = individuals.find(i => i.id === value);
                  updateData({ 
                    individualId: value,
                    individualName: individual?.name
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {individuals.map(individual => (
                    <SelectItem key={individual.id} value={individual.id}>
                      {individual.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {data.forWhom === 'other' && data.individualName && (
            <div className="ml-8 mt-2">
              <Badge variant="secondary" className="text-sm">
                Creating for {data.individualName}
              </Badge>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={nextStep}
          disabled={data.forWhom === 'other' && !data.individualId}
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Goal basics</h2>
        <p className="text-muted-foreground text-sm">What do you want to achieve?</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Goal title *</Label>
          <Input
            id="title"
            placeholder="e.g., Learn to cook basic meals"
            value={data.title}
            onChange={(e) => updateData({ title: e.target.value })}
            maxLength={80}
          />
          <div className="text-xs text-muted-foreground text-right">
            {data.title.length}/80 characters
          </div>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(category => (
              <Button
                key={category.value}
                variant={data.category === category.value ? 'default' : 'outline'}
                className="justify-start h-auto p-3"
                onClick={() => updateData({ category: category.value })}
              >
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span className="text-xs">{category.label}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="outcome">Outcome (SMART format) *</Label>
          <Textarea
            id="outcome"
            placeholder="What specific outcome will show success? Be specific about what, when, and how much."
            value={data.outcome}
            onChange={(e) => updateData({ outcome: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Make it Specific, Measurable, Achievable, Relevant, and Time-bound
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button 
          onClick={nextStep}
          disabled={!data.title.trim() || !data.category || !data.outcome.trim()}
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Timeline & effort</h2>
        <p className="text-muted-foreground text-sm">When and how often?</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start date</Label>
            <Input
              id="start-date"
              type="date"
              value={data.timelineStart || ''}
              onChange={(e) => updateData({ timelineStart: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Target completion</Label>
            <Input
              id="end-date"
              type="date"
              value={data.timelineEnd || ''}
              onChange={(e) => updateData({ timelineEnd: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency (times per week)</Label>
          <Select
            value={data.frequency?.toString() || ''}
            onValueChange={(value) => updateData({ frequency: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="How often?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 time per week</SelectItem>
              <SelectItem value="2">2 times per week</SelectItem>
              <SelectItem value="3">3 times per week</SelectItem>
              <SelectItem value="4">4 times per week</SelectItem>
              <SelectItem value="5">5 times per week</SelectItem>
              <SelectItem value="7">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <strong>Effort preview:</strong> {data.frequency || 3} times per week
            {data.timelineStart && data.timelineEnd && (
              <span> from {new Date(data.timelineStart).toLocaleDateString()} to {new Date(data.timelineEnd).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={nextStep}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  const renderStep4 = () => {
    const isProposal = data.forWhom === 'other' && !canAssignDirectly;

    return (
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Review & {isProposal ? 'submit' : 'assign'}</h2>
          <p className="text-muted-foreground text-sm">
            {isProposal ? `You're proposing a goal for ${data.individualName}` : 'Confirm your goal details'}
          </p>
        </div>

        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium">For:</span>
            <span className="text-sm">
              {data.forWhom === 'self' ? 'Myself' : data.individualName}
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium">Goal:</span>
            <span className="text-sm text-right max-w-xs">{data.title}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium">Category:</span>
            <Badge variant="secondary">{data.category}</Badge>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium">Frequency:</span>
            <span className="text-sm">{data.frequency} times per week</span>
          </div>
          {data.timelineStart && data.timelineEnd && (
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium">Timeline:</span>
              <span className="text-sm">
                {new Date(data.timelineStart).toLocaleDateString()} - {new Date(data.timelineEnd).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {isProposal && (
          <div className="space-y-2">
            <Label htmlFor="rationale">Why this helps *</Label>
            <Textarea
              id="rationale"
              placeholder="Explain why this goal would be beneficial..."
              value={data.rationale || ''}
              onChange={(e) => updateData({ rationale: e.target.value })}
              rows={3}
            />
          </div>
        )}

        <div className="space-y-3">
          {isProposal && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ This will be sent as a proposal. Admins review proposals and you'll be notified when it's approved.
              </p>
            </div>
          )}

          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ {isProposal ? 'Proposals don\'t earn points until approved' : 'Assigned goals earn points right away'}
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || (isProposal && !data.rationale?.trim())}
          >
            {loading ? 'Submitting...' : (isProposal ? 'Submit proposal' : `Assign to ${data.forWhom === 'self' ? 'myself' : data.individualName}`)}
          </Button>
        </div>
      </Card>
    );
  };

  const steps = [
    { number: 1, title: 'Who', component: renderStep1 },
    { number: 2, title: 'Goal', component: renderStep2 },
    { number: 3, title: 'Timeline', component: renderStep3 },
    { number: 4, title: 'Review', component: renderStep4 }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep >= step.number 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {step.number}
              </div>
              <span className="ml-2 text-sm font-medium">{step.title}</span>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-border mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Current Step */}
        {steps[currentStep - 1]?.component()}
      </div>
    </div>
  );
};