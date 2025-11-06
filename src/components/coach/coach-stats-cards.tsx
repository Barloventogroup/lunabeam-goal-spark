import { CoachDashboardStats } from '@/hooks/useCoachDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

interface CoachStatsCardsProps {
  stats: CoachDashboardStats;
}

export function CoachStatsCards({ stats }: CoachStatsCardsProps) {
  const cards = [
    {
      label: 'On Track',
      value: stats.onTrack,
      icon: TrendingUp,
      className: 'text-green-600 bg-green-100'
    },
    {
      label: 'At Risk',
      value: stats.atRisk,
      icon: AlertTriangle,
      className: 'text-yellow-600 bg-yellow-100'
    },
    {
      label: 'Stuck',
      value: stats.stuck,
      icon: AlertCircle,
      className: 'text-red-600 bg-red-100'
    },
    {
      label: 'No Data',
      value: stats.noData,
      icon: HelpCircle,
      className: 'text-gray-600 bg-gray-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.className}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
