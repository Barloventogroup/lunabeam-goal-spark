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
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Heart,
  Home,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Building,
  Star,
  PartyPopper,
  X,
  User,
  UserPlus,
  ChevronRight,
  Gift
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { goalsService } from '@/services/goalsService';
import { goalProposalsService } from '@/services/goalProposalsService';
import { supabase } from '@/integrations/supabase/client';
import { PermissionsService } from '@/services/permissionsService';
import type { GoalDomain } from '@/types';

interface RedesignedGoalsWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  initialIndividualId?: string;
  isSupporter?: boolean;
}

// Category definitions with icons and explanations
const categories = [
  {
    id: 'health',
    title: 'Health & Well Being',
    icon: Heart,
    emoji: '🌱',
    description: 'Build healthy habits for mind and body',
    examples: 'Exercise, sleep better, eat well, manage stress'
  },
  {
    id: 'education',
    title: 'Education - High School / Academic Readiness',
    icon: GraduationCap,
    emoji: '📘',
    description: 'Academic skills and school success',
    examples: 'Study habits, homework, test prep, reading'
  },
  {
    id: 'employment',
    title: 'Employment',
    icon: Briefcase,
    emoji: '💼',
    description: 'Job skills and career preparation',
    examples: 'Resume, interviews, work skills, networking'
  },
  {
    id: 'independent_living',
    title: 'Independent Living',
    icon: Home,
    emoji: '🏠',
    description: 'Life skills for independence',
    examples: 'Cooking, cleaning, budgeting, transportation'
  },
  {
    id: 'social_skills',
    title: 'Social / Self-Advocacy',
    icon: MessageSquare,
    emoji: '🗣️',
    description: 'Communication and relationships',
    examples: 'Making friends, speaking up, teamwork'
  },
  {
    id: 'postsecondary',
    title: 'Postsecondary - Learning After High School',
    icon: Building,
    emoji: '🎓',
    description: 'College, trade school, or training prep',
    examples: 'College apps, study skills, career planning'
  },
  {
    id: 'fun_recreation',
    title: 'Fun / Recreation',
    icon: PartyPopper,
    emoji: '🎉',
    description: 'Hobbies, interests, and enjoyment',
    examples: 'Sports, music, art, games, social activities'
  }
];

// Goal types
const goalTypes = [
  { id: 'reminder', label: 'Reminder', description: 'Remember to do something regularly' },
  { id: 'practice', label: 'Practice & Variation', description: 'Improve an existing skill' },
  { id: 'new_skill', label: 'New Skill', description: 'Learn something completely new' }
];

// Experience levels
const experienceLevels = [
  { id: 'first_time', label: 'First time', description: 'Brand new to this' },
  { id: 'learning', label: 'Learning', description: 'Some experience, still figuring it out' },
  { id: 'routine', label: 'Routine', description: 'Know how, just need consistency' }
];

// Support contexts
const supportContexts = [
  { id: 'alone', label: 'Alone', description: 'Work on this independently' },
  { id: 'parent', label: 'With Parent', description: 'Parent/guardian helps' },
  { id: 'coach', label: 'With Coach', description: 'Coach or mentor guides' },
  { id: 'friend', label: 'With Friend', description: 'Friend or peer supports' }
];

// Frequency options
const frequencies = [
  { id: 'daily', label: 'Daily', value: 7 },
  { id: 'weekdays', label: 'Weekdays only', value: 5 },
  { id: 'three_times', label: '3 times per week', value: 3 },
  { id: 'twice', label: '2 times per week', value: 2 },
  { id: 'weekly', label: 'Once per week', value: 1 }
];

// Time of day options
const timesOfDay = [
  { id: 'morning', label: 'Morning', description: '6-11 AM' },
  { id: 'afternoon', label: 'Afternoon', description: '12-5 PM' },
  { id: 'evening', label: 'Evening', description: '6-10 PM' },
  { id: 'custom', label: 'Custom time', description: 'Pick specific time' }
];

interface WizardData {
  // Step 0: Who is this for (supporters only)
  recipient: 'self' | 'other';
  supportedPersonId?: string;
  supportedPersonName?: string;
  isMyIdea?: boolean;
  
