import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Archive, Trophy, MoreHorizontal, Eye, ArchiveX } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { goalsService } from '@/services/goalsService';
import { getDomainDisplayName } from '@/utils/domainUtils';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
interface AchievementsViewProps {
  onBack: () => void;
}
export const AchievementsView: React.FC<AchievementsViewProps> = ({
  onBack
}) => {
  const {
    goals,
    loadGoals
  } = useStore();
  const [isArchiving, setIsArchiving] = useState<string | null>(null);
  useEffect(() => {
    loadGoals();
  }, [loadGoals]);
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const archivedGoals = goals.filter(goal => goal.status === 'archived');
  const handleArchiveGoal = async (goalId: string) => {
    setIsArchiving(goalId);
    try {
      await goalsService.updateGoal(goalId, {
        status: 'archived'
      });
      await loadGoals();
      toast({
        title: "Goal Archived",
        description: "The goal has been successfully archived."
      });
    } catch (error) {
      console.error('Error archiving goal:', error);
      toast({
        title: "Error",
        description: "Failed to archive the goal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsArchiving(null);
    }
  };
  const handleUnarchiveGoal = async (goalId: string) => {
    setIsArchiving(goalId);
    try {
      await goalsService.updateGoal(goalId, {
        status: 'completed'
      });
      await loadGoals();
      toast({
        title: "Goal Unarchived",
        description: "The goal has been moved back to completed goals."
      });
    } catch (error) {
      console.error('Error unarchiving goal:', error);
      toast({
        title: "Error",
        description: "Failed to unarchive the goal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsArchiving(null);
    }
  };
  const formatCompletionDate = (goal: any) => {
    // Use updated_at as completion date for completed goals
    const date = new Date(goal.updated_at);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  return <div className="min-h-[100dvh] bg-gradient-soft pt-safe-content">
      <PageHeader title="Achievements" onBack={onBack} />

      <div className="px-4 pt-6 pb-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{completedGoals.length}</div>
              <div className="text-xs text-muted-foreground">Completed Goals</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Archive className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{archivedGoals.length}</div>
              <div className="text-xs text-muted-foreground">Archived Goals</div>
            </CardContent>
          </Card>
        </div>

        {/* Completed Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Completed Goals ({completedGoals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedGoals.length === 0 ? <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No completed goals yet</h3>
                <p className="text-sm text-muted-foreground">
                  Complete your first goal to start building your achievements!
                </p>
              </div> : <div className="space-y-3">
                {completedGoals.map(goal => <div key={goal.id} className="flex items-center gap-4 p-4 border rounded-lg bg-green-500/5 hover:bg-green-500/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {goal.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getDomainDisplayName(goal.domain || 'General')}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Completed {formatCompletionDate(goal)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-500">100%</div>
                        <div className="text-xs text-muted-foreground">Complete</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isArchiving === goal.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleArchiveGoal(goal.id)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Goal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>

        {/* Archived Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-orange-500" />
              Archived Goals ({archivedGoals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {archivedGoals.length === 0 ? <div className="text-center py-8">
                <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No archived goals</h3>
                <p className="text-sm text-muted-foreground">
                  Goals you archive will appear here for future reference.
                </p>
              </div> : <div className="space-y-3">
                {archivedGoals.map(goal => <div key={goal.id} className="flex items-center gap-4 p-4 border rounded-lg bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Archive className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {goal.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {getDomainDisplayName(goal.domain || 'General')}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Archived {formatCompletionDate(goal)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-500">
                          {Math.round(goal.progress_pct)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Archived</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isArchiving === goal.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUnarchiveGoal(goal.id)}>
                            <ArchiveX className="h-4 w-4 mr-2" />
                            Unarchive Goal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};