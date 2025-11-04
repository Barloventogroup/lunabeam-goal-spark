import { StudentData } from '@/hooks/useCoachDashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { StatusChip } from './status-chip';
import { MiniProgressBar } from './mini-progress-bar';
import { Flame } from 'lucide-react';

interface StudentTileProps {
  student: StudentData;
  onClick: () => void;
}

export function StudentTile({ student, onClick }: StudentTileProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={student.avatarUrl || undefined} 
              alt={student.firstName}
            />
            <AvatarFallback>{student.firstName[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">{student.firstName}</h3>
              <StatusChip status={student.status} />
            </div>
            {student.grade && (
              <p className="text-sm text-muted-foreground">Grade {student.grade}</p>
            )}
          </div>
        </div>

        {student.currentGoal && (
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{student.currentGoal.title}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {student.currentGoal.type}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <MiniProgressBar
            completed={student.thisWeekProgress.completed}
            planned={student.thisWeekProgress.planned}
          />
          
          {student.streakDays > 0 && (
            <div className="flex items-center gap-1 text-sm text-orange-600">
              <Flame className="h-4 w-4" />
              <span>{student.streakDays} day streak</span>
            </div>
          )}
        </div>

        {student.cohortName && (
          <p className="text-xs text-muted-foreground mt-2">
            Cohort: {student.cohortName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
