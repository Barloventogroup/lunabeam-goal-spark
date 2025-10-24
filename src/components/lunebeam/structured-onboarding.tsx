import React, { useState } from 'react';
import Lottie from 'lottie-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useStore } from '@/store/useStore';
import { supabase } from '@/integrations/supabase/client';
import { AIService } from '@/services/aiService';
import { X, Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import lunabeamIcon from '@/assets/lunabeam-logo-icon.svg';

interface OnboardingData {
  role: 'individual' | 'parent' | '';
  invitePending?: boolean;
  name: string;
  pronouns: string;
  birthday: Date | undefined;
  superpowers: string[];
  interests: string[];
  workStyle: {
    socialPreference: number;
    environment: number;
    activity: number;
    duration: number;
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
  roleData?: { role: 'parent' | 'individual'; isAdmin?: boolean };
  onExit: () => Promise<void>;
  onBack?: () => void;
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

export function StructuredOnboarding({ onComplete, roleData, onExit, onBack }: StructuredOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    role: roleData?.role || 'individual',
    invitePending: false,
    name: '',
    pronouns: '',
    birthday: undefined,
    superpowers: [],
    interests: [],
    workStyle: {
      socialPreference: 50,
      environment: 50,
      activity: 50,
      duration: 50
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
  const [validationMessages, setValidationMessages] = useState<{[key: string]: string}>({});
  const [suggestions, setSuggestions] = useState<{[key: string]: string[]}>({});
  const [showProfile, setShowProfile] = useState(false);
  const [generatedProfile, setGeneratedProfile] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { completeOnboarding, setProfile } = useStore();

  const getTotalSteps = () => {
    return 6;
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
    } else if (currentStep === 1 && onBack) {
      onBack();
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleInvite = () => {
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

  const validateWord = (word: string, field: 'superpowers' | 'interests' | 'barriers') => {
    console.log('Validating word:', word, 'for field:', field);
    
    const commonWords: { [key: string]: string[] } = {
      superpowers: ['Smart', 'Fast', 'Strong', 'Friendly', 'Helpful', 'Artistic', 'Musical', 'Athletic'],
      interests: ['Photography', 'Dancing', 'Singing', 'Drawing', 'Writing', 'Swimming', 'Running', 'Cycling'],
      barriers: ['Stress', 'Fatigue', 'Anxiety', 'Distractions', 'Interruptions', 'Perfectionism']
    };

    if (word.length >= 2) {
      const hasInvalidChars = /[^a-zA-Z\\\\s/-]/.test(word);
      
      console.log('Word has invalid chars:', hasInvalidChars);
      
      if (hasInvalidChars) {
        console.log('Setting validation message for:', field);
        setValidationMessages(prev => ({
          ...prev,
          [field]: "Are you sure that's a word?"
        }));
        setSuggestions(prev => ({
          ...prev,
          [field]: commonWords[field].filter(w => w.toLowerCase().includes(word.toLowerCase().substring(0, 2)))
        }));
      } else {
        console.log('Clearing validation for:', field);
        setValidationMessages(prev => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
        setSuggestions(prev => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }
    } else {
      console.log('Clearing validation (less than 2 chars) for:', field);
      setValidationMessages(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
      setSuggestions(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const addCustomOption = (field: 'superpowers' | 'interests' | 'barriers', value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      const hasInvalidChars = /[^a-zA-Z\\\\s/-]/.test(value.trim());
      
      if (hasInvalidChars) {
        setValidationMessages(prev => ({
          ...prev,
          [field]: "Are you sure that's a word?"
        }));
        
        const commonWords: { [key: string]: string[] } = {
          superpowers: ['Smart', 'Fast', 'Strong', 'Friendly', 'Helpful', 'Artistic', 'Musical', 'Athletic'],
          interests: ['Photography', 'Dancing', 'Singing', 'Drawing', 'Writing', 'Swimming', 'Running', 'Cycling'],
          barriers: ['Stress', 'Fatigue', 'Anxiety', 'Distractions', 'Interruptions', 'Perfectionism']
        };
        
        setSuggestions(prev => ({
          ...prev,
          [field]: commonWords[field].filter(w => w.toLowerCase().includes(value.toLowerCase().substring(0, 2)))
        }));
        return;
      }
      
      setData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter('');
      
      setValidationMessages(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
      setSuggestions(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const generateProfile = async () => {
    setIsGenerating(true);
    try {
      // Calculate age from birthday
      const age = data.birthday 
        ? Math.floor((new Date().getTime() - data.birthday.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : undefined;

      const { data: summaryData, error } = await supabase.functions.invoke('generate-profile-summary', {
        body: {
          name: 'You',
          pronouns: 'you',
          age: age?.toString() || '',
          birthday: data.birthday?.toISOString(),
          strengths: data.superpowers,
          interests: data.interests,
          workStyle: data.workStyle,
          nextTwoWeeks: data.goalSeed,
          sharingSupport: data.sharingPrefs.shareScope
        }
      });

      if (error) {
        console.error('Error generating profile:', error);
        setGeneratedProfile("You're ready to start your journey with your unique strengths and interests!");
      } else {
        setGeneratedProfile(summaryData.summary);
      }
    } catch (error) {
      console.error('Error generating profile:', error);
      setGeneratedProfile("You're ready to start your journey with your unique strengths and interests!");
    } finally {
      setIsGenerating(false);
      setShowProfile(true);
    }
  };

  const handleComplete = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    
    const localProfile = {
      first_name: data.name || 'User',
      strengths: data.superpowers,
      interests: data.interests,
      challenges: data.barriers,
      comm_pref: 'text' as const,
      onboarding_complete: true,
      user_type: 'individual' as const,
      has_seen_welcome: true, // Mark as seen
    };

    try {
      await setProfile({ ...localProfile, onboarding_complete: true });
      await completeOnboarding();
    } catch (error) {
      console.warn('Falling back to local profile only (no auth?):', error);
    } finally {
      useStore.setState({ profile: localProfile });
      onComplete();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.name.trim().length > 0;
      case 2: return data.birthday !== undefined;
      case 3: return data.superpowers.length > 0;
      default: return true;
    }
  };

  if (showProfile) {
    return <div className="min-h-[100dvh] flex flex-col">
      {/* Exit button */}
      <Button variant="ghost" size="sm" onClick={onExit} className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-50">
        <X className="h-4 w-4" />
      </Button>
      
      {/* HEADER - 50vh */}
      <div className="h-[50vh] bg-white flex flex-col justify-end p-6">
        <div className="max-w-2xl mx-auto w-full">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold">Your Profile</h2>
            <p className="text-foreground-soft">
              Here's a summary of what you've shared. You'll be able to set goals and invite supporters after setup is complete.
            </p>
          </div>
        </div>
      </div>
      
      {/* BODY - 43.75vh */}
      <div className="h-[43.75vh] bg-gray-100 overflow-y-auto p-6 flex items-center justify-center">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <p className="text-foreground leading-relaxed">
              {generatedProfile}
            </p>
          </div>
          <p className="text-sm text-foreground-soft leading-relaxed text-center px-4">
            Did I get that right? Don't worry, you can continue adding information to your profile so we can further personalize your goals and help you shine.
          </p>
        </div>
      </div>
      
      {/* FOOTER - 6.25vh */}
      <div className="h-[6.25vh] bg-white flex items-center justify-between px-6 gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <img src={lunabeamIcon} alt="Lunabeam" className="h-16 w-16" />
        <div className="flex items-center gap-3">
          <BackButton onClick={handleBack} variant="text" />
          <Button onClick={handleComplete} disabled={isCreating}>
            {isCreating ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </> : "Let's go 🚀"}
          </Button>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Exit button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onExit}
        className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-50"
      >
        <X className="h-4 w-4" />
      </Button>
      
      {/* HEADER - 50% */}
      <div className="h-[50vh] bg-white flex flex-col justify-end p-6">
        <div className="max-w-2xl mx-auto w-full">
          {currentStep === 1 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                {data.role === 'parent' ? "What would they like to be called?" : "What would you like to be called?"}
              </h2>
              <p className="text-sm text-black">
                Just {data.role === 'parent' ? 'their' : 'your'} first name or nickname is perfect
              </p>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                {data.role === 'parent' ? `How old is ${data.name || 'they'}?` : "How old are you?"}
              </h2>
              <p className="text-sm text-black">
                We'll use this to personalize your experience
              </p>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                {data.role === 'parent' ? "What are their top 3 \"superpowers\"?" : "What are your top 3 \"superpowers\"?"}
              </h2>
              <p className="text-sm text-black">
                Choose up to 3 things {data.role === 'parent' ? "they're" : "you're"} naturally good at
              </p>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                {data.role === 'parent' ? "How do they like doing things?" : "How do you like doing things?"}
              </h2>
              <p className="text-sm text-black">Slide to show your preferences</p>
            </div>
          )}
          
          {currentStep === 5 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                {data.role === 'parent' ? "What gets in their way most?" : "What gets in your way most?"}
              </h2>
              <p className="text-sm text-black">Choose up to 2 things that make activities harder</p>
            </div>
          )}
          
          {currentStep === 6 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Sharing and Support</h2>
              <p className="text-foreground-soft">
                How would you like to share your progress with supporters?
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* BODY - 43.75% */}
      <div className="h-[43.75vh] bg-gray-100 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Step 1: Name & Pronouns */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Input
                value={data.name}
                onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={data.role === 'parent' ? "Their name" : "Your name"}
                className="text-left text-sm"
                maxLength={30}
              />
              <div>
                <p className="text-sm font-medium mb-2">Pronouns (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {['she/her', 'he/him', 'they/them'].map(pronoun => (
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
              </div>
            </div>
          )}

          {/* Step 2: Birthday */}
          {currentStep === 2 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-auto justify-start text-left font-normal",
                    !data.birthday && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.birthday ? format(data.birthday, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.birthday}
                  onSelect={(date) => setData(prev => ({ ...prev, birthday: date }))}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  showYearPicker
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Step 3: Superpowers */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {SUPERPOWERS.map(power => (
                  <Button
                    key={power}
                    variant={data.superpowers.includes(power) ? "default" : "outline"}
                    onClick={() => setData(prev => ({
                      ...prev,
                      superpowers: toggleSelection(prev.superpowers, power, 3)
                    }))}
                    className="text-sm h-auto py-2 px-3 border-0"
                    style={{ backgroundColor: data.superpowers.includes(power) ? undefined : '#E0E0E0' }}
                    disabled={!data.superpowers.includes(power) && data.superpowers.length >= 3}
                  >
                    {power}
                  </Button>
                ))}
              </div>
              
              {/* Custom superpowers as pills */}
              {data.superpowers.filter(sp => !SUPERPOWERS.includes(sp)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.superpowers.filter(sp => !SUPERPOWERS.includes(sp)).map(customPower => (
                    <div 
                      key={customPower}
                      className="flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm"
                    >
                      <span>{customPower}</span>
                      <button
                        onClick={() => setData(prev => ({
                          ...prev,
                          superpowers: prev.superpowers.filter(sp => sp !== customPower)
                        }))}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Other input */}
              <div className="space-y-2">
                <Input
                  value={customSuperpower}
                  onChange={(e) => {
                    setCustomSuperpower(e.target.value);
                    validateWord(e.target.value, 'superpowers');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomOption('superpowers', customSuperpower, setCustomSuperpower);
                    }
                  }}
                  placeholder="Other..."
                  className="text-sm"
                  disabled={data.superpowers.length >= 3}
                  maxLength={30}
                />
                {validationMessages.superpowers && (
                  <p className="text-xs text-destructive">{validationMessages.superpowers}</p>
                )}
                {suggestions.superpowers && suggestions.superpowers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground w-full">Did you mean:</p>
                    {suggestions.superpowers.map(suggestion => (
                      <Button
                        key={suggestion}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomSuperpower(suggestion);
                          setValidationMessages(prev => {
                            const { superpowers: _, ...rest } = prev;
                            return rest;
                          });
                          setSuggestions(prev => {
                            const { superpowers: _, ...rest } = prev;
                            return rest;
                          });
                        }}
                        className="text-xs h-auto py-1 px-2"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Work Style */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Social Preference Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Solo</span>
                  <span className="text-sm text-muted-foreground">With others</span>
                </div>
                <Slider
                  value={[data.workStyle.socialPreference]}
                  onValueChange={(value) => setData(prev => ({
                    ...prev,
                    workStyle: { ...prev.workStyle, socialPreference: value[0] }
                  }))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Environment Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Quiet spaces</span>
                  <span className="text-sm text-muted-foreground">Lively spaces</span>
                </div>
                <Slider
                  value={[data.workStyle.environment]}
                  onValueChange={(value) => setData(prev => ({
                    ...prev,
                    workStyle: { ...prev.workStyle, environment: value[0] }
                  }))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Activity Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Screens</span>
                  <span className="text-sm text-muted-foreground">Hands-on</span>
                </div>
                <Slider
                  value={[data.workStyle.activity]}
                  onValueChange={(value) => setData(prev => ({
                    ...prev,
                    workStyle: { ...prev.workStyle, activity: value[0] }
                  }))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Duration Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Short bursts</span>
                  <span className="text-sm text-muted-foreground">Longer sessions</span>
                </div>
                <Slider
                  value={[data.workStyle.duration]}
                  onValueChange={(value) => setData(prev => ({
                    ...prev,
                    workStyle: { ...prev.workStyle, duration: value[0] }
                  }))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Step 5: Barriers */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {BARRIERS.map(barrier => (
                  <Button
                    key={barrier}
                    variant={data.barriers.includes(barrier) ? "default" : "outline"}
                    onClick={() => setData(prev => ({
                      ...prev,
                      barriers: toggleSelection(prev.barriers, barrier, 2)
                    }))}
                    className="text-sm h-auto py-2 px-3 border-0"
                    style={{ backgroundColor: data.barriers.includes(barrier) ? undefined : '#E0E0E0' }}
                    disabled={!data.barriers.includes(barrier) && data.barriers.length >= 2}
                  >
                    {barrier}
                  </Button>
                ))}
              </div>
              
              {/* Custom barriers as pills */}
              {data.barriers.filter(b => !BARRIERS.includes(b)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.barriers.filter(b => !BARRIERS.includes(b)).map(customBarrier => (
                    <div 
                      key={customBarrier}
                      className="flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm"
                    >
                      <span>{customBarrier}</span>
                      <button
                        onClick={() => setData(prev => ({
                          ...prev,
                          barriers: prev.barriers.filter(b => b !== customBarrier)
                        }))}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Other input */}
              <div className="space-y-2">
                <Input
                  value={customBarrier}
                  onChange={(e) => {
                    setCustomBarrier(e.target.value);
                    validateWord(e.target.value, 'barriers');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomOption('barriers', customBarrier, setCustomBarrier);
                    }
                  }}
                  placeholder="Other..."
                  className="text-sm"
                  disabled={data.barriers.length >= 2}
                  maxLength={30}
                />
                {validationMessages.barriers && (
                  <p className="text-xs text-destructive">{validationMessages.barriers}</p>
                )}
                {suggestions.barriers && suggestions.barriers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground w-full">Did you mean:</p>
                    {suggestions.barriers.map(suggestion => (
                      <Button
                        key={suggestion}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomBarrier(suggestion);
                          setValidationMessages(prev => {
                            const { barriers: _, ...rest } = prev;
                            return rest;
                          });
                          setSuggestions(prev => {
                            const { barriers: _, ...rest } = prev;
                            return rest;
                          });
                        }}
                        className="text-xs h-auto py-1 px-2"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Sharing and Support */}
          {currentStep === 6 && (
            <div className="space-y-3">
              <div 
                onClick={() => setData(prev => ({
                  ...prev,
                  sharingPrefs: { ...prev.sharingPrefs, shareScope: 'private' }
                }))}
                className={`cursor-pointer p-4 rounded-full border-2 transition-all ${
                  data.sharingPrefs.shareScope === 'private' 
                    ? 'border-primary bg-white' 
                    : 'border-border bg-white'
                }`}
              >
                <div className="font-medium">Keep it private</div>
                <div className="text-sm text-muted-foreground">Only you can see progress</div>
              </div>
              
              <div 
                onClick={() => setData(prev => ({
                  ...prev,
                  sharingPrefs: { ...prev.sharingPrefs, shareScope: 'summary' }
                }))}
                className={`cursor-pointer p-4 rounded-full border-2 transition-all ${
                  data.sharingPrefs.shareScope === 'summary' 
                    ? 'border-primary bg-white' 
                    : 'border-border bg-white'
                }`}
              >
                <div className="font-medium">Share summaries</div>
                <div className="text-sm text-muted-foreground">Supporters see high-level updates</div>
              </div>
              
              <div 
                onClick={() => setData(prev => ({
                  ...prev,
                  sharingPrefs: { ...prev.sharingPrefs, shareScope: 'details' }
                }))}
                className={`cursor-pointer p-4 rounded-full border-2 transition-all ${
                  data.sharingPrefs.shareScope === 'details' 
                    ? 'border-primary bg-white' 
                    : 'border-border bg-white'
                }`}
              >
                <div className="font-medium">Share details</div>
                <div className="text-sm text-muted-foreground">Supporters see detailed progress</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* FOOTER - 6.25% */}
      <div className="h-[6.25vh] bg-white flex items-center justify-between px-6 gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <img src={lunabeamIcon} alt="Lunabeam" className="h-16 w-16" />
        <div className="flex items-center gap-3">
          {currentStep >= 1 && <BackButton variant="text" onClick={handleBack} />}
          <Button 
            onClick={handleNext} 
            disabled={!canProceed() || isGenerating}
          >
            {isGenerating ? 'Creating...' : currentStep === getTotalSteps() ? 'Create Profile' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
