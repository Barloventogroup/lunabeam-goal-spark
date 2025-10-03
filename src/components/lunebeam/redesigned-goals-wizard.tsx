import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, ArrowRight, Check, Sparkles, Calendar as CalendarIcon, Clock, Users, Heart, Home, Briefcase, GraduationCap, MessageSquare, Building, Star, PartyPopper, X, User, UserPlus, ChevronRight, Gift } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { goalsService, stepsService } from '@/services/goalsService';
import { goalProposalsService } from '@/services/goalProposalsService';
import { supabase } from '@/integrations/supabase/client';
import { PermissionsService } from '@/services/permissionsService';
import type { GoalDomain } from '@/types';
interface RedesignedGoalsWizardProps {
  onComplete: (goalData: any) => void;
  onCancel: () => void;
  initialIndividualId?: string;
  isSupporter?: boolean;
}
interface SupportedIndividual {
  user_id: string;
  first_name: string;
  avatar_url?: string;
}

// Category definitions with icons, explanations, and detailed examples
const categories = [{
  id: 'health',
  title: 'Health & Well Being',
  icon: Heart,
  emoji: '🌱',
  description: 'Build healthy habits for mind and body',
  examples: 'Exercise, sleep better, eat well, manage stress',
  detailedExamples: ['Walk daily for 30 minutes', 'Stretch every morning', 'Sleep 8 hours per night', 'Drink more water', 'Practice meditation', 'Eat healthy meals']
}, {
  id: 'education',
  title: 'Education - High School / Academic Readiness',
  icon: GraduationCap,
  emoji: '📘',
  description: 'Academic skills and school success',
  examples: 'Study habits, homework, test prep, reading',
  detailedExamples: ['Complete homework daily', 'Study for 1 hour each evening', 'Read 30 minutes before bed', 'Take organized notes', 'Practice math problems', 'Prepare for upcoming tests']
}, {
  id: 'employment',
  title: 'Employment',
  icon: Briefcase,
  emoji: '💼',
  description: 'Job skills and career preparation',
  examples: 'Resume, interviews, work skills, networking',
  detailedExamples: ['Update resume weekly', 'Practice interview skills', 'Learn new software', 'Network with professionals', 'Apply for jobs daily', 'Develop work portfolio']
}, {
  id: 'independent_living',
  title: 'Independent Living',
  icon: Home,
  emoji: '🏠',
  description: 'Life skills for independence',
  examples: 'Cooking, cleaning, budgeting, transportation',
  detailedExamples: ['Cook a meal from scratch', 'Clean room weekly', 'Track monthly budget', 'Learn public transportation', 'Do laundry independently', 'Grocery shopping']
}, {
  id: 'social_skills',
  title: 'Social / Self-Advocacy',
  icon: MessageSquare,
  emoji: '🗣️',
  description: 'Communication and relationships',
  examples: 'Making friends, speaking up, teamwork',
  detailedExamples: ['Start conversations with peers', 'Practice speaking up in meetings', 'Join a social group', 'Express needs clearly', 'Work on team projects', 'Build friendships']
}, {
  id: 'postsecondary',
  title: 'Postsecondary - Learning After High School',
  icon: Building,
  emoji: '🎓',
  description: 'College, trade school, or training prep',
  examples: 'College apps, study skills, career planning',
  detailedExamples: ['Research college programs', 'Complete application essays', 'Visit campus tours', 'Apply for scholarships', 'Develop study strategies', 'Plan career path']
}, {
  id: 'fun_recreation',
  title: 'Fun / Recreation',
  icon: PartyPopper,
  emoji: '🎉',
  description: 'Hobbies, interests, and enjoyment',
  examples: 'Sports, music, art, games, social activities',
  detailedExamples: ['Play guitar for 30 minutes', 'Paint or draw weekly', 'Join a sports team', 'Play board games with friends', 'Learn a new hobby', 'Attend social events']
}];

// Goal types
const goalTypes = [{
  id: 'reminder',
  label: 'New Habit (consistency)',
  description: 'Remember to do something regularly'
}, {
  id: 'practice',
  label: 'Leveling Up (improvement)',
  description: 'Improve an existing skill'
}, {
  id: 'new_skill',
  label: 'Brand New Skill',
  description: 'Learn something completely new'
}];

// Experience levels
const experienceLevels = [{
  id: 'first_time',
  label: 'First time',
  description: 'Brand new to this'
}, {
  id: 'learning',
  label: 'Learning',
  description: 'Some experience, still figuring it out'
}, {
  id: 'routine',
  label: 'Routine',
  description: 'Know how, just need consistency'
}];

// Support contexts
const supportContexts = [{
  id: 'alone',
  label: 'Alone',
  description: 'Work on this independently'
}, {
  id: 'parent',
  label: 'With Parent',
  description: 'Parent/guardian helps'
}, {
  id: 'coach',
  label: 'With Coach',
  description: 'Coach or mentor guides'
}, {
  id: 'friend',
  label: 'With Friend',
  description: 'Friend or peer supports'
}];

