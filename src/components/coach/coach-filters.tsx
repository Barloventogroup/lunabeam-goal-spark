import { CoachDashboardFilters, StudentStatus } from '@/hooks/useCoachDashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CoachFiltersProps {
  filters: CoachDashboardFilters;
  onFiltersChange: (filters: CoachDashboardFilters) => void;
  cohorts: Array<{ id: string; name: string }>;
}

export function CoachFilters({ filters, onFiltersChange, cohorts }: CoachFiltersProps) {
  const grades = ['8', '9', '10', '11', '12'];
  const statuses: Array<{ value: StudentStatus; label: string }> = [
    { value: 'on_track', label: 'On Track' },
    { value: 'at_risk', label: 'At Risk' },
    { value: 'stuck', label: 'Stuck' },
    { value: 'no_data', label: 'No Data' }
  ];

  const hasActiveFilters = filters.cohortId || filters.grade || filters.status || filters.supporterScope === 'me';

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <Select
        value={filters.cohortId || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, cohortId: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Cohorts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cohorts</SelectItem>
          {cohorts.map(cohort => (
            <SelectItem key={cohort.id} value={cohort.id}>
              {cohort.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.grade || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, grade: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Grades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Grades</SelectItem>
          {grades.map(grade => (
            <SelectItem key={grade} value={grade}>
              Grade {grade}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, status: value === 'all' ? undefined : value as StudentStatus })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {statuses.map(status => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.supporterScope || 'all'}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, supporterScope: value === 'all' ? undefined : value as 'me' | 'all' })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="All Coaches" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Coaches</SelectItem>
          <SelectItem value="me">My Students</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
