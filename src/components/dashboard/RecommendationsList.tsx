import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Brain, Target, RefreshCw, BookOpen, ArrowRight } from 'lucide-react';
import type { AIRecommendation } from '@/types';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/store/appStore';

interface RecommendationsListProps {
  recommendations: AIRecommendation[];
}

const typeIcons = {
  FOCUS_TOPIC: Target,
  REVIEW: RefreshCw,
  PRACTICE: BookOpen,
  TAKE_BREAK: Brain,
};

const priorityStyles = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-amber-500',
  LOW: 'border-l-emerald-500',
};

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  const { setActiveTab } = useAppStore();

  const handleGoToTasks = () => {
    setActiveTab('practice');
  };

  return (
    <Card>
      <CardHeader
        title="Рекомендации ИИ"
        subtitle="Персональные советы на основе вашего прогресса"
        action={
          <div className="flex items-center gap-1 text-indigo-600">
            <Brain size={18} />
            <span className="text-sm font-medium">AI</span>
          </div>
        }
      />
      <div className="space-y-3">
        {recommendations.map((rec) => {
          const Icon = typeIcons[rec.type];
          return (
            <div
              key={rec.id}
              className={cn(
                'p-4 bg-slate-50 rounded-xl border-l-4 transition-all hover:bg-slate-100',
                priorityStyles[rec.priority]
              )}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Icon size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                    <Badge
                      variant={
                        rec.priority === 'HIGH'
                          ? 'danger'
                          : rec.priority === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                      }
                      size="sm"
                    >
                      {rec.priority === 'HIGH'
                        ? 'Важно'
                        : rec.priority === 'MEDIUM'
                          ? 'Рекомендуется'
                          : 'По желанию'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{rec.description}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleGoToTasks}>
                  Перейти к заданиям
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
