import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { LaTeX } from '@/components/ui/LaTeX';
import { AddToHomeworkButton } from '@/components/tasks/AddToHomeworkButton';
import type { TaskPrototype, TaskVariation } from '@/types/tasks';
import { BookOpenCheck } from 'lucide-react';

interface TeacherTaskDetailProps {
  prototype: TaskPrototype | null;
  variations: TaskVariation[];
  isLoadingVariations?: boolean;
  initialSelectedVariationId?: string | null;
}

const difficultyLabel: Record<TaskPrototype['difficulty'], string> = {
  EASY: 'Базовый',
  MEDIUM: 'Повышенный',
  HARD: 'Сложный',
};

const difficultyVariant: Record<TaskPrototype['difficulty'], 'success' | 'warning' | 'danger'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

export function TeacherTaskDetail({
  prototype,
  variations,
  isLoadingVariations = false,
  initialSelectedVariationId = null,
}: TeacherTaskDetailProps) {
  const parseTopicTags = (topic: string): string[] => {
    return topic
      .split(/[,;|/]+/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  };

  const topicTags = parseTopicTags(prototype?.topic ?? '');

  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVariationId(initialSelectedVariationId ?? null);
  }, [prototype?.id, initialSelectedVariationId]);

  const selectedVariation = useMemo(
    () => variations.find((variation) => variation.id === selectedVariationId) ?? null,
    [variations, selectedVariationId]
  );

  if (!prototype) {
    return (
      <Card className="h-full">
        <div className="h-full min-h-[420px] flex items-center justify-center text-center text-slate-500">
          <div>
            <BookOpenCheck className="mx-auto mb-3 text-slate-300" size={34} />
            <p className="font-medium">Выберите задачу из базы</p>
            <p className="text-sm mt-1">Справа появится прототип, решение и все вариации.</p>
          </div>
        </div>
      </Card>
    );
  }

  const activeTask = selectedVariation ?? prototype;
  const activeSolution = selectedVariation?.solutionLatex ?? prototype.solutionLatex;
  const variantsWithPrototype = [
    {
      id: '__prototype__',
      title: 'Прототип',
      contentLatex: prototype.contentLatex,
      answer: prototype.answer,
      egeNumber: prototype.egeNumber,
      isPrototype: true,
    },
    ...variations.map((variation) => ({
      id: variation.id,
      title: variation.title,
      contentLatex: variation.contentLatex,
      answer: variation.answer,
      egeNumber: variation.egeNumber,
      isPrototype: false,
    })),
  ];

  return (
    <Card className="h-full">
      <CardHeader
        title={prototype.title}
        subtitle={`Задание №${prototype.egeNumber} · ${prototype.topic}`}
        action={
          <Badge variant={difficultyVariant[prototype.difficulty]}>
            {difficultyLabel[prototype.difficulty]}
          </Badge>
        }
      />

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {selectedVariation ? 'Условие выбранного варианта' : 'Условие прототипа'}
          </p>
          <LaTeX className="text-slate-900 leading-relaxed">{activeTask.contentLatex}</LaTeX>
        </div>

        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            Ответ
          </p>
          <p className="text-xl font-bold text-indigo-900">{activeTask.answer}</p>
        </div>

        <div className="rounded-xl border border-violet-300 border-l-4 border-l-violet-500 bg-violet-50 p-4">
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">
            Решение
          </p>
          <LaTeX className="text-slate-700 leading-relaxed">
            {activeSolution || 'Решение для выбранной задачи пока отсутствует в базе.'}
          </LaTeX>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-sm font-semibold text-slate-800">Варианты этой задачи</h4>
            <Badge variant="info" size="sm">
              {variantsWithPrototype.length} элементов
            </Badge>
          </div>

          {isLoadingVariations ? (
            <p className="text-sm text-slate-500">Загрузка вариантов...</p>
          ) : variations.length === 0 ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedVariationId(null)}
                className="w-full rounded-lg border p-3 text-left transition-all border-indigo-300 bg-indigo-50 shadow-sm"
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Прототип
                </p>
                <LaTeX className="text-sm text-slate-800">{prototype.contentLatex}</LaTeX>
                <p className="text-xs text-slate-600 mt-2">
                  Ответ: <span className="font-semibold text-slate-900">{prototype.answer}</span>
                </p>
              </button>
              <div>
                <AddToHomeworkButton
                  taskId={prototype.id}
                  taskNumber={prototype.egeNumber}
                  isClone={false}
                  taskLabel={`Прототип · №${prototype.egeNumber}`}
                  difficulty={prototype.difficulty}
                  taskTopics={topicTags}
                  taskPreview={prototype.contentLatex}
                  size="sm"
                />
              </div>
              <p className="text-sm text-slate-500">Для этого прототипа пока нет вариаций.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {variantsWithPrototype.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    (item.isPrototype && selectedVariationId === null) ||
                    (!item.isPrototype && selectedVariationId === item.id)
                      ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedVariationId(item.isPrototype ? null : item.id)}
                    className="w-full text-left"
                  >
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      {item.title}
                    </p>
                    <LaTeX className="text-sm text-slate-800">{item.contentLatex}</LaTeX>
                    <p className="text-xs text-slate-600 mt-2">
                      Ответ: <span className="font-semibold text-slate-900">{item.answer}</span>
                    </p>
                  </button>
                  <div className="mt-3">
                    <AddToHomeworkButton
                      taskId={item.isPrototype ? prototype.id : item.id}
                      taskNumber={item.egeNumber}
                      isClone={!item.isPrototype}
                      taskLabel={
                        item.isPrototype
                          ? `Прототип · №${item.egeNumber}`
                          : `${item.title} · №${item.egeNumber}`
                      }
                      difficulty={prototype.difficulty}
                      taskTopics={topicTags}
                      taskPreview={item.contentLatex}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