  // Step 1: Goal description
  goalTitle: string;
  category?: string;
  
  // Step 2: Goal type
  goalType?: string;
  
  // Step 3: Experience level
  experienceLevel?: string;
  
  // Step 4: Prerequisites
  hasPrerequisites: boolean;
  
  // Step 5: Scheduling & timing
  startDate: Date;
  endDate?: Date;
  frequency: number;
  timeOfDay?: string;
  customTime?: string;
  
  // Step 6: Context/Support
  supportContext?: string;
  sendReminderToMe?: boolean; // For supporters
  
  // Step 7: Rewards (supporters only)
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
  const [currentStep, setCurrentStep] = useState(isSupporter ? 0 : 1);
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
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<any>(null);
  const [canAssignDirectly, setCanAssignDirectly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryPageIndex, setCategoryPageIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  
  const { toast } = useToast();
  
  // Load supported people for supporters
  useEffect(() => {
    if (isSupporter) {
      loadSupportedPeople();
    }
  }, [isSupporter]);
  
  // Check permissions when supported person changes
  useEffect(() => {
    if (data.supportedPersonId && data.recipient === 'other') {
      checkAssignPermissions();
    }
  }, [data.supportedPersonId, data.recipient]);
  
  const loadSupportedPeople = async () => {
    try {
      const { data: supporters, error } = await supabase
        .from('supporters')
        .select(`
          individual_id,
          profiles!supporters_individual_id_fkey(first_name)
        `)
        .eq('supporter_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      const people = (supporters || []).map(s => ({
        id: s.individual_id,
        name: (s as any).profiles?.first_name || 'Unknown'
      }));

      setSupportedPeople(people);
      
      // Set initial name if we have an ID
      if (initialIndividualId) {
        const person = people.find(p => p.id === initialIndividualId);
        if (person) {
          setData(prev => ({ ...prev, supportedPersonName: person.name }));
        }
      }
    } catch (error) {
      console.error('Failed to load supported people:', error);
    }
  };
  
  const checkAssignPermissions = async () => {
    if (!data.supportedPersonId) return;
    
    try {
      const canAssign = await PermissionsService.checkPermission(
        data.supportedPersonId,
        'create_goals'
      );
      setCanAssignDirectly(canAssign);
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setCanAssignDirectly(false);
    }
  };
  
  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };
  
  const nextStep = () => {
    const maxStep = isSupporter ? 7 : 6;
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
    const stepTitles = isSupporter 
      ? [
          'Who is this goal for?',
          'What do you want them to do?',
          'What type of goal?',
          'Experience level?',
          'Prerequisites check',
          'Scheduling & timing',
          'Support context',
          'Rewards'
        ]
      : [
          'What do you want to do?',
          'What type of goal?',
          'Experience level?',
          'Prerequisites check',
          'Scheduling & timing',
          'Support context'
        ];
    
    return stepTitles[currentStep] || '';
  };
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: // Who is this for (supporters only)
        return data.recipient === 'self' || (data.recipient === 'other' && data.supportedPersonId);
      case 1: // Goal description
        return data.goalTitle.trim().length > 0;
      case 2: // Goal type
        return !!data.goalType;
      case 3: // Experience level
        return !!data.experienceLevel;
      case 4: // Prerequisites
        return true; // Always can proceed
      case 5: // Scheduling
        return !!data.frequency && !!data.timeOfDay;
      case 6: // Support context
        return !!data.supportContext;
      case 7: // Rewards (supporters only)
        return true; // Optional step
      default:
        return false;
    }
  };
  
  const handleCategorySelect = (categoryId: string) => {
    updateData({ category: categoryId });
    setShowCategoryDialog(false);
    // Auto-classify if they typed something
    if (!data.goalTitle.includes(categories.find(c => c.id === categoryId)?.title || '')) {
      // Could trigger AI classification here if needed
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
        frequency_per_week: data.frequency
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
        await goalsService.createGoal(goalData);
        
        toast({
          title: data.recipient === 'self' ? 'Goal created! 🎯' : `Goal assigned to ${data.supportedPersonName}! 🎯`,
          description: 'Ready to start making progress!'
        });
      }
      
      // Celebration animation
      setTimeout(() => {
        onComplete();
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
    
    let description = data.goalTitle;
    
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
  
  const renderStep0 = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">Choose who will be working on this goal</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button
          variant={data.recipient === 'self' ? 'default' : 'outline'}
          className="w-full h-auto p-6 justify-start"
          onClick={() => updateData({ recipient: 'self' })}
        >
          <div className="flex items-center gap-4">
            <User className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">For myself</div>
              <div className="text-sm text-muted-foreground">Create a personal goal</div>
            </div>
          </div>
        </Button>
        
        <Button
          variant={data.recipient === 'other' ? 'default' : 'outline'}
          className="w-full h-auto p-6 justify-start"
          onClick={() => updateData({ recipient: 'other' })}
        >
          <div className="flex items-center gap-4">
            <UserPlus className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">For someone I support</div>
              <div className="text-sm text-muted-foreground">Create or suggest a goal for them</div>
            </div>
          </div>
        </Button>
        
        {data.recipient === 'other' && (
          <div className="space-y-3 pt-4">
            <Label>Select person:</Label>
            <div className="grid gap-2">
              {supportedPeople.map(person => (
                <Button
                  key={person.id}
                  variant={data.supportedPersonId === person.id ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => updateData({ 
                    supportedPersonId: person.id,
                    supportedPersonName: person.name 
                  })}
                >
                  {person.name}
                </Button>
              ))}
            </div>
            
            {data.supportedPersonId && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Is this your idea or theirs?</Label>
                <div className="flex gap-2">
                  <Button
                    variant={data.isMyIdea ? 'default' : 'outline'}
                    onClick={() => updateData({ isMyIdea: true })}
                  >
                    My idea
                  </Button>
                  <Button
                    variant={!data.isMyIdea ? 'default' : 'outline'}
                    onClick={() => updateData({ isMyIdea: false })}
                  >
                    Their idea
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  const renderStep1 = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">
          {isSupporter && data.recipient === 'other' 
            ? `What would you like ${data.supportedPersonName} to work on?`
            : "Describe what you want to achieve"
          }
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="goal-title">Goal description *</Label>
          <Input
            id="goal-title"
            placeholder="e.g., Practice guitar for 30 minutes daily"
            value={data.goalTitle}
            onChange={(e) => updateData({ goalTitle: e.target.value })}
            className="text-lg"
          />
        </div>
        
        <div className="space-y-4">
          <Label>Categories</Label>
          
          {/* Category Carousel */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {(() => {
                const sortedCategories = categories.sort((a, b) => a.title.localeCompare(b.title));
                const startIndex = categoryPageIndex * 3;
                const visibleCategories = sortedCategories.slice(startIndex, startIndex + 3);
                
                return visibleCategories.map(category => (
                  <Card 
                    key={category.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all border-2",
                      data.category === category.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <category.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{category.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                        </div>
                        {data.category === category.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
            
            {(() => {
              const sortedCategories = categories.sort((a, b) => a.title.localeCompare(b.title));
              const totalPages = Math.ceil(sortedCategories.length / 3);
              const hasMore = categoryPageIndex < totalPages - 1;
              
              return hasMore ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => setCategoryPageIndex(prev => prev + 1)}
                >
                  More categories
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => setCategoryPageIndex(0)}
                >
                  Show first categories
                </Button>
              );
            })()}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Categories help organize your goals. If you skip this, we'll auto-classify your goal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
  
  const renderStep2 = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">This helps us provide better guidance</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {goalTypes.map(type => (
          <Button
            key={type.id}
            variant={data.goalType === type.id ? 'default' : 'outline'}
            className="w-full h-auto p-4 justify-start"
            onClick={() => updateData({ goalType: type.id })}
          >
            <div className="text-left">
              <div className="font-semibold">{type.label}</div>
              <div className="text-sm text-muted-foreground">{type.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
  
  const renderStep3 = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">How familiar are you with this activity?</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {experienceLevels.map(level => (
          <Button
            key={level.id}
            variant={data.experienceLevel === level.id ? 'default' : 'outline'}
            className="w-full h-auto p-4 justify-start"
            onClick={() => updateData({ experienceLevel: level.id })}
          >
            <div className="text-left">
              <div className="font-semibold">{level.label}</div>
              <div className="text-sm text-muted-foreground">{level.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
  
  const renderStep4 = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">Do you already have what you need?</CardTitle>
        <p className="text-muted-foreground">Equipment, knowledge, access, etc.</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button
          variant={data.hasPrerequisites ? 'default' : 'outline'}
          className="w-full h-auto p-4 justify-start"
          onClick={() => updateData({ hasPrerequisites: true })}
        >
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Yes, I'm ready</div>
              <div className="text-sm text-muted-foreground">I have everything I need to start</div>
            </div>
          </div>
        </Button>
        
        <Button
          variant={!data.hasPrerequisites ? 'default' : 'outline'}
          className="w-full h-auto p-4 justify-start"
          onClick={() => updateData({ hasPrerequisites: false })}
        >
          <div className="flex items-center gap-3">
            <X className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">No, I need help getting ready</div>
              <div className="text-sm text-muted-foreground">I need prep steps first</div>
            </div>
          </div>
        </Button>
        
        {!data.hasPrerequisites && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              ✨ We'll auto-suggest prep steps to help you get ready!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  const renderStep5 = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
        <p className="text-muted-foreground">Set your schedule and timing</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Frequency */}
        <div className="space-y-3">
          <Label>How often?</Label>
          <div className="grid grid-cols-1 gap-2">
            {frequencies.map(freq => (
              <Button
                key={freq.id}
                variant={data.frequency === freq.value ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => updateData({ frequency: freq.value })}
              >
                {freq.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Time of day */}
        <div className="space-y-3">
          <Label>When during the day?</Label>
          <div className="grid grid-cols-2 gap-2">
            {timesOfDay.map(time => (
              <Button
                key={time.id}
                variant={data.timeOfDay === time.id ? 'default' : 'outline'}
                className="h-auto p-3"
                onClick={() => updateData({ timeOfDay: time.id })}
              >
                <div className="text-center">
                  <div className="font-semibold">{time.label}</div>
                  <div className="text-xs text-muted-foreground">{time.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Date range */}
        <div className="space-y-3">
          <Label>Timeline</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Start date</Label>
              <Popover open={showDatePicker && datePickerType === 'start'} onOpenChange={(open) => {
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
                  <Calendar
                    mode="single"
                    selected={data.startDate}
                    onSelect={(date) => {
                      if (date) {
                        updateData({ startDate: date });
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">End date (optional)</Label>
              <Popover open={showDatePicker && datePickerType === 'end'} onOpenChange={(open) => {
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
                  <Calendar
                    mode="single"
                    selected={data.endDate}
                    onSelect={(date) => {
                      updateData({ endDate: date });
                      setShowDatePicker(false);
                    }}
                    disabled={(date) => date < data.startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Default: Start today, no end date. You can always adjust later.
          </div>
        </div>
        
        {isSupporter && data.recipient === 'other' && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reminder-me"
                checked={data.sendReminderToMe}
                onChange={(e) => updateData({ sendReminderToMe: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="reminder-me" className="text-sm">
                Send reminder to me too
              </Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  const renderStep6 = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">Who supports this goal?</CardTitle>
        <p className="text-muted-foreground">Choose your support system</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {supportContexts.map(context => (
          <Button
            key={context.id}
            variant={data.supportContext === context.id ? 'default' : 'outline'}
            className="w-full h-auto p-4 justify-start"
            onClick={() => updateData({ supportContext: context.id })}
          >
            <div className="text-left">
              <div className="font-semibold">{context.label}</div>
              <div className="text-sm text-muted-foreground">{context.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
  
  const renderStep7 = () => (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Rewards (Optional)</CardTitle>
        <p className="text-muted-foreground">Add motivation from your Reward Bank</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button
          variant={!data.assignReward ? 'default' : 'outline'}
          className="w-full h-auto p-4 justify-start"
          onClick={() => updateData({ assignReward: false })}
        >
          <div className="text-left">
            <div className="font-semibold">No reward</div>
            <div className="text-sm text-muted-foreground">Just the satisfaction of completing it</div>
          </div>
        </Button>
        
        <Button
          variant={data.assignReward ? 'default' : 'outline'}
          className="w-full h-auto p-4 justify-start"
          onClick={() => updateData({ assignReward: true })}
        >
          <div className="text-left">
            <div className="font-semibold">Add reward</div>
            <div className="text-sm text-muted-foreground">Choose from Reward Bank or create new</div>
          </div>
        </Button>
        
        {data.assignReward && (
          <div className="space-y-3 pt-4 border-t">
            <Label>Point value</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 5, label: 'Small', desc: '5 pts' },
                { value: 10, label: 'Medium', desc: '10 pts' },
                { value: 20, label: 'Large', desc: '20 pts' }
              ].map(point => (
                <Button
                  key={point.value}
                  variant={data.pointValue === point.value ? 'default' : 'outline'}
                  className="h-auto p-3"
                  onClick={() => updateData({ pointValue: point.value })}
                >
                  <div className="text-center">
                    <div className="font-semibold">{point.label}</div>
                    <div className="text-xs text-muted-foreground">{point.desc}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  const renderConfirmStep = () => {
    const isProposal = isSupporter && data.recipient === 'other' && !canAssignDirectly;
    
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">
            {isProposal ? 'Review & Submit Proposal' : 'Review & Create Goal'}
          </CardTitle>
          <p className="text-muted-foreground">
            {isProposal 
              ? `This will be sent to ${data.supportedPersonName}'s admins for approval`
              : 'Everything looks good! Ready to start?'
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Goal:</span>
              <span className="text-sm text-right flex-1 ml-4">{data.goalTitle}</span>
            </div>
            
            {data.category && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Category:</span>
                <Badge variant="secondary">
                  {categories.find(c => c.id === data.category)?.emoji} {categories.find(c => c.id === data.category)?.title}
                </Badge>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-sm font-medium">Frequency:</span>
              <span className="text-sm">{data.frequency} times per week</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium">Start:</span>
              <span className="text-sm">{format(data.startDate, 'MMM d, yyyy')}</span>
            </div>
            
            {data.endDate && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">End:</span>
                <span className="text-sm">{format(data.endDate, 'MMM d, yyyy')}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-sm font-medium">Support:</span>
              <span className="text-sm">{supportContexts.find(s => s.id === data.supportContext)?.label}</span>
            </div>
          </div>
          
          {isProposal && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 This goal will be sent as a proposal since you don't have direct assignment permissions for {data.supportedPersonName}.
              </p>
            </div>
          )}
          
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold"
          >
            {loading ? (
              'Creating...'
            ) : isProposal ? (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Submit Proposal
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Create Goal
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderStep0(); // Who is this for (supporters only)
      case 1: return renderStep1(); // Goal description
      case 2: return renderStep2(); // Goal type
      case 3: return renderStep3(); // Experience level
      case 4: return renderStep4(); // Prerequisites
      case 5: return renderStep5(); // Scheduling
      case 6: return renderStep6(); // Support context
      case 7: return isSupporter ? renderStep7() : renderConfirmStep(); // Rewards or confirm
      case 8: return renderConfirmStep(); // Final confirm (supporters only)
      default: return null;
    }
  };
  
  const maxStep = isSupporter ? 8 : 7;
  const isLastStep = currentStep === maxStep - 1;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={currentStep === (isSupporter ? 0 : 1) ? onCancel : prevStep}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Goals Wizard</h1>
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {maxStep}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${((currentStep + 1) / maxStep) * 100}%` }}
          />
        </div>
        
        {/* Current Step */}
        {renderCurrentStep()}
        
        {/* Navigation */}
        {!isLastStep && (
          <Button 
            onClick={nextStep}
            disabled={!canProceed()}
            className="w-full h-12 text-lg font-semibold"
          >
            Continue
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        )}
        
        {/* Category Selection Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Choose a category</DialogTitle>
            </DialogHeader>
            
            <Carousel className="w-full">
              <CarouselContent>
                {Array.from({ length: Math.ceil(categories.length / 3) }, (_, i) => (
                  <CarouselItem key={i}>
                    <div className="grid grid-cols-1 gap-4 p-1">
                      {categories.slice(i * 3, (i + 1) * 3).map(category => (
                        <Card 
                          key={category.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleCategorySelect(category.id)}
                        >
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
                        </Card>
                      ))}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};