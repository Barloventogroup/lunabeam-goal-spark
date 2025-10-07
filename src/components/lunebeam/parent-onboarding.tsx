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
import { supabase } from '@/integrations/supabase/client';
import { database } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { X, ArrowLeft, Loader2 } from 'lucide-react';
import lunabeamIcon from '@/assets/lunabeam-logo-icon.svg';
interface ParentOnboardingData {
  adminName: string; // Admin's own name
  preferredName: string;
  pronouns: string;
  age: string;
  strengths: string[];
  interests: string[];
  workStyle: {
    socialPreference: 'solo' | 'with-others';
    environment: 'quiet' | 'lively';
    activity: 'screens' | 'hands-on';
    duration: 'short-bursts' | 'longer-sessions';
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
  const {
    toast
  } = useToast();
  const [data, setData] = useState<ParentOnboardingData>({
    adminName: '',
    preferredName: '',
    pronouns: '',
    age: '',
    strengths: [],
    interests: [],
    workStyle: {
      socialPreference: 'solo',
      environment: 'quiet',
      activity: 'hands-on',
      duration: 'short-bursts'
    },
    nextTwoWeeks: '',
    sharingSupport: 'private'
  });
  const [customPronouns, setCustomPronouns] = useState('');
  const [showOtherStrength, setShowOtherStrength] = useState(false);
  const [otherStrength, setOtherStrength] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [generatedProfile, setGeneratedProfile] = useState('');
  const {
    completeOnboarding,
    setProfile
  } = useStore();
  const totalSteps = 7;

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
  const generateProfile = () => {
    const name = data.preferredName || 'The person you are helping';
    const pronoun = getDisplayPronouns();
    const possessive = getPossessivePronouns();
    let summary = `${name} `;
    if (data.strengths.length > 0) {
      summary += `shines at being ${data.strengths.slice(0, 3).join(', ')}. `;
    }
    if (data.interests.length > 0) {
      summary += `${pronoun === 'they' ? 'They are' : `${pronoun} is`} drawn to ${data.interests.slice(0, 3).join(', ')}. `;
    }
    if (data.age && data.age !== 'Prefer not to say') {
      summary += `At ${data.age}, `;
    } else {
      summary += `${pronoun === 'they' ? 'They' : pronoun} `;
    }
    summary += `${pronoun === 'they' ? 'prefer' : 'prefers'} ${data.workStyle.environment} spaces and ${data.workStyle.activity} activities. `;
    if (data.nextTwoWeeks) {
      summary += `${possessive} next small step: ${data.nextTwoWeeks}. `;
    }
    const sharing = data.sharingSupport === 'private' ? 'keeping things private' : data.sharingSupport === 'summary' ? 'sharing summaries with supporters' : 'sharing details with supporters';
    summary += `${pronoun === 'they' ? 'They prefer' : `${pronoun} prefers`} ${sharing}.`;
    setGeneratedProfile(summary);
    setShowProfile(true);
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
    const adminProfile = {
      first_name: data.adminName.trim() || 'Admin',
      strengths: [],
      interests: [],
      challenges: [],
      comm_pref: 'text' as const,
      onboarding_complete: true,
      user_type: 'admin' as const
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
    return <div className="min-h-screen bg-gradient-soft p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-card border-0">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-xl">✨</span>
          </div>
          <CardTitle className="text-2xl">Your Admin Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-card-soft rounded-lg p-4">
            <p className="text-foreground-soft leading-relaxed">
              {data.adminName ? `Welcome ${data.adminName}! ` : 'Welcome! '}
              As the admin, you'll be able to manage goals, invite supporters, and track progress for {data.preferredName || 'the person you\'re helping'}.
            </p>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-foreground-soft">
              You can create goals and invite the team later. Ready to get started?
            </p>
            <div className="space-y-2">
              <Button onClick={handleComplete} className="w-full" disabled={isCreating}>
                {isCreating ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting things up...
                  </> : "Let's go 🚀"}
              </Button>
              <Button variant="outline" onClick={handleBack} className="w-full">
                Skip for now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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
              <h2 className="text-3xl font-semibold">Age</h2>
              <p className="text-foreground-soft">
                How old is {data.preferredName || 'this person'}?
              </p>
            </div>}
          {currentStep === 4 && <div className="space-y-2">
              <h2 className="text-3xl font-semibold">What are 2-3 things {data.preferredName || 'they'} {data.preferredName ? 'is' : 'are'} great at?</h2>
              <p className="text-foreground-soft">
                Select up to 3 strengths
              </p>
            </div>}
          {currentStep === 5 && <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Interests</h2>
              <p className="text-foreground-soft">
                What does {data.preferredName || 'this person'} enjoy?
              </p>
            </div>}
          {currentStep === 6 && <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Work Style</h2>
              <p className="text-foreground-soft">
                How does {data.preferredName || 'this person'} like to work?
              </p>
            </div>}
          {currentStep === 7 && <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Next Two Weeks</h2>
              <p className="text-foreground-soft">
                What's one small step {data.preferredName || 'they'} can take in the next two weeks?
              </p>
            </div>}
        </div>
      </div>
      
      {/* BODY - 43.75vh */}
      <div className="h-[43.75vh] bg-gray-100 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {currentStep === 2 && <div className="space-y-4">
              <Input type="text" placeholder="Preferred name" value={data.preferredName} onChange={e => setData({
                  ...data,
                  preferredName: e.target.value
                })} />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pronouns</Label>
                <RadioGroup defaultValue={data.pronouns} onValueChange={value => setData({
                    ...data,
                    pronouns: value
                  })} className="space-y-2">
                  {PRONOUNS_OPTIONS.map(option => {
                    const isCustom = option === 'Custom';
                    return <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`pronoun-${option}`} />
                        <Label htmlFor={`pronoun-${option}`} className="cursor-pointer">
                          {isCustom ? <Input type="text" placeholder="Custom pronouns" value={customPronouns} onChange={e => setCustomPronouns(e.target.value)} /> : option}
                        </Label>
                      </div>;
                  })}
                </RadioGroup>
              </div>
            </div>}
          {currentStep === 3 && <RadioGroup defaultValue={data.age} onValueChange={value => setData({
              ...data,
              age: value
            })} className="space-y-2">
              {AGE_OPTIONS.map(option => <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`age-${option}`} className="cursor-pointer" />
                  <Label htmlFor={`age-${option}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>)}
            </RadioGroup>}
          {currentStep === 4 && <div className="flex flex-col gap-2">
              {STRENGTHS_OPTIONS.filter(opt => opt !== 'Other').map(option => <Badge key={option} variant={data.strengths.includes(option) ? 'default' : 'outline'} onClick={() => setData({
                    ...data,
                    strengths: toggleSelection(data.strengths, option, 3)
                  })} className="cursor-pointer w-[140px] justify-center bg-white text-sm">
                  {option}
                </Badge>)}
              <Badge 
                variant={showOtherStrength ? 'default' : 'outline'} 
                onClick={() => setShowOtherStrength(!showOtherStrength)} 
                className="cursor-pointer w-[140px] justify-center bg-white text-sm"
              >
                Other
              </Badge>
              {showOtherStrength && <Input 
                type="text" 
                placeholder="type strength" 
                value={otherStrength}
                onChange={(e) => setOtherStrength(e.target.value)}
                className="w-full"
              />}
            </div>}
          {currentStep === 5 && <div className="grid grid-cols-2 gap-2">
              {INTERESTS_OPTIONS.map(option => <Badge key={option} variant={data.interests.includes(option) ? 'default' : 'outline'} onClick={() => setData({
                    ...data,
                    interests: toggleSelection(data.interests, option, 3)
                  })} className="cursor-pointer">
                  {option}
                </Badge>)}
            </div>}
          {currentStep === 6 && <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Social Preference
                </Label>
                <RadioGroup defaultValue={data.workStyle.socialPreference} onValueChange={value => setData({
                    ...data,
                    workStyle: {
                      ...data.workStyle,
                      socialPreference: value as 'solo' | 'with-others'
                    }
                  })} className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="solo" id="solo" className="cursor-pointer" />
                    <Label htmlFor="solo" className="cursor-pointer">
                      Solo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="with-others" id="with-others" className="cursor-pointer" />
                    <Label htmlFor="with-others" className="cursor-pointer">
                      With Others
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Environment
                </Label>
                <RadioGroup defaultValue={data.workStyle.environment} onValueChange={value => setData({
                    ...data,
                    workStyle: {
                      ...data.workStyle,
                      environment: value as 'quiet' | 'lively'
                    }
                  })} className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quiet" id="quiet" className="cursor-pointer" />
                    <Label htmlFor="quiet" className="cursor-pointer">
                      Quiet
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lively" id="lively" className="cursor-pointer" />
                    <Label htmlFor="lively" className="cursor-pointer">
                      Lively
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Activity
                </Label>
                <RadioGroup defaultValue={data.workStyle.activity} onValueChange={value => setData({
                    ...data,
                    workStyle: {
                      ...data.workStyle,
                      activity: value as 'screens' | 'hands-on'
                    }
                  })} className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="screens" id="screens" className="cursor-pointer" />
                    <Label htmlFor="screens" className="cursor-pointer">
                      Screens
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hands-on" id="hands-on" className="cursor-pointer" />
                    <Label htmlFor="hands-on" className="cursor-pointer">
                      Hands-on
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Duration
                </Label>
                <RadioGroup defaultValue={data.workStyle.duration} onValueChange={value => setData({
                    ...data,
                    workStyle: {
                      ...data.workStyle,
                      duration: value as 'short-bursts' | 'longer-sessions'
                    }
                  })} className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="short-bursts" id="short-bursts" className="cursor-pointer" />
                    <Label htmlFor="short-bursts" className="cursor-pointer">
                      Short bursts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="longer-sessions" id="longer-sessions" className="cursor-pointer" />
                    <Label htmlFor="longer-sessions" className="cursor-pointer">
                      Longer sessions
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>}
          {currentStep === 7 && <Textarea placeholder="Next small step" value={data.nextTwoWeeks} onChange={e => setData({
              ...data,
              nextTwoWeeks: e.target.value
            })} />}
        </div>
      </div>
      
      {/* FOOTER - 6.25vh */}
      <div className="h-[6.25vh] bg-white flex items-center justify-between px-6 gap-3 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <img src={lunabeamIcon} alt="Lunabeam" className="h-16 w-16" />
        <div className="flex items-center gap-3">
          <BackButton onClick={handleBack} variant="text" />
          <Button onClick={handleNext}>
            {currentStep === totalSteps ? 'Create Profile' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>;
}
