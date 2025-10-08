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
import { database } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { X, ArrowLeft, Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import lunabeamIcon from '@/assets/lunabeam-logo-icon.svg';
import confettiAnimation from '@/assets/confetti-animation.json';

interface ParentOnboardingData {
  adminName: string; // Admin's own name
  preferredName: string;
  pronouns: string;
  birthday: Date | undefined;
  strengths: string[];
  interests: string[];
  workStyle: {
    socialPreference: number; // 0-100 scale
    environment: number; // 0-100 scale
    activity: number; // 0-100 scale
    duration: number; // 0-100 scale
  };
  nextTwoWeeks: string;
  sharingSupport: 'private' | 'summary' | 'details';
}
interface ParentOnboardingProps {
  onComplete: () => void;
  onExit: () => Promise<void>;
  onBack?: () => void;
}
const PRONOUNS_OPTIONS = ['she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'name only', 'Prefer not to say', 'Custom'];
const AGE_OPTIONS = ['13–15', '16–18', '19–22', '23–26', '27+', 'Prefer not to say'];
const STRENGTHS_OPTIONS = ['Kind/helper', 'Creative', 'Problem solver', 'Detail-oriented', 'Curious', 'Organizer', 'Hands-on', 'Tech savvy', 'Patient', 'Communicator', 'Other'];
const INTERESTS_OPTIONS = ['Animals', 'Art/Design', 'Building/Making', 'Games', 'Music', 'Sports/Fitness', 'Cooking', 'Nature', 'Cars', 'Reading/Writing', 'Tech/Coding', 'Volunteering/Helping', 'Money/Business', 'Puzzles', 'Other'];
const SUGGESTIONS = ['Join a club', 'Cook a new dish', 'Short daily walk', 'Visit the library'];
export function ParentOnboarding({
  onComplete,
  onExit,
  onBack
}: ParentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(2);
  const [isCreating, setIsCreating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const {
    toast
  } = useToast();
  const [data, setData] = useState<ParentOnboardingData>({
    adminName: '',
    preferredName: '',
    pronouns: '',
    birthday: undefined,
    strengths: [],
    interests: [],
    workStyle: {
      socialPreference: 50,
      environment: 50,
      activity: 50,
      duration: 50
    },
    nextTwoWeeks: '',
    sharingSupport: 'private'
  });
  const [customPronouns, setCustomPronouns] = useState('');
  const [customStrength, setCustomStrength] = useState('');
  const [validationMessages, setValidationMessages] = useState<{[key: string]: string}>({});
  const [suggestions, setSuggestions] = useState<{[key: string]: string[]}>({});
  const [showProfile, setShowProfile] = useState(false);
  const [generatedProfile, setGeneratedProfile] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const {
    completeOnboarding,
    setProfile
  } = useStore();
  const totalSteps = 6;

  // Get pronouns for display
  const getDisplayPronouns = () => {
    if (data.pronouns === 'Custom') return customPronouns || 'they';
    if (data.pronouns === 'name only') return data.preferredName || 'they';
    if (data.pronouns === 'she/her') return 'she';
    if (data.pronouns === 'he/him') return 'he';
    return 'they';
  };
  const getPossessivePronouns = () => {
    const pronoun = getDisplayPronouns();
    if (pronoun === 'she') return 'her';
    if (pronoun === 'he') return 'his';
    return 'their';
  };
  const getObjectPronouns = () => {
    const pronoun = getDisplayPronouns();
    if (pronoun === 'she') return 'her';
    if (pronoun === 'he') return 'him';
    return 'them';
  };
  const handleNext = async () => {
    // Step 2: Name is mandatory - validate before continuing
    if (currentStep === 2) {
      if (!data.preferredName.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter a name to continue.",
          variant: "destructive"
        });
        return;
      }
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      generateProfile();
    }
  };
  const handleBack = () => {
    if (showProfile) {
      setShowProfile(false);
      setCurrentStep(totalSteps);
    } else if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 2 && onBack) {
      onBack();
    }
  };
  const handleSkip = () => {
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

  const validateWord = (word: string, field: 'strengths') => {
    const commonWords: { [key: string]: string[] } = {
      strengths: ['Smart', 'Fast', 'Strong', 'Friendly', 'Helpful', 'Artistic', 'Musical', 'Athletic']
    };

    if (word.length >= 2) {
      const hasInvalidChars = /[^a-zA-Z\s/-]/.test(word);
      
      if (hasInvalidChars) {
        setValidationMessages(prev => ({
          ...prev,
          [field]: "Are you sure that's a word?"
        }));
        setSuggestions(prev => ({
          ...prev,
          [field]: commonWords[field].filter(w => w.toLowerCase().includes(word.toLowerCase().substring(0, 2)))
        }));
      } else {
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

  const addCustomStrength = () => {
    if (customStrength.trim()) {
      const hasInvalidChars = /[^a-zA-Z\s/-]/.test(customStrength.trim());
      
      if (hasInvalidChars) {
        setValidationMessages(prev => ({
          ...prev,
          strengths: "Are you sure that's a word?"
        }));
        
        const commonWords = ['Smart', 'Fast', 'Strong', 'Friendly', 'Helpful', 'Artistic', 'Musical', 'Athletic'];
        setSuggestions(prev => ({
          ...prev,
          strengths: commonWords.filter(w => w.toLowerCase().includes(customStrength.toLowerCase().substring(0, 2)))
        }));
        return;
      }
      
      setData(prev => ({
        ...prev,
        strengths: [...prev.strengths, customStrength.trim()]
      }));
      setCustomStrength('');
      
      setValidationMessages(prev => {
        const { strengths: _, ...rest } = prev;
        return rest;
      });
      setSuggestions(prev => {
        const { strengths: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const generateProfile = async () => {
    const name = data.preferredName || 'This individual';
    const pronoun = getDisplayPronouns();
    
    setIsGenerating(true);
    
    try {
      // Calculate age from birthday
      const age = data.birthday 
        ? Math.floor((new Date().getTime() - data.birthday.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
        : undefined;

      const { data: summaryData, error } = await supabase.functions.invoke('generate-profile-summary', {
        body: {
          name,
          pronouns: pronoun,
          age: age?.toString() || '',
          birthday: data.birthday?.toISOString(),
          strengths: data.strengths,
          interests: data.interests,
          workStyle: data.workStyle,
          nextTwoWeeks: data.nextTwoWeeks,
          sharingSupport: data.sharingSupport
        }
      });

      if (error) {
        console.error('Error generating profile:', error);
        toast({
          title: "Using basic summary",
          description: "AI profile generation unavailable, showing simple overview.",
          variant: "default"
        });
        setGeneratedProfile(`${name} is focusing on building their strengths and pursuing their interests. They're working on goals that matter to them.`);
      } else {
        setGeneratedProfile(summaryData.summary);
      }
    } catch (error) {
      console.error('Failed to generate profile:', error);
      setGeneratedProfile(`${name} is focusing on building their strengths and pursuing their interests. They're working on goals that matter to them.`);
    } finally {
      setIsGenerating(false);
      setShowProfile(true);
    }
  };
  const handleComplete = async () => {
    if (isCreating) {
      console.log('🔒 handleComplete blocked: already creating', {
        timestamp: Date.now()
      });
      return;
    }
    console.log('🚀 Let\'s go button clicked - starting handleComplete', {
      timestamp: Date.now()
    });
    
    setIsCreating(true);
    
    // Check if user has seen welcome animation before
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('has_seen_welcome')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Only show confetti if this is first time
        if (!profileData?.has_seen_welcome) {
          setShowConfetti(true);
        }
      }
    } catch (error) {
      console.warn('Could not check welcome status, showing confetti:', error);
      setShowConfetti(true);
    }
    
    const adminProfile = {
      first_name: data.adminName.trim() || 'Admin',
      strengths: [],
      interests: [],
      challenges: [],
      comm_pref: 'text' as const,
      onboarding_complete: true,
      user_type: 'admin' as const,
      has_seen_welcome: true, // Mark as seen
    };
    try {
      console.log('✅ Parent onboarding: Creating admin profile:', adminProfile);
      console.log('👤 Parent onboarding: Will create individual profile:', data.preferredName, data.strengths, data.interests);
      if (data.adminName.trim()) {
        try {
          await supabase.auth.updateUser({
            data: {
              first_name: data.adminName.trim()
            }
          });
          console.log('Admin name saved to auth metadata:', data.adminName);
        } catch (metaError) {
          console.warn('Failed to save admin name to metadata:', metaError);
        }
      }
      useStore.setState({
        profile: null
      });
      await database.saveProfile(adminProfile);
      console.log('Admin profile saved to database:', adminProfile);
      if (data.preferredName.trim()) {
        console.log('👤 Parent onboarding: Creating provisional profile for:', data.preferredName.trim());
        console.log('📞 Parent onboarding: Calling provision_individual_direct with:', {
          p_first_name: data.preferredName.trim(),
          p_strengths: data.strengths || [],
          p_interests: data.interests || [],
          p_comm_pref: 'text'
        });
        const {
          data: provisionResult,
          error: provisionError
        } = await supabase.rpc('provision_individual_direct', {
          p_first_name: data.preferredName.trim(),
          p_strengths: data.strengths || [],
          p_interests: data.interests || [],
          p_comm_pref: 'text'
        });
        console.log('📋 Parent onboarding: provision_individual_direct response:', {
          data: provisionResult,
          error: provisionError
        });
        if (provisionError) {
          console.error('❌ Failed to provision individual profile:', provisionError);
          alert(`Note: Could not create account for ${data.preferredName}. You can try again later. Error: ${provisionError.message}`);
        } else if (provisionResult && provisionResult.length > 0) {
          const result = provisionResult[0];
          console.log('✅ Individual profile provisioned successfully:', {
            individual_id: result.individual_id,
            placeholder_email: result.placeholder_email
          });
          const {
            data: {
              user: currentUser
            }
          } = await supabase.auth.getUser();
          if (currentUser) {
            const {
              data: supporters,
              error: supportersError
            } = await supabase.from('supporters').select('*').eq('supporter_id', currentUser.id);
            console.log('🤝 Parent onboarding: Supporter relationships after provision:', {
              supporters,
              supportersError
            });
          }
        } else {
          console.warn('⚠️ provision_individual_direct returned no data');
        }
      } else {
        console.log('⏭️ No individual name provided, skipping individual account creation');
      }
      useStore.setState({
        profile: adminProfile
      });
      await completeOnboarding();
      console.log('🎉 Parent onboarding completed successfully - both admin and individual profiles created');
      onComplete();
    } catch (error) {
      console.error('💥 Parent onboarding failed:', error);
      alert(`There was an issue completing setup: ${error.message || 'Unknown error'}. Your admin account was created, but you may need to create the individual account again.`);
      useStore.setState({
        profile: adminProfile
      });
      try {
        await completeOnboarding();
        console.log('✅ Onboarding marked complete despite error');
      } catch (completionError) {
        console.error('❌ Completion also failed:', completionError);
      }
      onComplete();
    } finally {
      setIsCreating(false);
    }
  };
  if (showProfile) {
    return <div className="min-h-screen flex flex-col">
      {/* Exit button */}
      <Button variant="ghost" size="sm" onClick={onExit} className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-50">
        <X className="h-4 w-4" />
      </Button>
      
      {/* HEADER - 50vh */}
      <div className="h-[50vh] bg-white flex flex-col justify-end p-6">
        <div className="max-w-2xl mx-auto w-full">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold">{data.preferredName}'s Profile</h2>
            <p className="text-foreground-soft">
              Here's a summary of what you've shared. You can create goals and invite supporters after setup is complete.
            </p>
          </div>
        </div>
      </div>
      
      {/* BODY - 43.75vh */}
      <div className="h-[43.75vh] bg-gray-100 overflow-y-auto p-6 flex items-center justify-center">
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <p className="text-foreground leading-relaxed">
              {generatedProfile}
            </p>
          </div>
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
      
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Lottie 
            animationData={confettiAnimation} 
            loop={false}
            onComplete={() => setShowConfetti(false)}
          />
        </div>
      )}
    </div>;
  }
  return <div className="min-h-screen flex flex-col">
      {/* Exit button */}
      <Button variant="ghost" size="sm" onClick={onExit} className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-50">
        <X className="h-4 w-4" />
      </Button>
      
      {/* HEADER - 50vh */}
      <div className="h-[50vh] bg-white flex flex-col justify-end p-6">
        <div className="max-w-2xl mx-auto w-full">
          {currentStep === 2 && <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Who are you helping?</h2>
              <p className="text-foreground-soft">
                What name do they prefer and what are their pronouns?
              </p>
            </div>}
          {currentStep === 3 && <div className="space-y-2">
              <h2 className="text-3xl font-semibold">How old is {data.preferredName || 'they'}?</h2>
              <p className="text-foreground-soft">
                We'll use this to personalize their experience
              </p>
            </div>}
          {currentStep === 4 && <div className="space-y-2">
              <h2 className="text-3xl font-semibold">What are 2-3 things {data.preferredName || 'they'} {data.preferredName ? 'is' : 'are'} great at?</h2>
              <p className="text-foreground-soft">
                Select up to 3 strengths
              </p>
            </div>}
          {currentStep === 5 && <div className="space-y-2">
              <h2 className="text-3xl font-semibold">
                How does {data.preferredName || 'they'} usually like to do things?
              </h2>
              <p className="text-foreground-soft">
                Move each slider to show their preferences
              </p>
            </div>}
          {currentStep === 6 && <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Sharing and Support</h2>
              <p className="text-foreground-soft">
                How would you like to share {data.preferredName || 'their'} progress with supporters?
              </p>
            </div>}
        </div>
      </div>
      
      {/* BODY - 43.75vh */}
      <div className="h-[43.75vh] bg-gray-100 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {currentStep === 2 && (
            <div className="space-y-4">
              <Input 
                type="text" 
                placeholder="Their preferred name" 
                value={data.preferredName} 
                onChange={e => setData({
                  ...data,
                  preferredName: e.target.value
                })}
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
          {currentStep === 3 && (
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
                  onSelect={(date) => setData({
                    ...data,
                    birthday: date
                  })}
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
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {STRENGTHS_OPTIONS.filter(opt => opt !== 'Other').map(option => (
                  <Button
                    key={option}
                    variant={data.strengths.includes(option) ? "default" : "outline"}
                    onClick={() => setData({
                      ...data,
                      strengths: toggleSelection(data.strengths, option, 3)
                    })}
                    className="text-sm h-auto py-2 px-3 border-0"
                    style={{ backgroundColor: data.strengths.includes(option) ? undefined : '#E0E0E0' }}
                    disabled={!data.strengths.includes(option) && data.strengths.length >= 3}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              
              {/* Custom strengths as pills */}
              {data.strengths.filter(s => !STRENGTHS_OPTIONS.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.strengths.filter(s => !STRENGTHS_OPTIONS.includes(s)).map(customStr => (
                    <div 
                      key={customStr}
                      className="flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm"
                    >
                      <span>{customStr}</span>
                      <button
                        onClick={() => setData(prev => ({
                          ...prev,
                          strengths: prev.strengths.filter(s => s !== customStr)
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
                  value={customStrength}
                  onChange={(e) => {
                    setCustomStrength(e.target.value);
                    validateWord(e.target.value, 'strengths');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomStrength();
                    }
                  }}
                  placeholder="Other..."
                  className="text-sm"
                  disabled={data.strengths.length >= 3}
                  maxLength={30}
                />
                {validationMessages.strengths && (
                  <p className="text-xs text-destructive">{validationMessages.strengths}</p>
                )}
                {suggestions.strengths && suggestions.strengths.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground w-full">Did you mean:</p>
                    {suggestions.strengths.map(suggestion => (
                      <Button
                        key={suggestion}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCustomStrength(suggestion);
                          setValidationMessages(prev => {
                            const { strengths: _, ...rest } = prev;
                            return rest;
                          });
                          setSuggestions(prev => {
                            const { strengths: _, ...rest } = prev;
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
          {currentStep === 5 && <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Solo</span>
                  <span className="text-sm text-muted-foreground">With Others</span>
                </div>
                <Slider
                  value={[data.workStyle.socialPreference]}
                  onValueChange={(value) => setData({
                    ...data,
                    workStyle: { ...data.workStyle, socialPreference: value[0] }
                  })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Quiet</span>
                  <span className="text-sm text-muted-foreground">Lively</span>
                </div>
                <Slider
                  value={[data.workStyle.environment]}
                  onValueChange={(value) => setData({
                    ...data,
                    workStyle: { ...data.workStyle, environment: value[0] }
                  })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Screens</span>
                  <span className="text-sm text-muted-foreground">Hands-on</span>
                </div>
                <Slider
                  value={[data.workStyle.activity]}
                  onValueChange={(value) => setData({
                    ...data,
                    workStyle: { ...data.workStyle, activity: value[0] }
                  })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Short bursts</span>
                  <span className="text-sm text-muted-foreground">Longer sessions</span>
                </div>
                <Slider
                  value={[data.workStyle.duration]}
                  onValueChange={(value) => setData({
                    ...data,
                    workStyle: { ...data.workStyle, duration: value[0] }
                  })}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>}
          {currentStep === 6 && <div className="space-y-3">
              <div 
                onClick={() => setData({ ...data, sharingSupport: 'private' })}
                className={`cursor-pointer p-4 rounded-full border-2 transition-all ${
                  data.sharingSupport === 'private' 
                    ? 'border-primary bg-white' 
                    : 'border-border bg-white'
                }`}
              >
                <div className="font-medium">Keep it private</div>
                <div className="text-sm text-muted-foreground">Only you can see progress</div>
              </div>
              
              <div 
                onClick={() => setData({ ...data, sharingSupport: 'summary' })}
                className={`cursor-pointer p-4 rounded-full border-2 transition-all ${
                  data.sharingSupport === 'summary' 
                    ? 'border-primary bg-white' 
                    : 'border-border bg-white'
                }`}
              >
                <div className="font-medium">Share summaries</div>
                <div className="text-sm text-muted-foreground">Supporters see high-level updates</div>
              </div>
              
              <div 
                onClick={() => setData({ ...data, sharingSupport: 'details' })}
                className={`cursor-pointer p-4 rounded-full border-2 transition-all ${
                  data.sharingSupport === 'details' 
                    ? 'border-primary bg-white' 
                    : 'border-border bg-white'
                }`}
              >
                <div className="font-medium">Share details</div>
                <div className="text-sm text-muted-foreground">Supporters see detailed progress</div>
              </div>
            </div>}
        </div>
      </div>
      
      {/* FOOTER - 6.25vh */}
      <div className="h-[6.25vh] bg-white flex items-center justify-between px-6 gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <img src={lunabeamIcon} alt="Lunabeam" className="h-16 w-16" />
        <div className="flex items-center gap-3">
          <BackButton onClick={handleBack} variant="text" />
          <Button onClick={handleNext} disabled={isGenerating}>
            {isGenerating ? 'Generating Profile...' : currentStep === totalSteps ? 'Create Profile' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>;
}
