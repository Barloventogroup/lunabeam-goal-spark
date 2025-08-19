import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Target, Clock, Home, Users, Zap, Award } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { SelectedGoal } from '@/types';

interface GoalWizardProps {
  onNavigate: (view: string, data?: any) => void;
}

const GoalWizard: React.FC<GoalWizardProps> = ({ onNavigate }) => {
  const { addGoal, profile } = useStore();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    topic: '',
    customTopic: '',
    timeBudget: '30',
    environment: 'home' as 'home' | 'community' | 'both',
    description: ''
  });

  const topics = [
    'Photography', 'Drawing/Art', 'Writing', 'Reading', 'Exercise', 
    'Cooking', 'Gardening', 'Music', 'Learning', 'Organizing'
  ];

  const timeBudgets = [
    { value: '15', label: '15 minutes/day', description: 'Perfect for starting small' },
    { value: '30', label: '30 minutes/day', description: 'Most popular choice' },
    { value: '45', label: '45 minutes/day', description: 'For focused sessions' },
    { value: '60', label: '1 hour/day', description: 'Deep dive time' }
  ];

  const environments = [
    { value: 'home', label: 'At Home', icon: Home, description: 'Comfortable and private' },
    { value: 'community', label: 'In Community', icon: Users, description: 'Out and about' },
    { value: 'both', label: 'Both', icon: Zap, description: 'Flexible location' }
  ];

  // LLM-assisted goal generation (stubbed)
  const generateGoal = (): Omit<SelectedGoal, 'id' | 'created_at'> => {
    const topic = formData.topic || formData.customTopic;
    const timeLabel = timeBudgets.find(t => t.value === formData.timeBudget)?.label || '30 minutes/day';
    
    // This would be replaced with actual LLM call
    const goalTemplates = {
      'Photography': {
        title: 'Practice pet photography',
        steps: ['Take 3 pet photos', 'Pick the best one', 'Try a new angle'],
        success_criteria: ['3+ attempts', 'one photo you like'],
        too_hard_try: ['do 1 photo', 'shoot in a quiet room', 'ask a buddy to help']
      },
      'Drawing/Art': {
        title: 'Daily sketching practice',
        steps: ['Draw one simple object', 'Try different techniques', 'Keep a sketch journal'],
        success_criteria: ['3+ sketches', 'fill one page'],
        too_hard_try: ['sketch for 5 minutes', 'draw stick figures', 'trace something']
      },
      'Writing': {
        title: 'Creative writing snippets',
        steps: ['Write a short paragraph', 'Describe your day', 'Try dialogue writing'],
        success_criteria: ['write 3 times', 'fill half a page'],
        too_hard_try: ['write 2 sentences', 'list 5 words', 'voice record instead']
      }
    };

    const template = goalTemplates[topic as keyof typeof goalTemplates] || {
      title: `Explore ${topic.toLowerCase()}`,
      steps: [`Practice ${topic.toLowerCase()}`, 'Try something new', 'Reflect on progress'],
      success_criteria: ['3+ attempts', 'learn something new'],
      too_hard_try: ['try for 10 minutes', 'do it your way', 'ask for help']
    };

    return {
      title: template.title,
      week_plan: {
        steps: template.steps,
        time_per_day: `≤${formData.timeBudget} min`,
        success_criteria: template.success_criteria,
        too_hard_try: template.too_hard_try
      },
      check_ins: {
        frequency: 'once_midweek',
        method: profile?.comm_pref === 'voice' ? 'in_app' : 'in_app',
        encourager: 'self'
      },
      rewards: {
        type: 'badge',
        criteria: 'goal_complete',
        badge_tier: 'silver',
        proof_required: topic.toLowerCase().includes('photo') || topic.toLowerCase().includes('art'),
        accepted_proof_types: ['photo', 'video'],
        custom_label: ''
      },
      data_to_track: ['count_of_attempts', 'minutes_spent', 'confidence_1_5'],
      status: 'active'
    };
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Generate and save goal
      const goal = generateGoal();
      addGoal(goal);
      onNavigate('goal-detail', goal);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      onNavigate('home');
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.topic || formData.customTopic.trim();
      case 1: return formData.timeBudget;
      case 2: return formData.environment;
      case 3: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h2 className="text-2xl font-semibold mb-2">What interests you?</h2>
              <p className="text-foreground-soft">Pick something you'd like to explore this week</p>
            </div>

            <div className="space-y-4">
              <Label className="text-lg">Quick picks:</Label>
              <div className="grid grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <Button
                    key={topic}
                    variant={formData.topic === topic ? "supportive" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, topic, customTopic: '' }))}
                    className="h-auto p-4 text-left justify-start"
                  >
                    {topic}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                <Label className="text-lg">Or describe your own:</Label>
                <Textarea
                  value={formData.customTopic}
                  onChange={(e) => setFormData(prev => ({ ...prev, customTopic: e.target.value, topic: '' }))}
                  placeholder="I want to practice..."
                  className="h-20 rounded-xl border-2"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">⏰</div>
              <h2 className="text-2xl font-semibold mb-2">How much time?</h2>
              <p className="text-foreground-soft">Choose a comfortable daily time budget</p>
            </div>

            <RadioGroup
              value={formData.timeBudget}
              onValueChange={(value) => setFormData(prev => ({ ...prev, timeBudget: value }))}
              className="space-y-3"
            >
              {timeBudgets.map((budget) => (
                <Card key={budget.value} className="p-4 hover:bg-card-soft transition-smooth cursor-pointer">
                  <Label htmlFor={budget.value} className="flex items-center gap-4 cursor-pointer">
                    <RadioGroupItem value={budget.value} id={budget.value} />
                    <Clock className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{budget.label}</div>
                      <div className="text-sm text-foreground-soft">{budget.description}</div>
                    </div>
                  </Label>
                </Card>
              ))}
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📍</div>
              <h2 className="text-2xl font-semibold mb-2">Where feels good?</h2>
              <p className="text-foreground-soft">Choose your preferred environment</p>
            </div>

            <RadioGroup
              value={formData.environment}
              onValueChange={(value: 'home' | 'community' | 'both') => setFormData(prev => ({ ...prev, environment: value }))}
              className="space-y-3"
            >
              {environments.map((env) => (
                <Card key={env.value} className="p-4 hover:bg-card-soft transition-smooth cursor-pointer">
                  <Label htmlFor={env.value} className="flex items-center gap-4 cursor-pointer">
                    <RadioGroupItem value={env.value} id={env.value} />
                    <env.icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">{env.label}</div>
                      <div className="text-sm text-foreground-soft">{env.description}</div>
                    </div>
                  </Label>
                </Card>
              ))}
            </RadioGroup>
          </div>
        );

      case 3:
        const previewGoal = generateGoal();
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">✨</div>
              <h2 className="text-2xl font-semibold mb-2">Your Goal is Ready!</h2>
              <p className="text-foreground-soft">Here's what we created for you</p>
            </div>

            <Card className="p-6 bg-gradient-soft border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">{previewGoal.title}</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground-soft">Weekly Steps</Label>
                    <ul className="mt-1 space-y-1">
                      {previewGoal.week_plan.steps.map((step, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-foreground-soft">Time Budget</Label>
                      <p className="text-sm font-medium">{previewGoal.week_plan.time_per_day}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground-soft">Success Looks Like</Label>
                      <p className="text-sm font-medium">{previewGoal.week_plan.success_criteria.join(', ')}</p>
                    </div>
                  </div>

                  {previewGoal.rewards.type === 'badge' && (
                    <div className="flex items-center gap-2 p-3 bg-card rounded-xl">
                      <Award className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-sm font-medium">Earn a {previewGoal.rewards.badge_tier} badge</p>
                        <p className="text-xs text-foreground-soft">When you complete your goal</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <div className="p-4 bg-encouraging-soft rounded-xl">
              <p className="text-sm text-encouraging-foreground">
                <strong>Remember:</strong> If this feels too hard, try: {previewGoal.week_plan.too_hard_try.join(', ')}.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Goal Wizard</h1>
            <p className="text-sm text-foreground-soft">Step {step + 1} of 4</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: `${((step + 1) / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <Card className="p-6 shadow-card border-0 mb-6">
          <CardContent className="p-0">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Button
          variant={step === 3 ? "supportive" : "default"}
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full"
          size="lg"
        >
          {step === 3 ? "Start This Goal" : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export { GoalWizard };