// Frequency options
const frequencies = [{
  id: 'daily',
  label: 'Daily',
  value: 7
}, {
  id: 'weekdays',
  label: 'Weekdays only',
  value: 5
}, {
  id: 'three_times',
  label: '3 times per week',
  value: 3
}, {
  id: 'twice',
  label: '2 times per week',
  value: 2
}, {
  id: 'weekly',
  label: 'Once per week',
  value: 1
}];

// Time of day options
const timesOfDay = [{
  id: 'morning',
  label: 'Morning',
  description: '6-11 AM'
}, {
  id: 'afternoon',
  label: 'Afternoon',
  description: '12-5 PM'
}, {
  id: 'evening',
  label: 'Evening',
  description: '6-10 PM'
}, {
  id: 'custom',
  label: 'Custom time',
  description: 'Pick specific time'
}];

// Motivation options
const motivations = [{
  id: 'confidence',
  label: 'Confidence',
  description: 'Build self-belief and prove I can do it'
}, {
  id: 'future_skill',
  label: 'Future Skill',
  description: 'Prepare for what comes next in life'
}, {
  id: 'tangible_reward',
  label: 'Tangible Reward',
  description: 'Earn something specific I want'
}, {
  id: 'accountability',
  label: 'Accountability',
  description: 'Keep myself on track and committed'
}];
interface WizardData {
  // Step 0: Who is this for (supporters only)
  recipient: 'self' | 'other';
  supportedPersonId?: string;
  supportedPersonName?: string;
  isMyIdea?: boolean;

  // Step 1: Goal description
  goalTitle: string;
  category?: string;

  // Step 2: Motivation
  goalMotivation?: string;

  // Step 3: Goal type
  goalType?: string;

  // Step 4: Experience level
  experienceLevel?: string;

  // Step 5: Prerequisites
  hasPrerequisites: boolean;

  // Step 6: Scheduling & timing
  startDate: Date;
  endDate?: Date;
  frequency: number;
  timeOfDay?: string;
  customTime?: string;

  // Step 7: Context/Support
  supportContext?: string;
  selectedSupporters?: string[];
  sendReminderToMe?: boolean; // For supporters

