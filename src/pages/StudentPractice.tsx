import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PracticeTaskSolver } from '@/components/practice/PracticeTaskSolver';
import type { TaskPrototype, TaskVariation } from '@/types/tasks';
import { Rocket } from 'lucide-react';

const mockPrototypes: TaskPrototype[] = [
  {
    id: 'proto-1',
    egeNumber: 1,
    difficulty: 'EASY',
    title: 'Квадратное уравнение с простыми корнями',
    topic: 'Алгебраические выражения',
    contentLatex: 'Решите уравнение: $$x^2 = 4$$',
    answer: '2; -2',
    solutionLatex: 'Переносим 4 вправо в виде корней: $x^2 = 4 = 2^2$. Тогда $x = 2$ или $x = -2$.',
    hint: 'Проверьте оба корня подстановкой.',
  },
  {
    id: 'proto-2',
    egeNumber: 9,
    difficulty: 'MEDIUM',
    title: 'Логарифмическое уравнение',
    topic: 'Логарифмы',
    contentLatex: 'Решите уравнение: $$\log_2(x-1)=3$$',
    answer: '9',
    solutionLatex: 'Из определения логарифма: $x-1 = 2^3 = 8$. Получаем $x=9$. ОДЗ: $x>1$.',
  },
  {
    id: 'proto-3',
    egeNumber: 15,
    difficulty: 'HARD',
    title: 'Показательное неравенство',
    topic: 'Неравенства',
    contentLatex: 'Решите неравенство: $$2^{x+1} > 16$$',
    answer: 'x > 3',
    solutionLatex:
      'Запишем $16$ как $2^4$: $2^{x+1} > 2^4$. Основание больше 1, значит $x+1>4$, то есть $x>3$.',
  },
  {
    id: 'proto-4',
    egeNumber: 11,
    difficulty: 'MEDIUM',
    title: 'Тригонометрическое уравнение',
    topic: 'Тригонометрия',
    contentLatex: 'Найдите все решения на $[0;2\pi]$: $$\sin x = \frac{1}{2}$$',
    answer: '\pi/6; 5\pi/6',
    solutionLatex: 'По единичной окружности: $x=\frac{\pi}{6}$ и $x=\frac{5\pi}{6}$.',
  },
];

const mockVariations: TaskVariation[] = [
  {
    id: 'var-1',
    prototypeId: 'proto-1',
    egeNumber: 1,
    title: 'Вариант 1',
    contentLatex: 'Решите уравнение: $$x^2 = 9$$',
    answer: '3; -3',
  },
  {
    id: 'var-2',
    prototypeId: 'proto-1',
    egeNumber: 1,
    title: 'Вариант 2',
    contentLatex: 'Решите уравнение: $$x^2 = 49$$',
    answer: '7; -7',
  },
  {
    id: 'var-3',
    prototypeId: 'proto-2',
    egeNumber: 9,
    title: 'Вариант 1',
    contentLatex: 'Решите уравнение: $$\log_3(x+2)=2$$',
    answer: '7',
  },
  {
    id: 'var-4',
    prototypeId: 'proto-2',
    egeNumber: 9,
    title: 'Вариант 2',
    contentLatex: 'Решите уравнение: $$\log_5(x-4)=1$$',
    answer: '9',
  },
  {
    id: 'var-5',
    prototypeId: 'proto-3',
    egeNumber: 15,
    title: 'Вариант 1',
    contentLatex: 'Решите неравенство: $$3^{x-2} \leq 27$$',
    answer: 'x \leq 5',
  },
  {
    id: 'var-6',
    prototypeId: 'proto-3',
    egeNumber: 15,
    title: 'Вариант 2',
    contentLatex: 'Решите неравенство: $$5^{x+1} > 625$$',
    answer: 'x > 3',
  },
  {
    id: 'var-7',
    prototypeId: 'proto-4',
    egeNumber: 11,
    title: 'Вариант 1',
    contentLatex: 'Найдите все решения на $[0;2\pi]$: $$\cos x = -\frac{1}{2}$$',
    answer: '2\pi/3; 4\pi/3',
  },
];

export function StudentPractice() {
  const [selectedEge, setSelectedEge] = useState('1');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  const egeOptions = useMemo(
    () =>
      Array.from({ length: 19 }, (_, i) => ({ value: String(i + 1), label: `Задание №${i + 1}` })),
    []
  );

  const selectedPrototype = useMemo(() => {
    const byNumber = mockPrototypes.find((item) => item.egeNumber === Number(selectedEge));
    return byNumber ?? mockPrototypes[0];
  }, [selectedEge]);

  const prototypeVariations = useMemo(
    () => mockVariations.filter((item) => item.prototypeId === selectedPrototype.id),
    [selectedPrototype.id]
  );

  const currentTask = useMemo(() => {
    if (!currentTaskId) return selectedPrototype;
    return prototypeVariations.find((item) => item.id === currentTaskId) ?? selectedPrototype;
  }, [currentTaskId, prototypeVariations, selectedPrototype]);

  const isVariation = currentTask.id !== selectedPrototype.id;

  const handleSelectTaskNumber = (value: string) => {
    setSelectedEge(value);
    setCurrentTaskId(null);
  };

  const handleRequestSimilar = () => {
    if (prototypeVariations.length === 0) return;

    if (!currentTaskId) {
      setCurrentTaskId(prototypeVariations[0].id);
      return;
    }

    const currentIndex = prototypeVariations.findIndex((item) => item.id === currentTaskId);
    const nextIndex = (currentIndex + 1) % prototypeVariations.length;
    setCurrentTaskId(prototypeVariations[nextIndex].id);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="rounded-2xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 via-indigo-50 to-cyan-50 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Практика</h1>
            <p className="text-slate-600 text-sm mt-1">
              Решай задачу, получай разбор и сразу переходи к похожему варианту.
            </p>
          </div>
          <Badge variant="info">
            <Rocket size={14} className="mr-1" />
            Режим тренировки
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader title="Выбор задания" subtitle="Выбери номер ЕГЭ и начни решение" />
        <div className="max-w-sm">
          <Select value={selectedEge} onChange={handleSelectTaskNumber} options={egeOptions} />
        </div>
      </Card>

      <PracticeTaskSolver
        prototype={selectedPrototype}
        currentTask={currentTask}
        isVariation={isVariation}
        onRequestSimilar={handleRequestSimilar}
      />
    </div>
  );
}
