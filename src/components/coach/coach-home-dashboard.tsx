import { useState } from 'react';
import { useCoachDashboard, CoachDashboardFilters, StudentData } from '@/hooks/useCoachDashboard';
import { CoachStatsCards } from './coach-stats-cards';
import { CoachFilters } from './coach-filters';
import { StudentTile } from './student-tile';
import { StudentDrawer } from './student-drawer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CoachHomeDashboard() {
  const [filters, setFilters] = useState<CoachDashboardFilters>({});
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, error } = useCoachDashboard(filters);

  const handleStudentClick = (student: StudentData) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
  };

  const handleExportCSV = () => {
    if (!data?.students.length) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Name',
      'Grade',
      'Cohort',
      'Status',
      'Current Goal',
      'Completed This Week',
      'Planned This Week',
      'Progress %',
      'Streak Days',
      'Overdue Count'
    ];

    const rows = data.students.map(s => [
      s.firstName,
      s.grade || '',
      s.cohortName || '',
      s.status,
      s.currentGoal?.title || '',
      s.thisWeekProgress.completed,
      s.thisWeekProgress.planned,
      s.thisWeekProgress.percentage,
      s.streakDays,
      s.overdueCount
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coach-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('CSV exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Failed to load dashboard</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Coach Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track student progress and provide timely support
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <CoachStatsCards stats={data.stats} />

      <CoachFilters
        filters={filters}
        onFiltersChange={setFilters}
        cohorts={data.cohorts}
      />

      {data.students.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">
            {filters.cohortId || filters.grade || filters.status
              ? 'No students match the selected filters'
              : 'No students found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.students.map(student => (
            <StudentTile
              key={student.userId}
              student={student}
              onClick={() => handleStudentClick(student)}
            />
          ))}
        </div>
      )}

      <StudentDrawer
        student={selectedStudent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
