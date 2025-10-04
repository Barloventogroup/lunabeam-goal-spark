import React, { useState, useEffect } from 'react';
import { GoalsList } from '../lunebeam/goals-list';
import { GoalDetailV2 } from '../lunebeam/goal-detail-v2';
import { LuneAISession } from '../lunebeam/lune-ai-session';
import { GoalSummary } from '../lunebeam/goal-summary';
import { GoalCategories } from '../lunebeam/goal-categories';
import { GoalsWizard } from '../lunebeam/goals-wizard';
import { RedesignedGoalsWizard } from '../lunebeam/redesigned-goals-wizard';
import { GoalProposalsView } from '../lunebeam/goal-proposals-view';
import { SupporterGoalWizard } from '../lunebeam/supporter-goal-wizard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, Users, UserPlus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getSupporterContext } from '@/utils/supporterUtils';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type GoalsView = 'list' | 'detail' | 'categories' | 'create' | 'summary' | 'wizard' | 'create-wizard' | 'supporter-wizard' | 'proposals';

interface TabGoalsProps {
  onWizardStateChange?: (isWizardActive: boolean) => void;
  initialGoalId?: string | null;
}

export const TabGoals: React.FC<TabGoalsProps> = ({ onWizardStateChange, initialGoalId }) => {
  const [currentView, setCurrentView] = useState<GoalsView>('list');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [aiGoal, setAiGoal] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'own' | 'individual'>('own');
  const [supporterContext, setSupporterContext] = useState<any>(null);
  const [showFlowSelection, setShowFlowSelection] = useState(false);

  const { userContext } = useStore();

  // Get supporter context for supporters and hybrids
  useEffect(() => {
    if (userContext?.userType === 'supporter' || userContext?.userType === 'hybrid') {
      const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          getSupporterContext(user.id).then(setSupporterContext);
        }
      };
      getCurrentUser();
    }
  }, [userContext]);

  // Handle initial goal ID navigation
  useEffect(() => {
    if (initialGoalId) {
      setSelectedGoalId(initialGoalId);
      setCurrentView('detail');
      onWizardStateChange?.(false);
    }
  }, [initialGoalId, onWizardStateChange]);

  const handleNavigate = (view: string, data?: any) => {
    switch (view) {
      case 'goal-detail':
        setSelectedGoalId(data);
        setCurrentView('detail');
        onWizardStateChange?.(false);
        break;
      case 'create-goal':
        // Show flow selection for supporters
        if (userContext?.userType === 'supporter' || userContext?.userType === 'hybrid') {
          setShowFlowSelection(true);
        } else {
          setCurrentView('create-wizard');
          onWizardStateChange?.(true);
        }
        break;
      case 'view-proposals':
        setCurrentView('proposals');
        onWizardStateChange?.(false);
        break;
      case 'goals-list':
      default:
        setCurrentView('list');
        setSelectedGoalId(null);
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
        onWizardStateChange?.(false);
        break;
    }
  };

  const handleCategorySelected = (category: string) => {
    setSelectedCategory(category);
    setCurrentView('create');
    onWizardStateChange?.(false);
  };

  const handleAiGoalCreated = (goal: any) => {
    setAiGoal(goal);
    setCurrentView('summary');
  };

  const handleWizardGoalCreated = () => {
    setCurrentView('list');
    setRefreshTrigger(prev => prev + 1); // Trigger refresh when new goal created
    onWizardStateChange?.(false);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'detail':
        return selectedGoalId ? (
          <GoalDetailV2 
            goalId={selectedGoalId} 
            onBack={() => handleNavigate('goals-list')}
          />
        ) : (
          <GoalsList onNavigate={handleNavigate} refreshTrigger={refreshTrigger} />
        );
      case 'categories':
        return (
          <GoalCategories 
            onSelectCategory={handleCategorySelected}
            onBack={() => setCurrentView('list')}
          />
        );
      case 'create':
        return selectedCategory ? (
          <LuneAISession 
            category={selectedCategory} 
            onBack={() => setCurrentView('categories')} 
            onGoalCreated={handleAiGoalCreated}
          />
        ) : (
          <GoalsList onNavigate={handleNavigate} refreshTrigger={refreshTrigger} />
        );
      case 'summary':
        return aiGoal ? (
          <GoalSummary 
            goal={aiGoal} 
            onBack={() => setCurrentView('list')}
            onComplete={() => setCurrentView('list')}
          />
        ) : (
          <GoalsList onNavigate={handleNavigate} refreshTrigger={refreshTrigger} />
        );
      case 'wizard':
        return (
          <GoalsWizard 
            onComplete={handleWizardGoalCreated}
            onBack={() => {
              setCurrentView('list');
              onWizardStateChange?.(false);
            }}
          />
        );
      case 'create-wizard':
        return (
          <RedesignedGoalsWizard 
            onComplete={handleWizardGoalCreated}
            onCancel={() => {
              setCurrentView('list');
              onWizardStateChange?.(false);
            }}
            isSupporter={(userContext?.userType && userContext.userType !== 'individual') || false}
          />
        );
      case 'supporter-wizard':
        return (
          <SupporterGoalWizard
            onComplete={handleWizardGoalCreated}
            onCancel={() => {
              setCurrentView('list');
              onWizardStateChange?.(false);
            }}
          />
        );
      case 'proposals':
        return (
          <GoalProposalsView 
            onBack={() => setCurrentView('list')}
          />
        );
      case 'list':
      default:
        return <GoalsList onNavigate={handleNavigate} refreshTrigger={refreshTrigger} />;
    }
  };

  // Show tabs for supporters and hybrids
  if ((userContext?.userType === 'supporter' || userContext?.userType === 'hybrid') && supporterContext?.supportedIndividuals?.length > 0) {
    const supportedIndividual = supporterContext.supportedIndividuals[0];
    
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'own' | 'individual')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="own" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Goals
              </TabsTrigger>
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {supportedIndividual.name}'s Goals
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="own" className="mt-0">
              <div key="own-goals">
                {renderCurrentView()}
              </div>
            </TabsContent>
            
            <TabsContent value="individual" className="mt-0">
              <div key="individual-goals">
                {renderCurrentView()}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentView()}

      {/* Flow selection dialog for supporters */}
      <Dialog open={showFlowSelection} onOpenChange={setShowFlowSelection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Who is this goal for?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-auto p-6 justify-start"
              onClick={() => {
                setShowFlowSelection(false);
                setCurrentView('create-wizard');
                onWizardStateChange?.(true);
              }}
            >
              <User className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">For myself</div>
                <div className="text-sm text-muted-foreground">Create a personal goal</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-auto p-6 justify-start"
              onClick={() => {
                setShowFlowSelection(false);
                setCurrentView('supporter-wizard');
                onWizardStateChange?.(true);
              }}
            >
              <UserPlus className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">For someone I support</div>
                <div className="text-sm text-muted-foreground">Create a goal for them</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};