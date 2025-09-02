import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useStore } from '@/store/useStore';
import { AIService } from '@/services/aiService';

interface OnboardingData {
  role: 'individual' | 'parent' | '';
  individualEmail?: string;
  invitePending?: boolean;
  name: string;
  pronouns: string;
  superpowers: string[];
  interests: string[];
  workStyle: {
    socialPreference: 'solo' | 'with-others';
    environment: 'quiet' | 'lively';
    activity: 'screens' | 'hands-on';
    duration: 'short-bursts' | 'longer-sessions';
  };
  bestTime: string;
  barriers: string[];
  goalSeed: string;
  sharingPrefs: {
    shareScope: 'private' | 'summary' | 'details';
    supportStyle: 'gentle-reminders' | 'step-by-step' | 'celebrate-wins';
  };
}

interface StructuredOnboardingProps {
  onComplete: () => void;
  roleData?: { role: 'parent' | 'individual'; individualEmail?: string };
}

const SUPERPOWERS = [
  'Problem solver', 'Creative', 'Kind/helper', 'Detail-oriented', 'Curious', 
  'Organizer', 'Hands-on', 'Techie', 'Outdoorsy', 'Patient', 'Leader', 'Communicator'
];

const INTERESTS = [
  'Animals', 'Art/Design', 'Building/Making', 'Games', 'Music', 'Sports/Fitness',
  'Cooking', 'Nature', 'Cars', 'Reading/Writing', 'Tech/Coding', 'Volunteering/Helping',
  'Money/Business', 'Puzzles', 'Spirituality'
];

const BARRIERS = [
  'Noise', 'Time pressure', 'Unclear instructions', 'Bright lights', 'Crowds',
  'Switching tasks', 'Reading long text', 'Meeting new people'
];

const GOAL_HELPERS = [
  'Join a club', 'Cook a new dish', 'Apply for a library card', 'Walk 15 min daily',
  'Learn 3 guitar chords', 'Organize one drawer', 'Text a friend'
];

