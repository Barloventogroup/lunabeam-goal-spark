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
  roleData?: { role: 'parent' | 'individual'; isAdmin?: boolean };
  onExit: () => Promise<void>;
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

export function StructuredOnboarding({ onComplete, roleData, onExit }: StructuredOnboardingProps) {
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
  const [validationMessages, setValidationMessages] = useState<{[key: string]: string}>({});
  const [suggestions, setSuggestions] = useState<{[key: string]: string[]}>({});
  const [showProfile, setShowProfile] = useState(false);
  const [generatedProfile, setGeneratedProfile] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { completeOnboarding, setProfile } = useStore();

  // Dynamic step calculation based on role
  const getTotalSteps = () => {
    return 7; // Updated to 7 steps after removing sharing preferences
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

  const validateWord = (word: string, field: 'superpowers' | 'interests' | 'barriers') => {
    console.log('Validating word:', word, 'for field:', field);
    
    const commonWords: { [key: string]: string[] } = {
      superpowers: ['Smart', 'Fast', 'Strong', 'Friendly', 'Helpful', 'Artistic', 'Musical', 'Athletic'],
      interests: ['Photography', 'Dancing', 'Singing', 'Drawing', 'Writing', 'Swimming', 'Running', 'Cycling'],
      barriers: ['Stress', 'Fatigue', 'Anxiety', 'Distractions', 'Interruptions', 'Perfectionism']
    };

    // Only validate if the word has at least 2 characters
    if (word.length >= 2) {
      // Check for invalid characters (anything that's not letters, spaces, hyphens, or slashes)
      const hasInvalidChars = /[^a-zA-Z\s/-]/.test(word);
      
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
        // Clear validation for valid words
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
      // Clear validation when less than 2 characters
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
      // Validate the word when trying to add it
      const hasInvalidChars = /[^a-zA-Z\s/-]/.test(value.trim());
      
      if (hasInvalidChars) {
        // Show validation message
        setValidationMessages(prev => ({
          ...prev,
          [field]: "Are you sure that's a word?"
        }));
        
        // Show suggestions
        const commonWords: { [key: string]: string[] } = {
          superpowers: ['Smart', 'Fast', 'Strong', 'Friendly', 'Helpful', 'Artistic', 'Musical', 'Athletic'],
          interests: ['Photography', 'Dancing', 'Singing', 'Drawing', 'Writing', 'Swimming', 'Running', 'Cycling'],
          barriers: ['Stress', 'Fatigue', 'Anxiety', 'Distractions', 'Interruptions', 'Perfectionism']
        };
        
        setSuggestions(prev => ({
          ...prev,
          [field]: commonWords[field].filter(w => w.toLowerCase().includes(value.toLowerCase().substring(0, 2)))
        }));
        return; // Don't add the word if it's invalid
      }
      
      // If valid, add the word and clear any previous validation
      setData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter('');
      
      // Clear validation when successfully added
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
    const getEmojiForTag = (tag: string) => {
      const emojiMap: { [key: string]: string } = {
        // Superpowers
        'Problem solver': '🧩',
        'Creative': '🎨',
        'Kind/helper': '🤝',
        'Detail-oriented': '🔍',
        'Curious': '🤔',
        'Organizer': '📋',
        'Hands-on': '🛠️',
        'Techie': '💻',
        'Outdoorsy': '🌲',
        'Patient': '⏳',
        'Leader': '👑',
        'Communicator': '💬',
        // Interests  
        'Animals': '🐾',
        'Art/Design': '🎨',
        'Building/Making': '🔨',
        'Games': '🎮',
        'Music': '🎵',
        'Sports/Fitness': '⚽',
        'Cooking': '👨‍🍳',
        'Nature': '🌿',
        'Cars': '🚗',
        'Reading/Writing': '📚',
        'Tech/Coding': '💻',
        'Volunteering/Helping': '🤝',
        'Money/Business': '💼',
        'Puzzles': '🧩',
        'Spirituality': '🙏'
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
    <div className="min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #E8F0F3 0%, #f0f8fb 100%)' }}>
      <div className="max-w-md mx-auto py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white">{currentStep}/{getTotalSteps()}</span>
          </div>
          <Progress value={(currentStep / getTotalSteps()) * 100} className="h-2" />
        </div>

        <Card className="shadow-card border-0 h-[720px] relative">
          {/* Exit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
            {/* Step 1: Name & Pronouns */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-lg font-semibold mb-2">
                    {data.role === 'parent' ? "What would they like to be called?" : "What would you like to be called?"}
                  </h2>
                  <p className="text-sm text-black">
                    Just {data.role === 'parent' ? 'their' : 'your'} first name or nickname is perfect
                  </p>
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
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
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
              </div>
            )}

            {/* Step 2: Superpowers */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-lg font-semibold mb-2">
                    {data.role === 'parent' ? "What are their top 3 \"superpowers\"?" : "What are your top 3 \"superpowers\"?"}
                  </h2>
                  <p className="text-sm text-black">
                    Choose up to 3 things {data.role === 'parent' ? "they're" : "you're"} naturally good at
                  </p>
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
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
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
              </div>
            )}

            {/* Step 3: Interests */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-lg font-semibold mb-2">
                    {data.role === 'parent' ? "Choose 3–5 interests they might want to explore" : "Choose 3–5 interests to explore"}
                  </h2>
                  <p className="text-sm text-black">
                    What sounds fun or interesting to {data.role === 'parent' ? 'them' : 'you'}?
                  </p>
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
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
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
              </div>
            )}

            {/* Step 4: Work Style */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-lg font-semibold mb-2">
                    {data.role === 'parent' ? "How do they like doing things?" : "How do you like doing things?"}
                  </h2>
                  <p className="text-sm text-black">Tap one from each pair</p>
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
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
                          className="flex-1 border-0 text-sm"
                          style={{ backgroundColor: data.workStyle[key as keyof typeof data.workStyle] === option ? undefined : '#E0E0E0' }}
                        >
                          {labels[index]}
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
              </div>
            )}

            {/* Step 5: Best Time */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-lg font-semibold mb-2">
                    {data.role === 'parent' ? "When do they feel at their best?" : "When do you feel at your best?"}
                  </h2>
                  <p className="text-sm text-black">
                    Choose {data.role === 'parent' ? 'their' : 'your'} peak energy time
                  </p>
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
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
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
              </div>
            )}

            {/* Step 6: Barriers */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-lg font-semibold mb-2">
                    {data.role === 'parent' ? "What gets in their way most?" : "What gets in your way most?"}
                  </h2>
                  <p className="text-sm text-black">Choose up to 2 things that make activities harder</p>
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
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
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
              </div>
            )}
            {/* Step 7: Goal Seed */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="text-left">
                  <h2 className="text-lg font-semibold mb-2">
                    {data.role === 'parent' ? "One small thing they'd like to try" : "One small thing you'd like to try"}
                  </h2>
                  <p className="text-sm text-black">In the next 2 weeks (optional, 120 characters)</p>
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
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
                        className="text-sm h-auto py-2 px-3 border-0"
                        style={{ backgroundColor: '#E0E0E0' }}
                      >
                        {helper}
                      </Button>
                    ))}
                  </div>
                </div>
                <hr style={{ borderColor: '#E0E0E0', backgroundColor: '#E0E0E0', height: '1px', border: 'none' }} />
              </div>
            )}


            </div>
            {/* Navigation */}
            <div className="pt-6 mt-auto space-y-2">
              {currentStep > 1 && (
                <BackButton variant="text" onClick={handleBack} className="w-full" />
              )}
              
              <Button 
                onClick={handleNext} 
                disabled={!canProceed() || isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Creating...' : currentStep === getTotalSteps() ? 'Create Profile' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}