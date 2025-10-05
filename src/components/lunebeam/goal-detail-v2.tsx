import React, { useEffect, useState } from 'react';
import { Calendar, MoreVertical, Trash2, CheckCircle2, UserPlus, Share2, Edit, Users, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { goalsService, stepsService } from '@/services/goalsService';
import { getDomainDisplayName } from '@/utils/domainUtils';
import { supabase } from '@/integrations/supabase/client';
import { generateMicroStepsSmart } from '@/services/microStepsGenerator';
import { StepsList } from './steps-list';
import { StepsChat } from './steps-chat';
import { StepChatModal } from './step-chat-modal';
import { ProgressBar } from './progress-bar';
import { GoalEditModal } from './goal-edit-modal';
import { CircularProgress } from '@/components/ui/circular-progress';
import type { Goal, Step, GoalProgress } from '@/types';

interface GoalDetailV2Props {
  goalId: string;
  onBack: () => void;
}

export const GoalDetailV2: React.FC<GoalDetailV2Props> = ({ goalId, onBack }) => {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showStepChat, setShowStepChat] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [chatStep, setChatStep] = useState<Step | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [generatingSteps, setGeneratingSteps] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGoalData();
  }, [goalId]);

  useEffect(() => {
    // Auto-generate steps for new goals
    if (goal && steps.length === 0 && (goal as any).metadata?.wizardContext && !generatingSteps && !generationError) {
      generateStepsForNewGoal();
    }
  }, [goal, steps]);

  const calculateProgress = (goalSteps: Step[]): GoalProgress => {
    const actionableSteps = goalSteps.filter(s => (!s.type || s.type === 'action') && !s.hidden && s.status !== 'skipped');
    const doneSteps = actionableSteps.filter(s => s.status === 'done');
    
    console.log('Goal progress calculation debug:', {
      totalSteps: goalSteps.length,
      actionableSteps: actionableSteps.length,
      doneSteps: doneSteps.length,
      actionableStepsDetails: actionableSteps.map(s => ({ id: s.id, title: s.title, status: s.status, type: s.type, hidden: s.hidden }))
    });
    
    return {
      done: doneSteps.length,
      actionable: actionableSteps.length,
      percent: actionableSteps.length > 0 ? Math.round((doneSteps.length / actionableSteps.length) * 100) : 0
    };
  };

  const loadGoalData = async () => {
    try {
      setLoading(true);
      
      // Get current user and goal data
      const [{ data: { user } }, goalData, stepsData] = await Promise.all([
        supabase.auth.getUser(),
        goalsService.getGoal(goalId),
        stepsService.getSteps(goalId)
      ]);
      
      setCurrentUser(user);

      if (goalData) {
        // Fetch owner and creator profiles
        const [ownerData, creatorData] = await Promise.all([
          supabase.from('profiles').select('first_name, user_id').eq('user_id', goalData.owner_id).single(),
          supabase.from('profiles').select('first_name, user_id').eq('user_id', goalData.created_by).single()
        ]);
        
        setOwnerProfile(ownerData.data);
        setCreatorProfile(creatorData.data);
        
        // Use steps as-is, no auto-generation
        const finalSteps = stepsData || [];

        const progress = calculateProgress(finalSteps);
        setGoal({ ...goalData, progress });
        setSteps(finalSteps);
      } else {
        toast({
          title: "Goal not found",
          description: "This goal might have been deleted or you don't have access to it.",
          variant: "destructive",
        });
        onBack();
      }
    } catch (error) {
      console.error('Failed to load goal:', error);
      toast({
        title: "Failed to load goal",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepsUpdate = (updatedSteps: Step[], updatedGoal: Goal) => {
    const progress = calculateProgress(updatedSteps);
    setSteps(updatedSteps);
    setGoal({ ...updatedGoal, progress });
  };

  const handleOpenStepChat = (step: Step) => {
    setSelectedStep(step);
    setShowStepChat(true);
  };

  const handleStepChatUpdate = async (newSteps: Step[]) => {
    // Reload steps from database to get the latest data
    try {
      const updatedSteps = await stepsService.getSteps(goalId);
      const progress = calculateProgress(updatedSteps);
      setSteps(updatedSteps);
      if (goal) {
        setGoal({ ...goal, progress });
      }
    } catch (error) {
      console.error('Failed to reload steps:', error);
    }
  };

  const handleGoalUpdate = (updatedGoal: Goal) => {
    setGoal({
      ...updatedGoal,
      progress: goal?.progress // Preserve existing progress data
    });
  };

  const handleDeleteGoal = async () => {
    try {
      await goalsService.deleteGoal(goalId);
      toast({
        description: "Goal archived successfully."
      });
      onBack();
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast({
        title: "Failed to archive goal",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const sanitizeDescription = (text?: string): string => {
    if (!text) return '';
    let out = text.trim();
    
    // Fix frequency patterns
    out = out.replace(/(\d+)x\/week/gi, '$1 times per week');
    out = out.replace(/Daily for (\d+) times per week/gi, '$1 times per week');
    out = out.replace(/Daily for (\d+)x\/week/gi, '$1 times per week');
    
    // Fix double parentheses and nested structures
    out = out.replace(/\(\s*\([^)]+\)\s*\)/g, (match) => {
      const inner = match.replace(/^\(\s*\(/, '(').replace(/\)\s*\)$/, ')');
      return inner;
    });
    
    // Remove outer parentheses around trailing "with ..." clauses
    out = out.replace(/\.?\s*\((with [^)]+)\)\s*$/i, '. $1');
    
    // Fix awkward "to relax/enjoy" patterns
    out = out.replace(/to relax\/enjoy/gi, 'to relax and enjoy');
    
    // Fix standalone "with" clauses at the end
    out = out.replace(/\.\s*with\s+([A-Z])/g, ' with $1');
    
    // Fix double spaces and ensure proper spacing
    out = out.replace(/\s{2,}/g, ' ');
    out = out.replace(/\s*\.\s*\./g, '.');
    
    // Ensure single ending period
    out = out.replace(/\.+\s*$/, '.');
    
    return out;
  };

  const generateStepsForNewGoal = async () => {
    const goalMetadata = (goal as any)?.metadata;
    if (!goalMetadata?.wizardContext) return;
    
    setGeneratingSteps(true);
    setGenerationError(false);
    
    try {
      const wizardData = goalMetadata.wizardContext;
      
      // Build enriched data for step generation
      const enrichedData = {
        goalTitle: wizardData.goalTitle,
        goalMotivation: wizardData.goalMotivation,
        customMotivation: wizardData.customMotivation,
        goalType: wizardData.goalType,
        challengeAreas: wizardData.challengeAreas,
        customChallenges: wizardData.customChallenges,
        
        // Fix: Map prerequisite correctly
        hasPrerequisites: !!wizardData.prerequisite,
        customPrerequisites: wizardData.prerequisite || '',
        
        // Fix: Ensure Date object
        startDate: new Date(wizardData.startDate),
        
        timeOfDay: wizardData.timeOfDay,
        customTime: wizardData.customTime,
        supportContext: wizardData.supportContext,
        primarySupporterName: wizardData.primarySupporterName,
        primarySupporterRole: wizardData.primarySupporterRole,
        
        // Fix: Add category (required by templates)
        category: goal!.domain || 'general',
        
        // Fix: Add person names for context
        supportedPersonName: ownerProfile?.first_name || 'them',
        supporterName: wizardData.primarySupporterName
      };
      
      // Generate individual steps
      const individualEnrichedData = {
        ...enrichedData,
        supporterName: wizardData.primarySupporterName
      };
      
      const individualSteps = await generateMicroStepsSmart(individualEnrichedData, 'individual');
      
      // Save individual steps with timing and dependencies
      const savedIndividualSteps: any[] = [];
      const goalStartDate = new Date(wizardData.startDate);
      const startTime = wizardData.customTime || wizardData.timeOfDay || '08:00';
      const [startHour, startMin] = startTime.split(':').map(Number);
      goalStartDate.setHours(startHour, startMin || 0, 0, 0);
      
      for (let i = 0; i < individualSteps.length; i++) {
        const microStep = individualSteps[i];
        
        // Calculate due date based on step position
        let stepDueDate: Date = new Date(goalStartDate);
        if (i === 0 && microStep.title.toLowerCase().includes('get ready by')) {
          // Prerequisite step: due day before at 8 PM
          stepDueDate.setDate(stepDueDate.getDate() - 1);
          stepDueDate.setHours(20, 0, 0, 0);
        } else if (i === 1 || microStep.title.toLowerCase().includes('at ')) {
          // Activation step: due at exact start time
          stepDueDate = new Date(goalStartDate);
        } else {
          // Follow-up steps: due 1 hour after start
          stepDueDate = new Date(goalStartDate);
          stepDueDate.setHours(startHour + 1, 0, 0, 0);
        }
        
        const { step } = await stepsService.createStep(goal!.id, {
          title: microStep.title,
          step_type: 'action',
          is_required: true,
          estimated_effort_min: 15,
          is_planned: true,
          notes: microStep.description,
          is_supporter_step: false,
          due_date: stepDueDate.toISOString()
        });
        
        savedIndividualSteps.push(step);
        
        // Set dependency on previous step (if exists)
        if (i > 0 && savedIndividualSteps[i - 1]) {
          await supabase
            .from('steps')
            .update({ dependency_step_ids: [savedIndividualSteps[i - 1].id] })
            .eq('id', step.id);
        }
      }
      
      // Generate supporter steps if needed
      if (wizardData.primarySupporterRole === 'hands_on_helper') {
        // Parse individual's start time
        const [startHourStr, startMinStr] = startTime.split(':');
        const startHourNum = parseInt(startHourStr);
        const startMinNum = parseInt(startMinStr || '0');
        
        // Calculate supporter prep time (2 hours BEFORE individual starts)
        let prepHour: number;
        let prepMin: number = 0;
        
        if (startHourNum <= 10) {
          // Early morning goals: supporter preps at 8 AM (or earlier if goal is before 10 AM)
          prepHour = Math.min(8, startHourNum - 2);
          prepMin = 0;
        } else {
          // Later goals: supporter preps exactly 2 hours before
          prepHour = startHourNum - 2;
          prepMin = startMinNum;
        }
        
        // Format prep time with proper AM/PM
        const prepPeriod = prepHour >= 12 ? 'PM' : 'AM';
        const prepDisplayHour = prepHour % 12 || 12;
        const prepTimeFormatted = `${prepDisplayHour}:${prepMin.toString().padStart(2, '0')} ${prepPeriod}`;
        
        const supporterEnrichedData = {
          ...enrichedData,
          supporterTimingOffset: `by ${prepTimeFormatted}`,
          // Add context for supporter templates
          individualStartTime: startTime,
          individualStartDay: format(new Date(wizardData.startDate), 'EEEE')
        };
        
        const supporterSteps = await generateMicroStepsSmart(supporterEnrichedData, 'supporter');
        const savedSupporterSteps: any[] = [];
        
        // Save supporter steps with dependencies
        for (let i = 0; i < supporterSteps.length; i++) {
          const coachStep = supporterSteps[i];
          
          // Calculate supporter step due dates
          let stepDueDate: Date;
          if (i === 0 && coachStep.title.toLowerCase().includes('prep')) {
            // Environmental prep: due at prep time (calculated above)
            stepDueDate = new Date(goalStartDate);
            stepDueDate.setHours(prepHour, prepMin, 0, 0);
          } else if (i === 1 || coachStep.title.toLowerCase().includes('at ')) {
            // Activation assist: due at individual's start time
            stepDueDate = new Date(goalStartDate);
          } else {
            // Monitoring steps: due 30 min after individual starts
            stepDueDate = new Date(goalStartDate);
            stepDueDate.setMinutes(startMinNum + 30);
          }
          
          const { step } = await stepsService.createStep(goal!.id, {
            title: coachStep.title,
            step_type: 'action',
            is_required: true,
            estimated_effort_min: 10,
            is_planned: true,
            notes: coachStep.description,
            is_supporter_step: true,
            due_date: stepDueDate.toISOString()
          });
          
          savedSupporterSteps.push(step);
          
          // Set dependencies:
          // - Supporter step 1: depends on individual step 1 (prerequisite)
          // - Supporter step 2: depends on supporter step 1 AND individual step 2
          // - Supporter step 3: depends on supporter step 2
          let dependencyIds: string[] = [];
          if (i === 0 && savedIndividualSteps[0]) {
            dependencyIds = [savedIndividualSteps[0].id];
          } else if (i === 1) {
            dependencyIds = [savedSupporterSteps[0].id];
            if (savedIndividualSteps[1]) {
              dependencyIds.push(savedIndividualSteps[1].id);
            }
          } else if (i > 1 && savedSupporterSteps[i - 1]) {
            dependencyIds = [savedSupporterSteps[i - 1].id];
          }
          
          if (dependencyIds.length > 0) {
            await supabase
              .from('steps')
              .update({ dependency_step_ids: dependencyIds })
              .eq('id', step.id);
          }
        }
      }
      
      // Reload steps
      await loadGoalData();
      
      toast({
        title: "Micro-steps ready! 🎯",
        description: "Your personalized steps have been generated."
      });
      
    } catch (error) {
      console.error('Failed to generate steps:', error);
      setGenerationError(true);
      
      toast({
        title: "Step generation failed",
        description: "We couldn't generate your micro-steps at this time. Use the Generate Steps button to try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingSteps(false);
    }
  };

  if (loading || !goal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BackButton onClick={onBack} />
          <h2 className="text-2xl font-bold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 space-y-6">
      {/* Loading overlay for step generation */}
      {generatingSteps && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-80">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Creating your micro-steps</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  🎯 Personalizing your journey...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error state with retry button */}
      {!generatingSteps && steps.length === 0 && generationError && (goal as any)?.metadata?.wizardContext && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-3">
            We couldn't generate your micro-steps at this time. If you want to try again, click below.
          </p>
          <Button onClick={generateStepsForNewGoal} variant="outline" className="w-full">
            Generate Steps
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <BackButton onClick={onBack} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground capitalize">{goal.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant={getStatusColor(goal.status)}>
                {goal.status === 'active' ? 'In Progress' : goal.status}
              </Badge>
              {goal.domain && getDomainDisplayName(goal.domain) && getDomainDisplayName(goal.domain) !== 'General' && (
                <Badge variant="outline" className="capitalize">
                  {getDomainDisplayName(goal.domain)}
                </Badge>
              )}
              {goal.due_date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="truncate">Due {formatDate(goal.due_date)}</span>
                </Badge>
              )}
              
              {/* Ownership badges */}
              {currentUser && goal.owner_id !== currentUser.id && ownerProfile && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  For {ownerProfile.first_name}
                </Badge>
              )}
              {currentUser && goal.created_by !== currentUser.id && creatorProfile && goal.owner_id === currentUser.id && (
                <Badge variant="outline" className="text-xs">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Created by {creatorProfile.first_name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {goal.progress && (
            <div className="flex items-center gap-3">
              <CircularProgress 
                value={goal.progress.percent || 0} 
                size={36}
                strokeWidth={3}
                color="#2393CC"
              />
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {goal.progress.percent}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {goal.progress.done}/{goal.progress.actionable} done
                </div>
              </div>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="bg-transparent hover:bg-gray-100 border-transparent">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border border-input shadow-lg z-50">
              <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Open check-in modal */}}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Check In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Add buddy functionality */}}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Buddy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: Share functionality */}}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              {goal.status === 'completed' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive this goal?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move the goal to your archived goals. You can restore it later if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteGoal}>
                        Archive Goal
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Goal Info */}
      {goal.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground capitalize">{sanitizeDescription(goal.description)}</p>
          </CardContent>
        </Card>
      )}

      {/* Steps */}
      <StepsList 
        goal={goal}
        steps={steps}
        onStepsUpdate={handleStepsUpdate}
        onOpenStepChat={handleOpenStepChat}
      />

      {/* Step Chat Modal */}
      <StepChatModal
        isOpen={showStepChat}
        onClose={() => setShowStepChat(false)}
        step={selectedStep}
        goal={goal}
        onStepsUpdate={handleStepChatUpdate}
      />

      {/* Steps Chat */}
      <StepsChat 
        goal={goal}
        steps={steps}
        step={chatStep}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />

      {/* Goal Edit Modal */}
      <GoalEditModal
        isOpen={showEditModal}
        onOpenChange={setShowEditModal}
        goal={goal}
        onGoalUpdate={handleGoalUpdate}
      />
    </div>
  );
};