  // Step 8: Rewards (supporters only)
  assignReward?: boolean;
  rewardType?: string;
  pointValue?: number;
}
interface SupportedPerson {
  id: string;
  name: string;
}
export const RedesignedGoalsWizard: React.FC<RedesignedGoalsWizardProps> = ({
  onComplete,
  onCancel,
  initialIndividualId,
  isSupporter = false
}) => {
  const [currentStep, setCurrentStep] = useState<number | null>(null); // Start with null to indicate loading
  const [data, setData] = useState<WizardData>({
    recipient: initialIndividualId ? 'other' : 'self',
    supportedPersonId: initialIndividualId,
    goalTitle: '',
    hasPrerequisites: true,
    startDate: new Date(),
    frequency: 3,
    isMyIdea: true
  });
  const [supportedPeople, setSupportedPeople] = useState<SupportedPerson[]>([]);
  const [userSupporters, setUserSupporters] = useState<SupportedPerson[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSupporterDialog, setShowSupporterDialog] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<any>(null);
  const [canAssignDirectly, setCanAssignDirectly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryPageIndex, setCategoryPageIndex] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [tempHour, setTempHour] = useState<string>("08");
  const [tempMinute, setTempMinute] = useState<string>("00");
  const [tempPeriod, setTempPeriod] = useState<"AM" | "PM">("AM");
  const {
    toast
  } = useToast();

  // Load supported people for supporters
  useEffect(() => {
    if (isSupporter) {
      loadSupportedPeople();
    }
    loadUserSupporters();
  }, [isSupporter]);

  // Check permissions when supported person changes
  useEffect(() => {
    if (data.supportedPersonId && data.recipient === 'other') {
      checkAssignPermissions();
    }
  }, [data.supportedPersonId, data.recipient]);

  // Set initial step once isSupporter is determined
  useEffect(() => {
    if (currentStep === null) {
      setCurrentStep(isSupporter ? 0 : 1);
    }
  }, [isSupporter, currentStep]);
  const loadSupportedPeople = async () => {
    try {
      // First, get the supporter relationships
      const {
        data: supporters,
        error: supportersError
      } = await supabase.from('supporters').select('individual_id').eq('supporter_id', (await supabase.auth.getUser()).data.user?.id);
      if (supportersError) throw supportersError;
      if (!supporters || supporters.length === 0) {
        setSupportedPeople([]);
        return;
      }

      // Then get the profile names for those individuals
      const individualIds = supporters.map(s => s.individual_id);
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select('user_id, first_name').in('user_id', individualIds);
      if (profilesError) throw profilesError;

      // Combine the data
      const people = supporters.map(s => {
        const profile = profiles?.find(p => p.user_id === s.individual_id);
        return {
          id: s.individual_id,
          name: profile?.first_name || 'Unknown'
        };
      });
      setSupportedPeople(people);

      // Set initial name if we have an ID
      if (initialIndividualId) {
        const person = people.find(p => p.id === initialIndividualId);
        if (person) {
          setData(prev => ({
            ...prev,
            supportedPersonName: person.name
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load supported people:', error);
    }
  };
  const loadUserSupporters = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data: supporters,
        error
      } = await supabase.from('supporters').select('supporter_id').eq('individual_id', user.id);
      if (error) throw error;
      if (!supporters || supporters.length === 0) {
        setUserSupporters([]);
        return;
      }

      // Get profiles for the supporters
      const supporterIds = supporters.map(s => s.supporter_id);
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select('user_id, first_name').in('user_id', supporterIds);
      if (profilesError) throw profilesError;
      const allies = supporters.map(s => {
        const profile = profiles?.find(p => p.user_id === s.supporter_id);
        return {
          id: s.supporter_id,
          name: profile?.first_name || 'Supporter'
        };
      });
      setUserSupporters(allies);
    } catch (error) {
      console.error('Failed to load user supporters:', error);
    }
  };
  const checkAssignPermissions = async () => {
    if (!data.supportedPersonId) return;
    try {
      const canAssign = await PermissionsService.checkPermission(data.supportedPersonId, 'create_goals');
      setCanAssignDirectly(canAssign);
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setCanAssignDirectly(false);
    }
  };
  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({
      ...prev,
      ...updates
    }));
  };
  const nextStep = () => {
    const maxStep = isSupporter ? 9 : 8;
    if (currentStep < maxStep) {
      setCurrentStep(currentStep + 1);
    }
  };
  const prevStep = () => {
    const minStep = isSupporter ? 0 : 1;
    if (currentStep > minStep) {
      setCurrentStep(currentStep - 1);
    }
  };
  const getStepTitle = () => {
    const supporterTitles = ['Who is this goal for?', 'What do you want to do?', 'Why does this matter?', 'What type of goal?', 'Experience level?', 'Prerequisites check', 'Let\'s make this feel solid! When will you officially START this action?', 'Support context', 'Rewards'];
    const nonSupporterTitles = ['What do you want to do?', 'Why does this matter?', 'What type of goal?', 'Experience level?', 'Prerequisites check', 'Let\'s make this feel solid! When will you officially START this action?', 'Support context'];
    if (isSupporter) {
      return supporterTitles[currentStep] || '';
    } else {
      return nonSupporterTitles[currentStep - 1] || '';
    }
  };
  const canProceed = () => {
    switch (currentStep) {
      case 0:
        // Who is this for (supporters only)
        return data.recipient === 'self' || data.recipient === 'other' && data.supportedPersonId;
      case 1:
        // Goal description
        return data.goalTitle.trim().length > 0;
      case 2:
        // Motivation
        return !!data.goalMotivation;
      case 3:
        // Goal type
        return !!data.goalType;
      case 4:
        // Experience level
        return !!data.experienceLevel;
      case 5:
        // Prerequisites
        return true;
      // Always can proceed
      case 6:
        // Scheduling
        return !!data.frequency && !!data.timeOfDay;
      case 7:
        // Support context
        return !!data.supportContext;
      case 8:
        // Rewards (supporters only)
        return true;
      // Optional step
      default:
        return false;
    }
  };
  const handleCategorySelect = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      // If clicking the same category, either select it or collapse
      if (data.category === categoryId) {
        setExpandedCategory(null);
      } else {
        updateData({
          category: categoryId
        });
        setExpandedCategory(null);
      }
    } else {
      // Expand the category to show details
      setExpandedCategory(categoryId);
    }
  };
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const isProposal = isSupporter && data.recipient === 'other' && !canAssignDirectly;
      const goalData = {
        title: data.goalTitle,
        description: buildGoalDescription(),
        domain: mapCategoryToDomain(data.category) as GoalDomain,
        start_date: format(data.startDate, 'yyyy-MM-dd'),
        due_date: data.endDate ? format(data.endDate, 'yyyy-MM-dd') : undefined,
        frequency_per_week: data.frequency,
        owner_id: data.recipient === 'other' ? data.supportedPersonId : undefined
      };
      if (isProposal) {
        // Create proposal
        await goalProposalsService.createProposal({
          individual_id: data.supportedPersonId!,
          title: data.goalTitle,
          description: goalData.description,
          category: data.category,
          timeline_start: goalData.start_date,
          timeline_end: goalData.due_date,
          frequency_per_week: data.frequency,
          rationale: `Goal type: ${data.goalType}, Experience: ${data.experienceLevel}, Support: ${data.supportContext}`
        });
        toast({
          title: 'Proposal submitted! 📝',
          description: `Sent for review by ${data.supportedPersonName}'s admins.`
        });
      } else {
        // Create goal directly
        const createdGoal = await goalsService.createGoal(goalData);

        // Try AI-powered step generation
        try {
          const {
            stepsGenerator
          } = await import('@/services/stepsGenerator');
          const generatedSteps = await stepsGenerator.generateSteps(createdGoal);

          // Persist AI-generated steps
          for (const step of generatedSteps) {
            await stepsService.createStep(createdGoal.id, {
              title: step.title,
              step_type: 'action',
              is_required: step.is_required ?? true,
              estimated_effort_min: step.estimated_effort_min,
              is_planned: true,
              notes: step.explainer || step.notes
            });
          }
        } catch (stepError: any) {
          console.error('Failed to generate AI steps, using fallback:', stepError);

          // Create fallback steps with notes for help UI
          const stepCount = Math.min(data.frequency, 3);
          const effortMinutes = data.goalTitle.match(/(\d+)\s*min/i)?.[1] || '30';
          try {
            for (let i = 1; i <= stepCount; i++) {
              await stepsService.createStep(createdGoal.id, {
                title: `Week 1, Session ${i}: ${data.goalTitle}`,
                step_type: 'habit',
                is_required: true,
                estimated_effort_min: parseInt(effortMinutes),
                is_planned: true,
                notes: `Complete this session of ${data.goalTitle}. Expand for details or ask for help to break it down further.`
              });
            }
          } catch (fallbackError) {
            console.error('Fallback step creation failed:', fallbackError);
            // Don't block goal creation if steps fail (e.g., RLS for supporters)
            if (data.recipient === 'other') {
              toast({
                title: `Goal assigned to ${data.supportedPersonName}! 🎯`,
                description: 'Steps will appear when they open the goal.'
              });
              return; // Exit early to avoid duplicate toast
            }
          }
        }
        toast({
          title: data.recipient === 'self' ? 'Goal created! 🎯' : `Goal assigned to ${data.supportedPersonName}! 🎯`,
          description: 'Ready to start making progress!'
        });
      }

      // Celebration animation
      setTimeout(() => {
        onComplete({
          title: data.goalTitle,
          description: data.goalTitle,
          // Use title as description for now
          category: data.category,
          frequency_per_week: data.frequency,
          duration_weeks: Math.ceil(data.endDate ? (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7) : 8),
          start_date: data.startDate.toISOString().split('T')[0],
          due_date: data.endDate?.toISOString().split('T')[0],
          assignedTo: data.recipient === 'other' ? data.supportedPersonId : undefined
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const buildGoalDescription = () => {
    const category = categories.find(c => c.id === data.category);
    const type = goalTypes.find(t => t.id === data.goalType);
    const experience = experienceLevels.find(e => e.id === data.experienceLevel);
    const support = supportContexts.find(s => s.id === data.supportContext);
    const motivation = motivations.find(m => m.id === data.goalMotivation);
    let description = data.goalTitle;
    if (motivation) description += ` - Motivated by ${motivation.label.toLowerCase()}`;
    if (type) description += ` (${type.label})`;
    if (experience) description += ` - ${experience.label}`;
    if (support) description += ` with ${support.label.toLowerCase()}`;
    if (data.frequency) description += ` ${data.frequency} times per week`;
    if (data.timeOfDay && data.timeOfDay !== 'custom') {
      const timeLabel = timesOfDay.find(t => t.id === data.timeOfDay)?.label;
      if (timeLabel) description += ` in the ${timeLabel.toLowerCase()}`;
    }
    return description;
  };
  const mapCategoryToDomain = (categoryId?: string) => {
    const mapping: Record<string, GoalDomain> = {
      'health': 'health',
      'education': 'education',
      'employment': 'employment',
      'independent_living': 'independent_living',
      'social_skills': 'social_skills',
      'postsecondary': 'postsecondary',
      'fun_recreation': 'fun_recreation'
    };
    return mapping[categoryId || ''] || 'other' as GoalDomain;
  };
  const formatDisplayTime = (hhmm?: string) => {
    if (!hhmm) return "Pick a starting time";
    const [H, M] = hhmm.split(":").map(Number);
    const period = H >= 12 ? "PM" : "AM";
    const hour12 = H % 12 || 12;
    return `${hour12}:${M.toString().padStart(2, "0")} ${period}`;
  };
  const initTimeDialogFromValue = (hhmm: string) => {
    const [H, M] = hhmm.split(":").map(Number);
    const period: "AM" | "PM" = H >= 12 ? "PM" : "AM";
    const hour12 = H % 12 || 12;
    setTempHour(hour12.toString().padStart(2, "0"));
    setTempMinute(M.toString().padStart(2, "0"));
    setTempPeriod(period);
  };
  const build24hTime = (hour12: number, minute: string, period: "AM" | "PM") => {
    let H = hour12 % 12;
    if (period === "PM") H += 12;
    return `${H.toString().padStart(2, "0")}:${minute}`;
  };
  const renderStep0 = () => <Card className="border-0 shadow-lg min-h-[500px]">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">Choose who will be working on this goal</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button variant={data.recipient === 'self' ? 'default' : 'outline'} className="w-full h-auto p-6 justify-start" onClick={() => updateData({
        recipient: 'self'
      })}>
          <div className="flex items-center gap-4">
            <User className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">For myself</div>
              <div className="text-sm text-muted-foreground">Create a personal goal</div>
            </div>
          </div>
        </Button>
        
        <Button variant={data.recipient === 'other' ? 'default' : 'outline'} className="w-full h-auto p-6 justify-start" onClick={() => updateData({
        recipient: 'other'
      })}>
          <div className="flex items-center gap-4">
            <UserPlus className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">For someone I support</div>
              <div className="text-sm text-muted-light">Create or suggest a goal for them</div>
            </div>
          </div>
        </Button>
        
        {data.recipient === 'other' && <div className="space-y-3 pt-4">
            <Label>Select person:</Label>
            <div className="grid gap-2">
              {supportedPeople.map(person => <Button key={person.id} variant={data.supportedPersonId === person.id ? 'default' : 'outline'} className="justify-start" onClick={() => updateData({
            supportedPersonId: person.id,
            supportedPersonName: person.name
          })}>
                  {person.name}
                </Button>)}
            </div>
            
            {data.supportedPersonId && <div className="space-y-3 pt-4 border-t">
                <Label>Is this your idea or theirs?</Label>
                <div className="flex gap-2">
                  <Button variant={data.isMyIdea ? 'default' : 'outline'} onClick={() => updateData({
              isMyIdea: true
            })}>
                    My idea
                  </Button>
                  <Button variant={!data.isMyIdea ? 'default' : 'outline'} onClick={() => updateData({
              isMyIdea: false
            })}>
                    Their idea
                  </Button>
                </div>
              </div>}
          </div>}
      </CardContent>
    </Card>;
  const renderStep1 = () => <Card className="border-0 shadow-lg min-h-[500px]">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          What's the one concrete action you're choosing to focus on? (Make it clear and specific!)
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          
          <Textarea id="goal-title" placeholder="e.g., Practice guitar for 30 minutes daily" value={data.goalTitle} onChange={e => updateData({
          goalTitle: e.target.value
        })} className="text-lg py-3 min-h-[76px] resize-none" rows={3} />
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Categories</Label>
            <p className="text-xs text-muted-foreground">
              Need a starting spark? Check out these categories for ideas. (It's totally fine to use one for inspiration or skip this part!)
            </p>
          </div>
          
          {/* Category Carousel */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {(() => {
              const sortedCategories = categories.sort((a, b) => a.title.localeCompare(b.title));
              const startIndex = categoryPageIndex * 3;
              const visibleCategories = sortedCategories.slice(startIndex, startIndex + 3);
              return visibleCategories.map(category => <Card key={category.id} className={cn("cursor-pointer hover:shadow-md transition-all border-2", data.category === category.id ? "border-primary bg-primary/5" : expandedCategory === category.id ? "border-primary/50 bg-primary/2" : "border-border")} onClick={() => handleCategorySelect(category.id)}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <category.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{category.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {data.category === category.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                          {expandedCategory === category.id ? <ChevronRight className="h-4 w-4 text-primary rotate-90 transition-transform" /> : <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />}
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedCategory === category.id && <div className="mt-3 pt-3 border-t border-border animate-fade-in">
                          <p className="text-xs font-medium text-foreground mb-2">Goal ideas:</p>
                          <div className="grid grid-cols-1 gap-1">
                            {category.detailedExamples.map((example, index) => <div key={index} className="text-xs text-muted-foreground p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50 transition-colors" onClick={e => {
                        e.stopPropagation();
                        updateData({
                          goalTitle: example,
                          category: category.id
                        });
                        setExpandedCategory(null);
                      }}>
                                • {example}
                              </div>)}
                          </div>
                          
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="default" className="flex-1" onClick={e => {
                        e.stopPropagation();
                        updateData({
                          category: category.id
                        });
                        setExpandedCategory(null);
                      }}>
                              Choose this category
                            </Button>
                          </div>
                        </div>}
                    </CardContent>
                  </Card>);
            })()}
            </div>
            
            {(() => {
            const sortedCategories = categories.sort((a, b) => a.title.localeCompare(b.title));
            const totalPages = Math.ceil(sortedCategories.length / 3);
            const hasMore = categoryPageIndex < totalPages - 1;
            return hasMore ? <Button variant="outline" size="sm" className="w-full" onClick={() => setCategoryPageIndex(prev => prev + 1)}>
                  More categories
                </Button> : <Button variant="outline" size="sm" className="w-full" onClick={() => setCategoryPageIndex(0)}>
                  Show first categories
                </Button>;
          })()}
          </div>
        </div>
      </CardContent>
    </Card>;
  const renderStep2 = () => <Card className="border-0 shadow-lg min-h-[500px]">
      <CardHeader className="text-center pb-4">
        
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">Understanding your motivation helps us support you better</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {motivations.map(motivation => <Button key={motivation.id} type="button" variant={data.goalMotivation === motivation.id ? 'default' : 'outline'} className="w-full h-auto justify-start text-left p-4" onClick={() => updateData({
          goalMotivation: motivation.id
        })}>
              <div className="flex items-start gap-3 w-full">
                <div className="flex-1">
                  <div className="font-semibold">{motivation.label}</div>
                  <div className="text-sm mt-1 opacity-90">{motivation.description}</div>
                </div>
              </div>
            </Button>)}
        </div>
      </CardContent>
    </Card>;
  const renderStep3 = () => <Card className="border-0 shadow-lg min-h-[500px]">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">Let's figure out where you're starting from. This goal is which of the following:</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {goalTypes.map(type => <Button key={type.id} variant={data.goalType === type.id ? 'default' : 'outline'} className="w-full h-auto p-4 justify-start" onClick={() => updateData({
        goalType: type.id
      })}>
            <div className="text-left">
              <div className="font-semibold">{type.label}</div>
              
            </div>
          </Button>)}
      </CardContent>
    </Card>;
  const renderStep4 = () => <Card className="border-0 shadow-lg min-h-[500px]">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">How familiar are you with this activity?</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {experienceLevels.map(level => <Button key={level.id} variant={data.experienceLevel === level.id ? 'default' : 'outline'} className="w-full h-auto p-4 justify-start" onClick={() => updateData({
        experienceLevel: level.id
      })}>
            <div className="text-left">
              <div className="font-semibold">{level.label}</div>
              <div className="text-sm text-muted-foreground">{level.description}</div>
            </div>
          </Button>)}
      </CardContent>
    </Card>;
  const renderStep5 = () => <Card className="border-0 shadow-lg min-h-[500px]">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">Do you already have what you need?</CardTitle>
        <p className="text-muted-foreground">Equipment, knowledge, access, etc.</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button variant={data.hasPrerequisites ? 'default' : 'outline'} className="w-full h-auto p-4 justify-start" onClick={() => updateData({
        hasPrerequisites: true
      })}>
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Yes, I'm ready</div>
              <div className="text-sm text-muted-foreground">I have everything I need to start</div>
            </div>
          </div>
        </Button>
        
        <Button variant={!data.hasPrerequisites ? 'default' : 'outline'} className="w-full h-auto p-4 justify-start" onClick={() => updateData({
        hasPrerequisites: false
      })}>
          <div className="flex items-center gap-3">
            <X className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">No, I need help getting ready</div>
              <div className="text-sm text-muted-foreground">I need prep steps first</div>
            </div>
          </div>
        </Button>
        
        {!data.hasPrerequisites && <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              ✨ We'll auto-suggest prep steps to help you get ready!
            </p>
          </div>}
      </CardContent>
    </Card>;
  const renderStep6 = () => <Card className="border-0 shadow-lg min-h-[500px]">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Time picker */}
        <div className="space-y-2">
          <Label>Pick a starting time</Label>
          <Button type="button" variant="outline" className={cn("w-full justify-start", !data.customTime && "text-muted-foreground")} onClick={() => {
          initTimeDialogFromValue(data.customTime || "08:00");
          setShowTimePicker(true);
        }}>
            <Clock className="h-4 w-4 mr-2" />
            {data.customTime ? formatDisplayTime(data.customTime) : "Pick a starting time"}
          </Button>
        </div>
        
        {/* Date range */}
        <div className="space-y-3">
          <Label>Pick a starting date</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Start date</Label>
              <Popover open={showDatePicker && datePickerType === 'start'} onOpenChange={open => {
              setShowDatePicker(open);
              if (open) setDatePickerType('start');
            }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(data.startDate, 'MMM d')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={data.startDate} onSelect={date => {
                  if (date) {
                    updateData({
                      startDate: date
                    });
                    setShowDatePicker(false);
                  }
                }} disabled={date => date < new Date()} />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">End date (optional)</Label>
              <Popover open={showDatePicker && datePickerType === 'end'} onOpenChange={open => {
              setShowDatePicker(open);
              if (open) setDatePickerType('end');
            }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {data.endDate ? format(data.endDate, 'MMM d') : 'Open'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={data.endDate} onSelect={date => {
                  updateData({
                    endDate: date
                  });
                  setShowDatePicker(false);
                }} disabled={date => date < data.startDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Default: Start today, no end date. You can always adjust later.
          </div>
        </div>
        
        {isSupporter && data.recipient === 'other' && <div className="pt-4 border-t space-y-2">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="reminder-me" checked={data.sendReminderToMe} onChange={e => updateData({
            sendReminderToMe: e.target.checked
          })} className="rounded" />
              <Label htmlFor="reminder-me" className="text-sm">
                Send reminder to me too
              </Label>
            </div>
          </div>}
      </CardContent>
    </Card>;
  const renderStep7 = () => <Card className="border-0 shadow-lg min-h-[500px]">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">Who's on your team?</CardTitle>
        <p className="text-muted-foreground">(It's great to have allies 🤝)</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button variant={data.supportContext === 'alone' ? "default" : "outline"} className="w-full h-auto p-6 justify-start" onClick={() => updateData({
        supportContext: 'alone',
        selectedSupporters: []
      })}>
      <div className="text-left">
        <div className="text-base font-semibold">Alone</div>
        <div className="text-sm text-muted-foreground">I'll work on this independently</div>
      </div>
        </Button>
        
        <Button variant={data.supportContext === 'with_supporters' ? "default" : "outline"} className="w-full h-auto p-6 justify-start" onClick={() => setShowSupporterDialog(true)}>
      <div className="text-left">
        <div className="text-base font-semibold">Select an Ally</div>
        <div className="text-sm text-muted-foreground">
          {data.selectedSupporters && data.selectedSupporters.length > 0 ? `${data.selectedSupporters.length} ${data.selectedSupporters.length === 1 ? 'ally' : 'allies'} selected` : 'Choose your supporters'}
        </div>
      </div>
        </Button>
      </CardContent>
    </Card>;
  const renderStep8 = () => <Card className="border-0 shadow-lg min-h-[500px]">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Rewards (Optional)</CardTitle>
        <p className="text-muted-foreground">Add motivation from your Reward Bank</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button variant={!data.assignReward ? 'default' : 'outline'} className="w-full h-auto p-4 justify-start" onClick={() => updateData({
        assignReward: false
      })}>
          <div className="text-left">
            <div className="font-semibold">No reward</div>
            <div className="text-sm text-muted-foreground">Just the satisfaction of completing it</div>
          </div>
        </Button>
        
        <Button variant={data.assignReward ? 'default' : 'outline'} className="w-full h-auto p-4 justify-start" onClick={() => updateData({
        assignReward: true
      })}>
          <div className="text-left">
            <div className="font-semibold">Add reward</div>
            <div className="text-sm text-muted-foreground">Choose from Reward Bank or create new</div>
          </div>
        </Button>
        
        {data.assignReward && <div className="space-y-3 pt-4 border-t">
            <Label>Point value</Label>
            <div className="grid grid-cols-3 gap-2">
              {[{
            value: 5,
            label: 'Small',
            desc: '5 pts'
          }, {
            value: 10,
            label: 'Medium',
            desc: '10 pts'
          }, {
            value: 20,
            label: 'Large',
            desc: '20 pts'
          }].map(point => <Button key={point.value} variant={data.pointValue === point.value ? 'default' : 'outline'} className="h-auto p-3" onClick={() => updateData({
            pointValue: point.value
          })}>
                  <div className="text-center">
                    <div className="font-semibold">{point.label}</div>
                    <div className="text-xs text-muted-foreground">{point.desc}</div>
                  </div>
                </Button>)}
            </div>
          </div>}
      </CardContent>
    </Card>;
  const renderConfirmStep = () => {
    const isProposal = isSupporter && data.recipient === 'other' && !canAssignDirectly;
    return <Card className="border-0 shadow-lg min-h-[500px]">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Confirm</CardTitle>
          <p className="text-muted-foreground">
            Here's your action plan for this goal.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Goal Preview Card */}
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-foreground">Goal:</span>
                <span className="text-sm text-right flex-1 ml-4 font-semibold">{data.goalTitle}</span>
              </div>
              
              {data.category && <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Category:</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {categories.find(c => c.id === data.category)?.emoji} {categories.find(c => c.id === data.category)?.title}
                  </Badge>
                </div>}
              
              {data.goalType && <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Type:</span>
                  <span className="text-sm text-primary font-medium">
                    {goalTypes.find(t => t.id === data.goalType)?.label}
                  </span>
                </div>}
              
              {data.experienceLevel && <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Level:</span>
                  <span className="text-sm text-primary font-medium">
                    {experienceLevels.find(e => e.id === data.experienceLevel)?.label}
                  </span>
                </div>}
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Action Plan</span>
                <span className="text-sm text-primary font-medium">
                  {data.frequency} times per week
                  {data.timeOfDay && data.timeOfDay !== 'custom' && <span>, {timesOfDay.find(t => t.id === data.timeOfDay)?.label.toLowerCase()}</span>}
                  {data.timeOfDay === 'custom' && data.customTime && <span>, at {data.customTime}</span>}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Timeline:</span>
                <span className="text-sm text-primary font-medium">
                  {format(data.startDate, 'MMM d')}
                  {data.endDate && ` - ${format(data.endDate, 'MMM d, yyyy')}`}
                  {!data.endDate && ' (ongoing)'}
                </span>
              </div>
              
              {data.supportContext && <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Support:</span>
                  <span className="text-sm text-primary font-medium">
                    {data.supportContext === 'alone' && 'Working alone'}
                    {data.supportContext === 'with_supporters' && data.selectedSupporters && data.selectedSupporters.length > 0 && `With ${data.selectedSupporters.map(id => userSupporters.find(s => s.id === id)?.name || 'Unknown').join(', ')}`}
                    {data.supportContext === 'with_supporters' && (!data.selectedSupporters || data.selectedSupporters.length === 0) && 'With supporters'}
                  </span>
                </div>}
            </div>
          </div>
          
          {/* First Micro-steps Preview */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">First steps to get started:</h4>
            <div className="space-y-2">
              {[`Set up your ${data.goalTitle.toLowerCase()} space`, `Plan your first session`, `Track your progress`].map((step, index) => <div key={index} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">{index + 1}</span>
                  </div>
                  <span className="text-sm text-foreground">{step}</span>
                </div>)}
            </div>
          </div>
          
          {isProposal && <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 This goal will be sent as a proposal since you don't have direct assignment permissions for {data.supportedPersonName}.
              </p>
            </div>}
          
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(isSupporter ? 7 : 6)} // Go back to previous step
          className="flex-1">
              Edit
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-12 text-lg font-semibold">
              {loading ? 'Creating...' : isProposal ? 'Confirm Proposal' : 'Confirm Goal'}
            </Button>
          </div>
        </CardContent>
      </Card>;
  };
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep0();
      // Who is this for (supporters only)
      case 1:
        return renderStep1();
      // Goal description
      case 2:
        return renderStep2();
      // Motivation
      case 3:
        return renderStep3();
      // Goal type
      case 4:
        return renderStep4();
      // Experience level
      case 5:
        return renderStep5();
      // Prerequisites
      case 6:
        return renderStep6();
      // Scheduling
      case 7:
        return renderStep7();
      // Support context
      case 8:
        return isSupporter ? renderStep8() : renderConfirmStep();
      // Rewards or confirm
      case 9:
        return renderConfirmStep();
      // Final confirm (supporters only)
      default:
        return null;
    }
  };
  const lastStepIndex = isSupporter ? 9 : 8;
  const totalSteps = isSupporter ? 10 : 8;
  const currentStepDisplay = isSupporter ? currentStep! + 1 : currentStep!;
  const isLastStep = currentStep === lastStepIndex;

  // Show loading state while determining initial step
  if (currentStep === null) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto py-6 space-y-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={currentStep === (isSupporter ? 0 : 1) ? onCancel : prevStep} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Goals Wizard</h1>
            <p className="text-sm text-muted-foreground">
              Step {currentStepDisplay} of {totalSteps}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{
          width: `${currentStepDisplay / totalSteps * 100}%`
        }} />
        </div>
        
        {/* Current Step - fixed height container */}
        <div style={{
        minHeight: '500px'
      }}>
          {renderCurrentStep()}
        </div>
        
        {/* Navigation - right underneath */}
        {!isLastStep && <Button onClick={nextStep} disabled={!canProceed()} className="w-full h-12 text-lg font-semibold">
            Continue
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>}
        
        {/* Category Selection Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose a category</DialogTitle>
            </DialogHeader>
            
            <Carousel className="w-full">
              <CarouselContent>
                {Array.from({
                length: Math.ceil(categories.length / 3)
              }, (_, i) => <CarouselItem key={i}>
                    <div className="grid grid-cols-1 gap-4 p-1">
                      {categories.slice(i * 3, (i + 1) * 3).map(category => <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCategorySelect(category.id)}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <category.icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm">{category.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                                <p className="text-xs text-primary mt-2">Examples: {category.examples}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>)}
                    </div>
                  </CarouselItem>)}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </DialogContent>
        </Dialog>
        
        {/* Supporter Selection Dialog */}
        <Dialog open={showSupporterDialog} onOpenChange={setShowSupporterDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Your Allies</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {userSupporters.length === 0 ? <div className="text-center py-8 px-4">
                  <p className="text-muted-foreground mb-2">
                    You have no supporters yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can invite people to cheer for you in the Community tab.
                  </p>
                </div> : <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {userSupporters.map(supporter => <Button key={supporter.id} variant={(data.selectedSupporters || []).includes(supporter.id) ? 'default' : 'outline'} className="w-full justify-start" onClick={() => {
                const currentSelection = data.selectedSupporters || [];
                const isSelected = currentSelection.includes(supporter.id);
                const newSelection = isSelected ? currentSelection.filter(id => id !== supporter.id) : [...currentSelection, supporter.id];
                updateData({
                  selectedSupporters: newSelection,
                  supportContext: newSelection.length > 0 ? 'with_supporters' : 'alone'
                });
              }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4" />
                        </div>
                        <span>{supporter.name}</span>
                      </div>
                    </Button>)}
                </div>}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSupporterDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowSupporterDialog(false)} disabled={!data.selectedSupporters || data.selectedSupporters.length === 0}>
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Custom Time Picker Dialog */}
        <Dialog open={showTimePicker} onOpenChange={setShowTimePicker}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Pick a time</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 p-4">
              <Label>Select time</Label>
              <div className="grid grid-cols-3 gap-3">
                {/* Hour */}
                <Select value={tempHour} onValueChange={setTempHour}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {[...Array(12)].map((_, i) => {
                    const h = (i + 1).toString().padStart(2, "0");
                    return <SelectItem key={h} value={h}>{h}</SelectItem>;
                  })}
                  </SelectContent>
                </Select>

                {/* Minute */}
                <Select value={tempMinute} onValueChange={setTempMinute}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {Array.from({
                    length: 12
                  }, (_, i) => (i * 5).toString().padStart(2, "0")).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* AM/PM */}
                <Select value={tempPeriod} onValueChange={(v: "AM" | "PM") => setTempPeriod(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => {
                updateData({
                  customTime: '',
                  timeOfDay: undefined
                });
                setShowTimePicker(false);
              }}>
                  Clear
                </Button>
                <Button className="flex-1" disabled={!tempHour || !tempMinute || !tempPeriod} onClick={() => {
                const time24 = build24hTime(parseInt(tempHour, 10), tempMinute, tempPeriod);
                updateData({
                  customTime: time24,
                  timeOfDay: 'custom'
                });
                setShowTimePicker(false);
              }}>
                  Confirm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};