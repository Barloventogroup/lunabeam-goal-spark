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
import { X } from 'lucide-react';

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
}

const PRONOUNS_OPTIONS = [
  'she/her', 'he/him', 'they/them', 'she/they', 'he/they', 'name only', 'Prefer not to say', 'Custom'
];

const AGE_OPTIONS = [
  '13–15', '16–18', '19–22', '23–26', '27+', 'Prefer not to say'
];

const STRENGTHS_OPTIONS = [
  'Kind/helper', 'Creative', 'Problem solver', 'Detail-oriented', 'Curious', 
  'Organizer', 'Hands-on', 'Tech savvy', 'Patient', 'Communicator', 'Other'
];

const INTERESTS_OPTIONS = [
  'Animals', 'Art/Design', 'Building/Making', 'Games', 'Music', 'Sports/Fitness',
  'Cooking', 'Nature', 'Cars', 'Reading/Writing', 'Tech/Coding', 'Volunteering/Helping',
  'Money/Business', 'Puzzles', 'Other'
];

const SUGGESTIONS = [
  'Join a club', 'Cook a new dish', 'Short daily walk', 'Visit the library'
];

export function ParentOnboarding({ onComplete, onExit }: ParentOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
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
  const [showProfile, setShowProfile] = useState(false);
  const [generatedProfile, setGeneratedProfile] = useState('');
  const { completeOnboarding, setProfile } = useStore();

  const totalSteps = 9;

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

  const handleNext = () => {
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
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
    
    const sharing = data.sharingSupport === 'private' ? 'keeping things private' : 
                   data.sharingSupport === 'summary' ? 'sharing summaries with supporters' : 
                   'sharing details with supporters';
    summary += `${pronoun === 'they' ? 'They prefer' : `${pronoun} prefers`} ${sharing}.`;
    
    setGeneratedProfile(summary);
    setShowProfile(true);
  };

  const handleComplete = async () => {
    // For admin/parent flow, we need to create TWO things:
    // 1. Admin's own profile (for the authenticated user)
    // 2. Individual's profile (using secure database function)
    
    const adminProfile = {
      first_name: data.adminName.trim() || 'Admin',
      strengths: [],
      interests: [],
      challenges: [],
      comm_pref: 'text' as const,
      onboarding_complete: true,
    };

    try {
      console.log('Parent onboarding: Creating admin profile:', adminProfile);
      console.log('Parent onboarding: Will create individual profile:', data.preferredName, data.strengths, data.interests);
      
      // Save admin's name to auth metadata
      if (data.adminName.trim()) {
        try {
          await supabase.auth.updateUser({
            data: { first_name: data.adminName.trim() }
          });
          console.log('Admin name saved to auth metadata:', data.adminName);
        } catch (metaError) {
          console.warn('Failed to save admin name to metadata:', metaError);
        }
      }

      // Clear any existing cached profile data first
      useStore.setState({ profile: null });
      
      // 1. Create admin's own profile
      await database.saveProfile(adminProfile);
      console.log('Admin profile saved to database:', adminProfile);
      
      // 2. Create individual profile using provisional system (if name provided)
      if (data.preferredName.trim()) {
        console.log('Parent onboarding: Creating provisional profile...');
        
        // Generate a temporary email for the individual
        const tempEmail = `${data.preferredName.toLowerCase().replace(/\s+/g, '')}+temp${Date.now()}@temp.lunabeam.com`;
        
        const { data: provisionResult, error: provisionError } = await supabase
          .rpc('provision_individual_with_email', {
            p_first_name: data.preferredName.trim(),
            p_invitee_email: tempEmail,
            p_strengths: data.strengths,
            p_interests: data.interests,
            p_comm_pref: 'text'
          });

        if (provisionError) {
          console.error('Failed to provision individual profile:', provisionError);
          throw provisionError;
        }

        if (provisionResult && provisionResult.length > 0) {
          const result = provisionResult[0];
          console.log('Individual profile provisioned successfully:', {
            individual_id: result.individual_id,
            claim_token: result.claim_token,
            magic_link_token: result.magic_link_token
          });
        } else {
          console.warn('Provision function returned no results');
        }
      }
      
      // Update local store with admin profile
      useStore.setState({ profile: adminProfile });
      
      // Complete onboarding
      await completeOnboarding();
      
      console.log('Parent onboarding completed successfully - both admin and individual profiles created');
      onComplete();
    } catch (error) {
      console.error('Parent onboarding failed:', error);
      
      // Ensure local state shows admin profile even if individual provisioning fails
      useStore.setState({ profile: adminProfile });
      
      try {
        await completeOnboarding();
        console.log('Onboarding marked complete despite error');
      } catch (completionError) {
        console.error('Completion also failed:', completionError);
      }
      
      onComplete();
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
                <Button onClick={handleComplete} className="w-full">
                  Let's go 🚀
                </Button>
                <Button variant="outline" onClick={handleBack} className="w-full">
                  Skip for now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-md mx-auto py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-foreground-soft">{currentStep}/{totalSteps}</span>
            {currentStep > 1 && (
                <BackButton variant="minimal" onClick={handleBack} />
            )}
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        <Card className="shadow-card border-0 relative">
          {/* Exit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <CardContent className="p-6">
            
            {/* Step 1: Admin Name */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-xl">👋</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-4">What should I call you?</h2>
                  <p className="text-foreground-soft leading-relaxed mb-6">
                    First, let me know your name so I can greet you properly!
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="adminName" className="text-sm font-medium">Your name</Label>
                    <Input
                      id="adminName"
                      placeholder="Enter your name"
                      value={data.adminName}
                      onChange={(e) => setData(prev => ({ ...prev, adminName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Introduction */}
            {currentStep === 2 && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">👨‍👩‍👧‍👦</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4">Let's get to know them</h2>
                  <p className="text-foreground-soft leading-relaxed">
                    A few quick questions help me suggest better goals. Use a nickname if you want - you can change anything later.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Name and Pronouns */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">What should we call them?</h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Preferred name</Label>
                      <Input
                        value={data.preferredName}
                        onChange={(e) => setData(prev => ({ ...prev, preferredName: e.target.value }))}
                        placeholder="Enter their preferred name"
                        className="mt-1"
                      />
                      <p className="text-xs text-foreground-soft mt-1">
                        This is how we'll address them in the app. Initials or a nickname are okay.
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">What are this person's pronouns?</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {PRONOUNS_OPTIONS.map(pronoun => (
                          <Button
                            key={pronoun}
                            variant={data.pronouns === pronoun ? "default" : "outline"}
                            onClick={() => setData(prev => ({ ...prev, pronouns: pronoun }))}
                            className="text-sm h-auto py-1 px-3"
                          >
                            {pronoun}
                          </Button>
                        ))}
                      </div>
                      {data.pronouns === 'Custom' && (
                        <Input
                          value={customPronouns}
                          onChange={(e) => setCustomPronouns(e.target.value)}
                          placeholder="Enter custom pronouns"
                          className="mt-2"
                        />
                      )}
                      <p className="text-xs text-foreground-soft mt-1">
                        We ask so we can be respectful. You can change this later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Age */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">How old are they?</h2>
                  <div className="flex flex-wrap gap-2">
                    {AGE_OPTIONS.map(age => (
                      <Button
                        key={age}
                        variant={data.age === age ? "default" : "outline"}
                        onClick={() => setData(prev => ({ ...prev, age }))}
                        className="text-sm h-auto py-2 px-3"
                      >
                        {age}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Strengths */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">What are 2–3 things they're great at?</h2>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {STRENGTHS_OPTIONS.map(strength => (
                      <Button
                        key={strength}
                        variant={data.strengths.includes(strength) ? "default" : "outline"}
                        onClick={() => setData(prev => ({
                          ...prev,
                          strengths: toggleSelection(prev.strengths, strength, 3)
                        }))}
                        className="text-sm h-auto py-2 px-3"
                        disabled={!data.strengths.includes(strength) && data.strengths.length >= 3}
                      >
                        {strength}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Interests */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Pick a few interests to explore</h2>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {INTERESTS_OPTIONS.map(interest => (
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
                  <p className="text-xs text-foreground-soft mt-2">
                    Choose 3–5 to start. "Other" lets you type your own.
                  </p>
                </div>
              </div>
            )}

            {/* Step 7: Work Style */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">How do they usually like to do things?</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <span className="font-medium">Solo</span>
                      <div className="flex gap-1">
                        <Button
                          variant={data.workStyle.socialPreference === 'solo' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setData(prev => ({
                            ...prev,
                            workStyle: { ...prev.workStyle, socialPreference: 'solo' }
                          }))}
                        >
                          Solo
                        </Button>
                        <Button
                          variant={data.workStyle.socialPreference === 'with-others' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setData(prev => ({
                            ...prev,
                            workStyle: { ...prev.workStyle, socialPreference: 'with-others' }
                          }))}
                        >
                          With others
                        </Button>
                      </div>
                      <span className="font-medium">With others</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <span className="font-medium">Quiet spaces</span>
                      <div className="flex gap-1">
                        <Button
                          variant={data.workStyle.environment === 'quiet' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setData(prev => ({
                            ...prev,
                            workStyle: { ...prev.workStyle, environment: 'quiet' }
                          }))}
                        >
                          Quiet
                        </Button>
                        <Button
                          variant={data.workStyle.environment === 'lively' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setData(prev => ({
                            ...prev,
                            workStyle: { ...prev.workStyle, environment: 'lively' }
                          }))}
                        >
                          Lively
                        </Button>
                      </div>
                      <span className="font-medium">Lively spaces</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <span className="font-medium">Screens</span>
                      <div className="flex gap-1">
                        <Button
                          variant={data.workStyle.activity === 'screens' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setData(prev => ({
                            ...prev,
                            workStyle: { ...prev.workStyle, activity: 'screens' }
                          }))}
                        >
                          Screens
                        </Button>
                        <Button
                          variant={data.workStyle.activity === 'hands-on' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setData(prev => ({
                            ...prev,
                            workStyle: { ...prev.workStyle, activity: 'hands-on' }
                          }))}
                        >
                          Hands-on
                        </Button>
                      </div>
                      <span className="font-medium">Hands-on</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <span className="font-medium">Short bursts</span>
                      <div className="flex gap-1">
                        <Button
                          variant={data.workStyle.duration === 'short-bursts' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setData(prev => ({
                            ...prev,
                            workStyle: { ...prev.workStyle, duration: 'short-bursts' }
                          }))}
                        >
                          Short bursts
                        </Button>
                        <Button
                          variant={data.workStyle.duration === 'longer-sessions' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setData(prev => ({
                            ...prev,
                            workStyle: { ...prev.workStyle, duration: 'longer-sessions' }
                          }))}
                        >
                          Longer sessions
                        </Button>
                      </div>
                      <span className="font-medium">Longer sessions</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Next Two Weeks */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">One small thing they might try in the next two weeks</h2>
                  <Textarea
                    value={data.nextTwoWeeks}
                    onChange={(e) => setData(prev => ({ ...prev, nextTwoWeeks: e.target.value }))}
                    placeholder="Optional - describe something small they could try"
                    className="mt-2"
                    rows={3}
                  />
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map(suggestion => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => setData(prev => ({ ...prev, nextTwoWeeks: suggestion }))}
                          className="text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 9: Sharing and Support */}
            {currentStep === 9 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Sharing and support</h2>
                  <RadioGroup 
                    value={data.sharingSupport} 
                    onValueChange={(value) => setData(prev => ({ ...prev, sharingSupport: value as any }))}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="private" id="private" className="mt-1" />
                        <Label htmlFor="private" className="flex-1 cursor-pointer">
                          <div className="font-medium">Keep private</div>
                          <div className="text-sm text-foreground-soft">No sharing with supporters</div>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="summary" id="summary" className="mt-1" />
                        <Label htmlFor="summary" className="flex-1 cursor-pointer">
                          <div className="font-medium">Share a summary with me</div>
                          <div className="text-sm text-foreground-soft">Basic progress updates</div>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="details" id="details" className="mt-1" />
                        <Label htmlFor="details" className="flex-1 cursor-pointer">
                          <div className="font-medium">Share details with me</div>
                          <div className="text-sm text-foreground-soft">Detailed progress and insights</div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-foreground-soft mt-2">
                    Controls what you see as a supporter. You can change this anytime.
                  </p>
                </div>
              </div>
            )}


            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              {currentStep > 1 && (
                <BackButton variant="minimal" onClick={handleBack} />
              )}
              <div className="flex gap-2 ml-auto">
                {currentStep < totalSteps && (
                  <Button variant="outline" onClick={handleSkip}>
                    Skip
                  </Button>
                )}
                <Button onClick={handleNext}>
                  {currentStep === totalSteps ? 'Create Profile' : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}