import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/Card';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue';
}

const colorStyles = {
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    gradient: 'from-amber-500 to-amber-600',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-600',
    gradient: 'from-rose-500 to-rose-600',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
  },
};

export function StatsCard({ title, value, change, icon: Icon, color }: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {change && (
            <p
              className={cn(
                'text-sm mt-2 flex items-center gap-1',
                change.value >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              <span>{change.value >= 0 ? '↑' : '↓'}</span>
              <span>{Math.abs(change.value)}%</span>
              <span className="text-slate-500">{change.label}</span>
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', styles.bg)}>
          <Icon size={24} className={styles.icon} />
        </div>
      </div>
      <div
        className={cn('absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r', styles.gradient)}
      />
    </Card>
  );
}
