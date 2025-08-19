import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Mic, MessageSquare, Plus, X, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Profile } from '@/types';

const OnboardingFlow: React.FC = () => {
  const { setProfile, completeOnboarding, currentStep, setCurrentStep } = useStore();
  const [formData, setFormData] = useState<Partial<Profile>>({
    first_name: '',
    comm_pref: 'text',
    strengths: [],
    interests: [],
    challenges: []
  });

  const [customInput, setCustomInput] = useState('');
  const [activeInputType, setActiveInputType] = useState<'strengths' | 'interests' | 'challenges' | null>(null);

  const steps = [
    { title: 'Welcome', subtitle: 'Let\'s get to know you' },
    { title: 'Communication', subtitle: 'How do you prefer to interact?' },
    { title: 'Your Strengths', subtitle: 'What are you good at?' },
    { title: 'Your Interests', subtitle: 'What do you enjoy?' },
    { title: 'Challenges', subtitle: 'What can be difficult sometimes?' },
    { title: 'Your Snapshot', subtitle: 'Here\'s what we learned about you!' }
  ];

  const strengthSuggestions = ['patient', 'creative', 'detail-oriented', 'visual thinker', 'problem solver', 'kind', 'focused', 'organized'];
  const interestSuggestions = ['photography', 'animals', 'nature', 'music', 'art', 'reading', 'gaming', 'sports'];
  const challengeSuggestions = ['loud noises', 'crowds', 'bright lights', 'transitions', 'time management', 'social situations'];

  const addItem = (type: 'strengths' | 'interests' | 'challenges', item: string) => {
    if (item.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...(prev[type] || []), item.trim()]
      }));
      setCustomInput('');
      setActiveInputType(null);
    }
  };

  const removeItem = (type: 'strengths' | 'interests' | 'challenges', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      setProfile(formData as Profile);
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.first_name && formData.first_name.length > 0;
      case 1: return formData.comm_pref;
      case 2: return (formData.strengths?.length || 0) >= 1;
      case 3: return (formData.interests?.length || 0) >= 1;
      case 4: return (formData.challenges?.length || 0) >= 1;
      case 5: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🌙</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to Lunebeam</h2>
              <p className="text-foreground-soft">A gentle space to set small goals and celebrate progress</p>
            </div>
            <div className="space-y-4">
              <Label htmlFor="name" className="text-lg">What should we call you?</Label>
              <Input
                id="name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Your first name"
                className="h-14 text-lg rounded-2xl border-2"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">How do you like to communicate?</h2>
              <p className="text-foreground-soft">Choose what feels most comfortable for you</p>
            </div>
            <RadioGroup
              value={formData.comm_pref}
              onValueChange={(value: 'voice' | 'text') => setFormData(prev => ({ ...prev, comm_pref: value }))}
              className="space-y-4"
            >
              <Card className="p-6 hover:bg-card-soft transition-smooth cursor-pointer">
                <Label htmlFor="text" className="flex items-center gap-4 cursor-pointer">
                  <RadioGroupItem value="text" id="text" />
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-medium text-lg">Text & Typing</div>
                    <div className="text-foreground-soft">I prefer to type and read</div>
                  </div>
                </Label>
              </Card>
              <Card className="p-6 hover:bg-card-soft transition-smooth cursor-pointer">
                <Label htmlFor="voice" className="flex items-center gap-4 cursor-pointer">
                  <RadioGroupItem value="voice" id="voice" />
                  <Mic className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-medium text-lg">Voice & Speaking</div>
                    <div className="text-foreground-soft">I like to talk and listen</div>
                  </div>
                </Label>
              </Card>
            </RadioGroup>
          </div>
        );

      case 2:
      case 3:
      case 4:
        const type = currentStep === 2 ? 'strengths' : currentStep === 3 ? 'interests' : 'challenges';
        const suggestions = currentStep === 2 ? strengthSuggestions : currentStep === 3 ? interestSuggestions : challengeSuggestions;
        const emoji = currentStep === 2 ? '💪' : currentStep === 3 ? '❤️' : '🎯';
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-3">{emoji}</div>
              <h2 className="text-2xl font-semibold mb-2">{steps[currentStep].title}</h2>
              <p className="text-foreground-soft">{steps[currentStep].subtitle}</p>
            </div>
            
            {/* Current items */}
            {(formData[type]?.length || 0) > 0 && (
              <div className="space-y-3">
                <Label className="text-lg">Your {type}:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData[type]?.map((item, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-2 gap-2">
                      {item}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeItem(type, index)}
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-3">
              <Label className="text-lg">Quick picks:</Label>
              <div className="flex flex-wrap gap-2">
                {suggestions
                  .filter(suggestion => !formData[type]?.includes(suggestion))
                  .map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="soft"
                      size="sm"
                      onClick={() => addItem(type, suggestion)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {suggestion}
                    </Button>
                  ))
                }
              </div>
            </div>

            {/* Custom input */}
            <div className="space-y-3">
              <Label className="text-lg">Or add your own:</Label>
              <div className="flex gap-2">
                <Input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addItem(type, customInput);
                    }
                  }}
                  placeholder={`Add a ${type.slice(0, -1)}...`}
                  className="h-12 rounded-xl border-2"
                />
                <Button
                  variant="supportive"
                  size="icon"
                  onClick={() => addItem(type, customInput)}
                  disabled={!customInput.trim()}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-2xl font-semibold mb-2">Your Strengths Snapshot</h2>
              <p className="text-foreground-soft">Here's what makes you unique!</p>
            </div>

            <Card className="p-6 bg-gradient-soft border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <span className="text-xl font-semibold">Hi {formData.first_name}!</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-foreground-soft">Your Strengths</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.strengths?.map((strength, index) => (
                        <Badge key={index} className="bg-supportive text-supportive-foreground">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-foreground-soft">You Love</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.interests?.map((interest, index) => (
                        <Badge key={index} className="bg-encouraging text-encouraging-foreground">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-card rounded-xl">
                  <p className="text-sm text-foreground-soft italic">
                    "What I'm exploring this week: Building on my {formData.strengths?.[0] || 'unique'} nature 
                    and {formData.interests?.[0] || 'interests'} to achieve small, meaningful goals."
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-foreground-soft">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-foreground-soft">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <Card className="p-6 shadow-card border-0">
          <CardContent className="p-0">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            variant={currentStep === steps.length - 1 ? "supportive" : "default"}
            onClick={handleNext}
            disabled={!canProceed()}
            className={currentStep === 0 ? "w-full" : "flex-1"}
          >
            {currentStep === steps.length - 1 ? "Start My Journey" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { OnboardingFlow };