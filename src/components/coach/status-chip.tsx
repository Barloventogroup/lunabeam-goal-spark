import { StudentStatus } from '@/hooks/useCoachDashboard';
import { cn } from '@/lib/utils';

interface StatusChipProps {
  status: StudentStatus;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const config = {
    on_track: {
      label: 'On track',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    at_risk: {
      label: 'At risk',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    stuck: {
      label: 'Stuck',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    no_data: {
      label: 'No data',
      className: 'bg-gray-100 text-gray-600 border-gray-200'
    }
  };

  const { label, className: statusClass } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
        statusClass,
        className
      )}
    >
      {label}
    </span>
  );
}
