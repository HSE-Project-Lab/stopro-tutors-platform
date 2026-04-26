import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LaTeX } from '@/components/ui/LaTeX';
import type { TaskPrototype, TaskVariation } from '@/types/tasks';
import { CheckCircle2, Sparkles, XCircle } from 'lucide-react';

interface PracticeTaskSolverProps {
  prototype: TaskPrototype;
  currentTask: TaskPrototype | TaskVariation;
  onRequestSimilar: () => void;
  isVariation: boolean;
}

export function PracticeTaskSolver({
  prototype,
  currentTask,
  onRequestSimilar,
  isVariation,
}: PracticeTaskSolverProps) {
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);

  const isCorrect = useMemo(
    () => answer.trim().replace(',', '.') === currentTask.answer.trim().replace(',', '.'),
    [answer, currentTask.answer]
  );

  const resetStateForNext = () => {
    setAnswer('');
    setChecked(false);
  };

  const handleCheck = () => {
    setChecked(true);
  };

  const handleSolveSimilar = () => {
    onRequestSimilar();
    resetStateForNext();
  };

  return (
    <Card className="border-indigo-100 shadow-md bg-gradient-to-b from-white to-indigo-50/30">
      <CardHeader
        title={isVariation ? 'Похожая задача' : 'Прототип задачи'}
        subtitle={`Задание №${prototype.egeNumber} · ${prototype.topic}`}
        action={
          <Badge variant={isVariation ? 'info' : 'default'}>
            {isVariation ? 'Вариант' : 'Прототип'}
          </Badge>
        }
      />

      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <LaTeX className="text-lg text-slate-900 leading-relaxed">
            {currentTask.contentLatex}
          </LaTeX>
        </div>

        <div className="space-y-3">
          <Input
            label="Введите ответ"
            placeholder="Например: 2"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={checked}
          />

          {!checked ? (
            <Button className="w-full" size="lg" onClick={handleCheck} disabled={!answer.trim()}>
              Проверить ответ
            </Button>
          ) : (
            <div className="space-y-3">
              <div
                className={`rounded-xl border p-4 ${
                  isCorrect
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  {isCorrect
                    ? 'Верно! Отличная работа.'
                    : 'Пока неверно, но это нормально — смотрим решение.'}
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">
                  Ответ
                </p>
                <p className="text-lg font-bold text-indigo-900">{currentTask.answer}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Разбор решения
                </p>
                <LaTeX className="text-slate-700 leading-relaxed">{prototype.solutionLatex}</LaTeX>
              </div>

              <Button
                onClick={handleSolveSimilar}
                size="lg"
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 focus:ring-fuchsia-500 shadow-fuchsia-200"
              >
                <Sparkles size={16} className="mr-2" />
                Решить похожую
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
