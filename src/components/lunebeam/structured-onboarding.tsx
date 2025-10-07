import React, { useState } from 'react';
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
import { useStore } from '@/store/useStore';
import { AIService } from '@/services/aiService';
import { X } from 'lucide-react';

interface OnboardingData {
  role: 'individual' | 'parent' | '';
  invitePending?: boolean;
  name: string;
  pronouns: string;
  age: string;
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
    age: '',
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
  const { completeOnboarding, setProfile } = useStore();

  const getTotalSteps = () => {
    return 7;
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
      const strengths = data.superpowers.slice(0, 3);
      const topInterests = data.interests.slice(0, 3);
      
      // Convert numeric slider values to descriptive text
      const socialPref = data.workStyle.socialPreference > 50 ? 'working with others' : 'working solo';
      const envPref = data.workStyle.environment > 50 ? 'lively' : 'quiet';
      const activityPref = data.workStyle.activity > 50 ? 'hands-on' : 'screen-based';
      const durationPref = data.workStyle.duration > 50 ? 'longer' : 'shorter';
      
      const workPrefs = `${envPref} environments, ${activityPref} activities`;
      const barriers = data.barriers.length > 0 ? data.barriers.join(' and ') : null;
      const timePreference = data.bestTime ? `in the ${data.bestTime.toLowerCase()}` : '';
      const goalHint = data.goalSeed ? `They want to try: ${data.goalSeed}` : '';
      
      let summary = `${data.name || 'This person'} shines at being ${strengths.join(', ')}. `;
      summary += `They're drawn to ${topInterests.join(', ')} and thrive in ${workPrefs} ${timePreference}. `;
      if (barriers) {
        summary += `What sometimes gets in their way: ${barriers}. `;
      }
      if (data.goalSeed) {
        summary += `Their next tiny step: ${data.goalSeed}. `;
      }
      
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
      user_type: 'individual' as const,
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
      case 2: return data.superpowers.length > 0;
      case 3: return data.interests.length > 0;
      case 5: return data.bestTime !== '';
      default: return true;
    }
  };

  if (showProfile) {
    const getEmojiForTag = (tag: string) => {
      const emojiMap: { [key: string]: string } = {
        'Problem solver': '🧩', 'Creative': '🎨', 'Kind/helper': '🤝', 'Detail-oriented': '🔍',
        'Curious': '🤔', 'Organizer': '📋', 'Hands-on': '🛠️', 'Techie': '💻', 'Outdoorsy': '🌲',
        'Patient': '⏳', 'Leader': '👑', 'Communicator': '💬', 'Animals': '🐾', 'Art/Design': '🎨',
        'Building/Making': '🔨', 'Games': '🎮', 'Music': '🎵', 'Sports/Fitness': '⚽',
        'Cooking': '👨‍🍳', 'Nature': '🌿', 'Cars': '🚗', 'Reading/Writing': '📚',
        'Tech/Coding': '💻', 'Volunteering/Helping': '🤝', 'Money/Business': '💼',
        'Puzzles': '🧩', 'Spirituality': '🙏'
      };
      return emojiMap[tag] || '⭐';
    };

    return (
      <div className="min-h-screen p-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F0F3 0%, #f0f8fb 100%)' }}>
        <Card className="w-full max-w-md shadow-card border-0">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">✨</span>
            </div>
            <CardTitle className="text-2xl">Here's your Starter Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-card-soft rounded-lg p-4">
              <p className="text-sm text-black leading-relaxed">{generatedProfile}</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Your tags:</p>
              <div className="flex flex-wrap gap-2">
                {[...data.superpowers, ...data.interests].map(tag => (
                  <div 
                    key={tag} 
                    className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm"
                    title={tag}
                  >
                    <span>{getEmojiForTag(tag)}</span>
                    <span>{tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-sm text-black">
                Did I get that right? Don't worry, you can continue adding information to your profile 
                so we can further personalize your goals and help you shine.
              </p>
              <Button 
                onClick={handleBack} 
                className="w-full mb-2 rounded-full text-white" 
                style={{ backgroundColor: '#87CEEB' }}
              >
                Back
              </Button>
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
    <div className="min-h-screen flex flex-col">
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
                {data.role === 'parent' ? "What are their top 3 \"superpowers\"?" : "What are your top 3 \"superpowers\"?"}
              </h2>
              <p className="text-sm text-black">
                Choose up to 3 things {data.role === 'parent' ? "they're" : "you're"} naturally good at
              </p>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                {data.role === 'parent' ? "Choose 3–5 interests they might want to explore" : "Choose 3–5 interests to explore"}
              </h2>
              <p className="text-sm text-black">
                What sounds fun or interesting to {data.role === 'parent' ? 'them' : 'you'}?
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
                {data.role === 'parent' ? "When do they feel at their best?" : "When do you feel at your best?"}
              </h2>
              <p className="text-sm text-black">
                Choose {data.role === 'parent' ? 'their' : 'your'} peak energy time
              </p>
            </div>
          )}
          
          {currentStep === 6 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                {data.role === 'parent' ? "What gets in their way most?" : "What gets in your way most?"}
              </h2>
              <p className="text-sm text-black">Choose up to 2 things that make activities harder</p>
            </div>
          )}
          
          {currentStep === 7 && (
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                {data.role === 'parent' ? "One small thing they'd like to try" : "One small thing you'd like to try"}
              </h2>
              <p className="text-sm text-black">In the next 2 weeks (optional, 120 characters)</p>
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
              <div>
                <p className="text-sm font-medium mb-2">Age</p>
                <Input
                  value={data.age}
                  onChange={(e) => setData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder={data.role === 'parent' ? "Their age" : "Your age"}
                  className="text-left text-sm"
                  type="number"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          )}

          {/* Step 2: Superpowers */}
          {currentStep === 2 && (
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
          )}

          {/* Step 3: Interests */}
          {currentStep === 3 && (
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <Button
                  key={interest}
                  variant={data.interests.includes(interest) ? "default" : "outline"}
                  onClick={() => setData(prev => ({
                    ...prev,
                    interests: toggleSelection(prev.interests, interest, 5)
                  }))}
                  className="text-sm h-auto py-2 px-3 border-0"
                  style={{ backgroundColor: data.interests.includes(interest) ? undefined : '#E0E0E0' }}
                  disabled={!data.interests.includes(interest) && data.interests.length >= 5}
                >
                  {interest}
                </Button>
              ))}
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

          {/* Step 5: Best Time */}
          {currentStep === 5 && (
            <div className="space-y-2">
              {['Early morning', 'Late morning', 'Afternoon', 'Evening', 'It varies'].map(time => (
                <Button
                  key={time}
                  variant={data.bestTime === time ? "default" : "outline"}
                  onClick={() => setData(prev => ({ ...prev, bestTime: time }))}
                  className="w-full justify-start border-0 text-sm"
                  style={{ backgroundColor: data.bestTime === time ? undefined : '#E0E0E0' }}
                >
                  {time}
                </Button>
              ))}
            </div>
          )}

          {/* Step 6: Barriers */}
          {currentStep === 6 && (
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
          )}

          {/* Step 7: Goal Seed */}
          {currentStep === 7 && (
            <div className="space-y-4">
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
                <p className="text-sm font-medium text-center">Need ideas?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {GOAL_HELPERS.map(helper => (
                    <Button
                      key={helper}
                      variant="ghost"
                      onClick={() => setData(prev => ({ ...prev, goalSeed: helper }))}
                      className="text-sm h-auto py-2 px-3 border-0"
                      style={{ backgroundColor: '#E0E0E0' }}
                    >
                      {helper}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* FOOTER - 6.25% */}
      <div className="h-[6.25vh] bg-white flex items-center justify-end px-6 gap-3">
        {currentStep >= 1 && <BackButton variant="text" onClick={handleBack} />}
        <Button 
          onClick={handleNext} 
          disabled={!canProceed() || isGenerating}
        >
          {isGenerating ? 'Creating...' : currentStep === getTotalSteps() ? 'Create Profile' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
