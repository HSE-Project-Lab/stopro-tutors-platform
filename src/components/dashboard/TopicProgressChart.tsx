import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { TopicStat } from '@/types';

interface TopicProgressChartProps {
  topics: TopicStat[];
}

export function TopicProgressChart({ topics }: TopicProgressChartProps) {
  const getStatusBadge = (status: TopicStat['status']) => {
    switch (status) {
      case 'STRONG':
        return <Badge variant="success">Отлично</Badge>;
      case 'NORMAL':
        return <Badge variant="info">Нормально</Badge>;
      case 'WEAK':
        return <Badge variant="danger">Требует внимания</Badge>;
    }
  };

  const getProgressColor = (successRate: number) => {
    if (successRate >= 80) return 'success';
    if (successRate >= 60) return 'warning';
    return 'danger';
  };

  return (
    <Card>
      <CardHeader title="Прогресс по темам" subtitle="Успешность решения по заданиям ЕГЭ" />
      <div className="space-y-4">
        {topics.map((topic) => (
          <div key={topic.topicId} className="flex items-center gap-4">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-semibold text-slate-600">
              {topic.egeNumber}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-900 truncate">
                  {topic.topicName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{topic.successRate}%</span>
                  {getStatusBadge(topic.status)}
                </div>
              </div>
              <ProgressBar
                value={topic.successRate}
                color={getProgressColor(topic.successRate)}
                size="sm"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
