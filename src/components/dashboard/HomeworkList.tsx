import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { Homework } from '@/types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface HomeworkListProps {
  homeworks: Homework[];
  viewType: 'student' | 'teacher';
}

export function HomeworkList({ homeworks, viewType }: HomeworkListProps) {
  const getStatusBadge = (status: Homework['status'], deadline: string) => {
    const daysLeft = differenceInDays(parseISO(deadline), new Date());

    if (status === 'COMPLETED') {
      return <Badge variant="success">Выполнено</Badge>;
    }
    if (status === 'OVERDUE') {
      return <Badge variant="danger">Просрочено</Badge>;
    }
    if (daysLeft <= 1) {
      return <Badge variant="warning">Срочно</Badge>;
    }
    return <Badge variant="info">Активно</Badge>;
  };

  return (
    <Card>
      <CardHeader
        title={viewType === 'teacher' ? 'Домашние задания' : 'Мои задания'}
        subtitle="Текущие и предстоящие"
        action={
          <Button variant="ghost" size="sm">
            Все задания
            <ArrowRight size={14} className="ml-1" />
          </Button>
        }
      />
      <div className="space-y-4">
        {homeworks.map((hw) => (
          <div
            key={hw.id}
            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900">{hw.title}</h4>
                  {getStatusBadge(hw.status, hw.deadline)}
                </div>
                <p className="text-sm text-slate-500">{hw.groupName}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar size={14} />
                  {format(parseISO(hw.deadline), 'd MMM', { locale: ru })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={14} />
                <span>{hw.tasks.length} заданий</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">
                  {hw.completedCount}/{hw.totalCount}
                </span>
                <div className="w-24">
                  <ProgressBar
                    value={hw.completedCount}
                    max={hw.totalCount}
                    size="sm"
                    color={hw.completedCount === hw.totalCount ? 'success' : 'primary'}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
