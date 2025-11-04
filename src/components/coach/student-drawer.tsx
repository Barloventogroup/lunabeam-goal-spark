import { useState } from 'react';
import { StudentData } from '@/hooks/useCoachDashboard';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusChip } from './status-chip';
import { MiniProgressBar } from './mini-progress-bar';
import { 
  MessageCircle, 
  Clock, 
  SplitSquareHorizontal, 
  StickyNote,
  Flame,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';

interface StudentDrawerProps {
  student: StudentData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentDrawer({ student, open, onOpenChange }: StudentDrawerProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!student) return null;

  const handleQuickAction = async (
    type: 'nudge' | 'adjust' | 'split' | 'note',
    payload: any
  ) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_actions')
        .insert({
          student_id: student.userId,
          coach_id: user.id,
          type,
          payload,
          visible_to_student: type !== 'note'
        });

      if (error) throw error;

      toast.success('Action recorded successfully');
    } catch (error) {
      console.error('Failed to record action:', error);
      toast.error('Failed to record action');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.avatarUrl || undefined} alt={student.firstName} />
              <AvatarFallback>{student.firstName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-2xl">{student.firstName}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                {student.grade && <span>Grade {student.grade}</span>}
                {student.cohortName && (
                  <>
                    <span>•</span>
                    <span>{student.cohortName}</span>
                  </>
                )}
              </SheetDescription>
              <div className="mt-2">
                <StatusChip status={student.status} />
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {student.currentGoal && (
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold mb-1">Current Goal</h3>
                <p className="text-sm">{student.currentGoal.title}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {student.currentGoal.type}
                </p>
              </div>
            )}

            <div className="p-4 rounded-lg border bg-card space-y-3">
              <h3 className="font-semibold">This Week</h3>
              <MiniProgressBar
                completed={student.thisWeekProgress.completed}
                planned={student.thisWeekProgress.planned}
              />
              <div className="text-sm text-muted-foreground">
                {student.thisWeekProgress.percentage}% complete
              </div>
            </div>

            {student.streakDays > 0 && (
              <div className="p-4 rounded-lg border bg-card flex items-center gap-3">
                <Flame className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-semibold">{student.streakDays} Day Streak</p>
                  <p className="text-sm text-muted-foreground">Keep it going!</p>
                </div>
              </div>
            )}

            {student.overdueCount > 0 && (
              <div className="p-4 rounded-lg border bg-destructive/10 flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">
                    {student.overdueCount} Overdue Step{student.overdueCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">Needs attention</p>
                </div>
              </div>
            )}

            {student.recentBlockers && student.recentBlockers.length > 0 && (
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold mb-2">Recent Blockers</h3>
                <div className="flex flex-wrap gap-2">
                  {student.recentBlockers.map((blocker, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground"
                    >
                      {blocker}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {student.lastCheckIn && (
              <div className="p-4 rounded-lg border bg-card">
                <h3 className="font-semibold mb-1">Last Check-In</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(student.lastCheckIn).toLocaleDateString()} at{' '}
                  {new Date(student.lastCheckIn).toLocaleTimeString()}
                </p>
                {student.averageDifficulty && (
                  <p className="text-sm mt-1">
                    Avg. Difficulty:{' '}
                    <span className={
                      student.averageDifficulty > 2.5 ? 'text-red-600' :
                      student.averageDifficulty > 2 ? 'text-yellow-600' :
                      'text-green-600'
                    }>
                      {student.averageDifficulty.toFixed(1)}/3
                    </span>
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-3 mt-4">
            <Button
              className="w-full justify-start gap-3"
              variant="outline"
              onClick={() => handleQuickAction('nudge', { template: 'friendly_reminder' })}
              disabled={isSubmitting}
            >
              <MessageCircle className="h-5 w-5" />
              Send Encouragement Nudge
            </Button>

            <Button
              className="w-full justify-start gap-3"
              variant="outline"
              onClick={() => handleQuickAction('adjust', { action: 'reschedule' })}
              disabled={isSubmitting}
            >
              <Clock className="h-5 w-5" />
              Adjust Schedule
            </Button>

            <Button
              className="w-full justify-start gap-3"
              variant="outline"
              onClick={() => handleQuickAction('split', { action: 'break_down' })}
              disabled={isSubmitting}
            >
              <SplitSquareHorizontal className="h-5 w-5" />
              Split Into Smaller Steps
            </Button>

            <Button
              className="w-full justify-start gap-3"
              variant="outline"
              onClick={() => handleQuickAction('note', { text: 'Private coach note' })}
              disabled={isSubmitting}
            >
              <StickyNote className="h-5 w-5" />
              Add Private Note
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>Action history coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