export function StructuredOnboarding({ onComplete, roleData }: StructuredOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    role: roleData?.role || 'individual',
    individualEmail: roleData?.individualEmail || '',
    invitePending: false,
    name: '',
    pronouns: '',
    superpowers: [],
    interests: [],
    workStyle: {
      socialPreference: 'solo',
      environment: 'quiet',
      activity: 'hands-on',
      duration: 'short-bursts'
    },
    bestTime: '',
    barriers: [],
    goalSeed: '',
    sharingPrefs: {
      shareScope: 'private',
      supportStyle: 'gentle-reminders'
    }
  });
  const [customSuperpower, setCustomSuperpower] = useState('');
  const [customInterest, setCustomInterest] = useState('');
  const [customBarrier, setCustomBarrier] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [generatedProfile, setGeneratedProfile] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { completeOnboarding, setProfile } = useStore();

  // Dynamic step calculation based on role
  const getTotalSteps = () => {
    return 8; // Updated to 8 steps after removing role selection
  };

  const handleNext = () => {
    const totalSteps = getTotalSteps();
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      generateProfile();
    }
  };

  const handleBack = () => {
    if (showProfile) {
      setShowProfile(false);
      setCurrentStep(getTotalSteps());
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleInvite = () => {
    // Simple pending invite - just mark as sent
    setData(prev => ({ ...prev, invitePending: true }));
    handleNext();
  };

  const toggleSelection = (array: string[], value: string, max?: number) => {
    if (array.includes(value)) {
      return array.filter(item => item !== value);
    } else if (!max || array.length < max) {
      return [...array, value];
    }
    return array;
  };

  const addCustomOption = (field: 'superpowers' | 'interests' | 'barriers', value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      setData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter('');
    }
  };

  const generateProfile = async () => {
    setIsGenerating(true);
    try {
      // Generate natural voice summary
      const strengths = data.superpowers.slice(0, 3);
      const topInterests = data.interests.slice(0, 3);
      const workPrefs = `${data.workStyle.environment}, ${data.workStyle.activity} activities`;
      const barriers = data.barriers.length > 0 ? data.barriers.join(' and ') : null;
      const timePreference = data.bestTime ? `in the ${data.bestTime.toLowerCase()}` : '';
      const goalHint = data.goalSeed ? `They want to try: ${data.goalSeed}` : '';
      
      // Create natural summary
      let summary = `${data.name || 'This person'} shines at being ${strengths.join(', ')}. `;
      summary += `They're drawn to ${topInterests.join(', ')} and thrive in ${workPrefs} ${timePreference}. `;
      if (barriers) {
        summary += `What sometimes gets in their way: ${barriers}. `;
      }
      if (data.goalSeed) {
        summary += `Their next tiny step: ${data.goalSeed}. `;
      }
      summary += `They prefer ${data.sharingPrefs.shareScope === 'private' ? 'keeping things private' : 
        data.sharingPrefs.shareScope === 'summary' ? 'sharing summaries with supporters' : 'sharing details with supporters'} `;
      summary += `and like ${data.sharingPrefs.supportStyle.replace('-', ' ')}.`;
      
      setGeneratedProfile(summary);
      setShowProfile(true);
    } catch (error) {
      console.error('Error generating profile:', error);
      setGeneratedProfile("We've captured your preferences and you're ready to start your journey!");
      setShowProfile(true);
    }
    setIsGenerating(false);
  };

  const handleComplete = async () => {
    const localProfile = {
      first_name: data.name || 'User',
      strengths: data.superpowers,
      interests: data.interests,
      challenges: data.barriers,
      comm_pref: 'text' as const,
      onboarding_complete: true,
    };

    try {
      // Save the profile data collected during onboarding
      await setProfile({ ...localProfile, onboarding_complete: true });
      await completeOnboarding();
    } catch (error) {
      console.warn('Falling back to local profile only (no auth?):', error);
    } finally {
      // Ensure app state reflects completion no matter what
      useStore.setState({ profile: localProfile });
      onComplete();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.name.trim().length > 0;
      case 2: return data.superpowers.length > 0;
      case 3: return data.interests.length > 0;
      case 5: return data.bestTime !== '';
      default: return true;
    }
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-card border-0">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">✨</span>
            </div>
            <CardTitle className="text-2xl">Here's your Starter Profile</CardTitle>
            {currentStep > 1 && (
              <Button variant="ghost" onClick={handleBack} className="absolute top-4 left-4">
                ← Back
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-card-soft rounded-lg p-4">
              <p className="text-foreground-soft leading-relaxed">{generatedProfile}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Your tags:</p>
              <div className="flex flex-wrap gap-1">
                {data.superpowers.map(power => (
                  <Badge key={power} variant="secondary" className="text-xs">{power}</Badge>
                ))}
                {data.interests.map(interest => (
                  <Badge key={interest} variant="outline" className="text-xs">{interest}</Badge>
                ))}
              </div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-sm text-foreground-soft">
                Did I get that right? Don't worry, you can continue adding information to your profile 
                so we can further personalize your goals and help you shine.
              </p>
              <Button onClick={handleComplete} className="w-full">
                Let's get started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="max-w-md mx-auto py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white">{currentStep}/{getTotalSteps()}</span>
          </div>
          <Progress value={(currentStep / getTotalSteps()) * 100} className="h-2" />
        </div>

        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            {/* Step 1: Name & Pronouns */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-lg font-semibold mb-2">
                    {data.role === 'parent' ? "What would they like to be called?" : "What would you like to be called?"}
                  </h2>
                  <p className="text-lg text-black">
                    Just {data.role === 'parent' ? 'their' : 'your'} first name or nickname is perfect
                  </p>
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
                <div className="space-y-4">
                  <Input
                    value={data.name}
                    onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={data.role === 'parent' ? "Their name" : "Your name"}
                    className="text-center text-lg"
                    maxLength={30}
                    style={{ backgroundColor: '#E0E0E0' }}
                  />
                  <div>
                    <p className="text-sm font-medium mb-2">Pronouns (optional)</p>
                    <div className="flex flex-wrap gap-2">
                      {['she/her', 'he/him', 'they/them', 'other'].map(pronoun => (
                        <Button
                          key={pronoun}
                          variant={data.pronouns === pronoun ? "default" : "outline"}
                          onClick={() => setData(prev => ({ ...prev, pronouns: pronoun }))}
                          className="text-sm border-0"
                          style={{ backgroundColor: data.pronouns === pronoun ? undefined : '#E0E0E0' }}
                        >
                          {pronoun}
                        </Button>
                      ))}
                    </div>
                    {data.pronouns === 'other' && (
                      <Input
                        value={data.pronouns === 'other' ? '' : data.pronouns}
                        onChange={(e) => setData(prev => ({ ...prev, pronouns: e.target.value }))}
                        placeholder={data.role === 'parent' ? "Their pronouns" : "Your pronouns"}
                        className="mt-2"
                        maxLength={20}
                        style={{ backgroundColor: '#E0E0E0' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Superpowers */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">
                    {data.role === 'parent' ? "What are their top 3 \"superpowers\"?" : "What are your top 3 \"superpowers\"?"}
                  </h2>
                  <p className="text-sm text-foreground-soft">
                    Choose up to 3 things {data.role === 'parent' ? "they're" : "you're"} naturally good at
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUPERPOWERS.map(power => (
                    <Button
                      key={power}
                      variant={data.superpowers.includes(power) ? "default" : "outline"}
                      onClick={() => setData(prev => ({
                        ...prev,
                        superpowers: toggleSelection(prev.superpowers, power, 3)
                      }))}
                      className="text-sm h-auto py-2 px-3"
                      disabled={!data.superpowers.includes(power) && data.superpowers.length >= 3}
                    >
                      {power}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customSuperpower}
                    onChange={(e) => setCustomSuperpower(e.target.value)}
                    placeholder="Other superpower..."
                    className="flex-1"
                    maxLength={20}
                  />
                  <Button
                    onClick={() => addCustomOption('superpowers', customSuperpower, setCustomSuperpower)}
                    disabled={data.superpowers.length >= 3 || !customSuperpower.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Interests */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">
                    {data.role === 'parent' ? "Choose 3–5 interests they might want to explore" : "Choose 3–5 interests to explore"}
                  </h2>
                  <p className="text-sm text-foreground-soft">
                    What sounds fun or interesting to {data.role === 'parent' ? 'them' : 'you'}?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <Button
                      key={interest}
                      variant={data.interests.includes(interest) ? "default" : "outline"}
                      onClick={() => setData(prev => ({
                        ...prev,
                        interests: toggleSelection(prev.interests, interest, 5)
                      }))}
                      className="text-sm h-auto py-2 px-3"
                      disabled={!data.interests.includes(interest) && data.interests.length >= 5}
                    >
                      {interest}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    placeholder="Other interest..."
                    className="flex-1"
                    maxLength={20}
                  />
                  <Button
                    onClick={() => addCustomOption('interests', customInterest, setCustomInterest)}
                    disabled={data.interests.length >= 5 || !customInterest.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                <div className="text-center">
                  <Button variant="ghost" onClick={handleSkip} className="text-sm">
                    It depends
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Work Style */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">
                    {data.role === 'parent' ? "How do they like doing things?" : "How do you like doing things?"}
                  </h2>
                  <p className="text-sm text-foreground-soft">Tap one from each pair</p>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'socialPreference', options: ['solo', 'with-others'], labels: ['Solo', 'With others'] },
                    { key: 'environment', options: ['quiet', 'lively'], labels: ['Quiet spaces', 'Lively spaces'] },
                    { key: 'activity', options: ['screens', 'hands-on'], labels: ['Screens', 'Hands-on'] },
                    { key: 'duration', options: ['short-bursts', 'longer-sessions'], labels: ['Short bursts', 'Longer sessions'] }
                  ].map(({ key, options, labels }) => (
                    <div key={key} className="flex gap-2">
                      {options.map((option, index) => (
                        <Button
                          key={option}
                          variant={data.workStyle[key as keyof typeof data.workStyle] === option ? "default" : "outline"}
                          onClick={() => setData(prev => ({
                            ...prev,
                            workStyle: { ...prev.workStyle, [key]: option }
                          }))}
                          className="flex-1"
                        >
                          {labels[index]}
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Best Time */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">
                    {data.role === 'parent' ? "When do they feel at their best?" : "When do you feel at your best?"}
                  </h2>
                  <p className="text-sm text-foreground-soft">
                    Choose {data.role === 'parent' ? 'their' : 'your'} peak energy time
                  </p>
                </div>
                <div className="space-y-2">
                  {['Early morning', 'Late morning', 'Afternoon', 'Evening', 'It varies'].map(time => (
                    <Button
                      key={time}
                      variant={data.bestTime === time ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, bestTime: time }))}
                      className="w-full justify-start"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
                <div className="text-center">
                  <Button variant="ghost" onClick={handleSkip} className="text-sm">
                    Skip
                  </Button>
                </div>
              </div>
            )}

            {/* Step 6: Barriers */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">
                    {data.role === 'parent' ? "What gets in their way most?" : "What gets in your way most?"}
                  </h2>
                  <p className="text-sm text-foreground-soft">Choose up to 2 things that make activities harder</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {BARRIERS.map(barrier => (
                    <Button
                      key={barrier}
                      variant={data.barriers.includes(barrier) ? "default" : "outline"}
                      onClick={() => setData(prev => ({
                        ...prev,
                        barriers: toggleSelection(prev.barriers, barrier, 2)
                      }))}
                      className="text-sm h-auto py-2 px-3"
                      disabled={!data.barriers.includes(barrier) && data.barriers.length >= 2}
                    >
                      {barrier}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customBarrier}
                    onChange={(e) => setCustomBarrier(e.target.value)}
                    placeholder="Other barrier..."
                    className="flex-1"
                    maxLength={20}
                  />
                  <Button
                    onClick={() => addCustomOption('barriers', customBarrier, setCustomBarrier)}
                    disabled={data.barriers.length >= 2 || !customBarrier.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Step 7: Goal Seed */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">
                    {data.role === 'parent' ? "One small thing they'd like to try" : "One small thing you'd like to try"}
                  </h2>
                  <p className="text-sm text-foreground-soft">In the next 2 weeks (optional, 120 characters)</p>
                </div>
                <Textarea
                  value={data.goalSeed}
                  onChange={(e) => setData(prev => ({ ...prev, goalSeed: e.target.value }))}
                  placeholder={data.role === 'parent' ? "What would they like to try?" : "What would you like to try?"}
                  maxLength={120}
                  rows={3}
                />
                <div className="text-xs text-foreground-soft text-center">
                  {data.goalSeed.length}/120 characters
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Need ideas?</p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_HELPERS.map(helper => (
                      <Button
                        key={helper}
                        variant="ghost"
                        onClick={() => setData(prev => ({ ...prev, goalSeed: helper }))}
                        className="text-xs h-auto py-1 px-2"
                      >
                        {helper}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Sharing Preferences */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Sharing & support preferences</h2>
                  <p className="text-sm text-foreground-soft">How would you like help along the way?</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Privacy</p>
                    <div className="space-y-2">
                      {[
                        { value: 'private', label: 'Keep private' },
                        { value: 'summary', label: 'Share a summary with my supporter' },
                        { value: 'details', label: 'Share details with my supporter' }
                      ].map(option => (
                        <Button
                          key={option.value}
                          variant={data.sharingPrefs.shareScope === option.value ? "default" : "outline"}
                          onClick={() => setData(prev => ({
                            ...prev,
                            sharingPrefs: { ...prev.sharingPrefs, shareScope: option.value as any }
                          }))}
                          className="w-full justify-start text-sm"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Preferred help</p>
                    <div className="space-y-2">
                      {[
                        { value: 'gentle-reminders', label: 'Gentle reminders' },
                        { value: 'step-by-step', label: 'Step-by-step checklist' },
                        { value: 'celebrate-wins', label: 'Celebrate wins only' }
                      ].map(option => (
                        <Button
                          key={option.value}
                          variant={data.sharingPrefs.supportStyle === option.value ? "default" : "outline"}
                          onClick={() => setData(prev => ({
                            ...prev,
                            sharingPrefs: { ...prev.sharingPrefs, supportStyle: option.value as any }
                          }))}
                          className="w-full justify-start text-sm"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="pt-6 mt-6 border-t border-border space-y-2">
              {currentStep > 1 && (
                <Button variant="ghost" onClick={handleBack} className="w-full">
                  Back
                </Button>
              )}
              
              <Button 
                onClick={handleNext} 
                disabled={!canProceed() || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Creating...' : currentStep === getTotalSteps() ? 'Create Profile' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}