import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TeacherTaskDetail } from '@/components/tasks/TeacherTaskDetail';
import { FloatingHomeworkDraft } from '@/components/tasks/FloatingHomeworkDraft';
import type { TaskDifficulty, TaskPrototype, TaskVariation } from '@/types/tasks';
import { Search, X } from 'lucide-react';
import api from '@/lib/axios';
import type { EgeTask, EgeTaskPage } from '@/types';
import { useAppStore } from '@/store/appStore';

const difficultyLabel: Record<TaskDifficulty, string> = {
  EASY: 'Базовый',
  MEDIUM: 'Повышенный',
  HARD: 'Сложный',
};

const difficultyVariant: Record<TaskDifficulty, 'success' | 'warning' | 'danger'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const mapTaskToPrototype = (task: EgeTask): TaskPrototype => ({
  id: task.id,
  egeNumber: task.egeNumber,
  difficulty: task.difficulty,
  title: task.topic,
  topic: task.topic,
  contentLatex: task.content,
  answer: task.answer,
  solutionLatex: task.solution ?? 'Решение пока не добавлено.',
});

const mapTaskToVariation = (task: EgeTask, prototypeId: string, index: number): TaskVariation => ({
  id: task.id,
  prototypeId,
  egeNumber: task.egeNumber,
  title: `Вариант ${index + 1}`,
  contentLatex: task.content,
  answer: task.answer,
  solutionLatex: task.solution ?? undefined,
});

export function TeacherTaskBank() {
  const { setActiveTab, setOpenHomeworkConstructorFromDraft } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedEge, setSelectedEge] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedPrototypeId, setSelectedPrototypeId] = useState<string | null>(null);
  const [prototypes, setPrototypes] = useState<TaskPrototype[]>([]);
  const [variations, setVariations] = useState<TaskVariation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [preselectedVariationId, setPreselectedVariationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const numberOptions = useMemo(
    () => [
      { value: 'all', label: 'Все номера ЕГЭ' },
      ...Array.from({ length: 19 }, (_, i) => ({ value: String(i + 1), label: `№${i + 1}` })),
    ],
    []
  );

  const difficultyOptions = [
    { value: 'all', label: 'Любая сложность' },
    { value: 'EASY', label: 'Базовый' },
    { value: 'MEDIUM', label: 'Повышенный' },
    { value: 'HARD', label: 'Сложный' },
  ];

  const topicOptions = useMemo(() => {
    const uniqueTopics = Array.from(new Set(prototypes.map((prototype) => prototype.topic))).sort(
      (a, b) => a.localeCompare(b)
    );
    return uniqueTopics.map((topic) => ({ value: topic, label: topic }));
  }, [prototypes]);

  const fetchPrototypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page: 0, size: 100 };
      if (query.trim()) params.search = query.trim();
      if (selectedEge !== 'all') params.egeNumber = Number(selectedEge);
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;

      const response = await api.get<EgeTaskPage>('/ege-tasks', { params });
      const parentTasks = (response.data.content ?? []).filter((task) => !task.parentId);
      const mapped = parentTasks.map(mapTaskToPrototype);
      setPrototypes(mapped);

      if (mapped.length === 0) {
        setSelectedPrototypeId(null);
        setDetailOpen(false);
        return;
      }

      setSelectedPrototypeId((prev) =>
        prev && mapped.some((prototype) => prototype.id === prev) ? prev : null
      );
    } catch {
      setPrototypes([]);
      setSelectedPrototypeId(null);
      setDetailOpen(false);
      setError('Не удалось загрузить задачи из базы данных.');
    } finally {
      setLoading(false);
    }
  }, [query, selectedEge, selectedDifficulty]);

  useEffect(() => {
    void fetchPrototypes();
  }, [fetchPrototypes]);

  const filteredPrototypes = useMemo(() => {
    return prototypes.filter((prototype) => {
      const topicMatch =
        selectedTopics.length === 0 ||
        selectedTopics.every((topic) =>
          prototype.topic.toLowerCase().includes(topic.toLowerCase())
        );
      return topicMatch;
    });
  }, [prototypes, selectedTopics]);

  const selectedPrototype = useMemo(
    () => filteredPrototypes.find((item) => item.id === selectedPrototypeId) ?? null,
    [filteredPrototypes, selectedPrototypeId]
  );

  useEffect(() => {
    if (filteredPrototypes.length === 0) {
      setSelectedPrototypeId(null);
      setDetailOpen(false);
      return;
    }

    setSelectedPrototypeId((prev) =>
      prev && filteredPrototypes.some((prototype) => prototype.id === prev) ? prev : null
    );
  }, [filteredPrototypes]);

  useEffect(() => {
    const loadPrototypeDetail = async () => {
      if (!selectedPrototype || !detailOpen) {
        setVariations([]);
        return;
      }

      setLoadingDetail(true);
      try {
        const response = await api.get<EgeTask>(`/ege-tasks/${selectedPrototype.id}`);
        const rawVariations = response.data.variants ?? [];
        setVariations(
          rawVariations.map((item, index) => mapTaskToVariation(item, selectedPrototype.id, index))
        );
      } catch {
        setVariations([]);
      } finally {
        setLoadingDetail(false);
      }
    };

    void loadPrototypeDetail();
  }, [selectedPrototype, detailOpen]);

  useEffect(() => {
    if (!detailOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetailOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [detailOpen]);

  useEffect(() => {
    if (!detailOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detailOpen]);

  const handleOpenTaskFromDraft = useCallback(async (taskId: string) => {
    try {
      const response = await api.get<EgeTask>(`/ege-tasks/${taskId}`);
      const task = response.data;

      if (task.parentId) {
        setSelectedPrototypeId(task.parentId);
        setPreselectedVariationId(task.id);
      } else {
        setSelectedPrototypeId(task.id);
        setPreselectedVariationId(null);
      }

      setDetailOpen(true);
    } catch {
      setError('Не удалось открыть задачу из черновика.');
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">База задач преподавателя</h1>
          <p className="text-slate-500 text-sm mt-1">
            Склад прототипов и вариаций для быстрой сборки домашних заданий.
          </p>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader title="Фильтры" subtitle="Найдите нужный прототип за несколько секунд" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по теме, формулировке, тегу"
            icon={<Search size={16} />}
          />
          <Select value={selectedEge} onChange={setSelectedEge} options={numberOptions} />
          <Select
            value={selectedDifficulty}
            onChange={setSelectedDifficulty}
            options={difficultyOptions}
          />
          <FilterDropdown
            options={topicOptions}
            selected={selectedTopics}
            onChange={setSelectedTopics}
            placeholder="Темы"
            multiple
            searchable
          />
        </div>

        {(selectedEge !== 'all' || selectedDifficulty !== 'all' || selectedTopics.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selectedEge !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedEge('all')}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 px-2.5 py-1 text-xs font-medium hover:bg-blue-200 transition-colors"
              >
                ЕГЭ №{selectedEge}
                <X size={12} />
              </button>
            )}

            {selectedDifficulty !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedDifficulty('all')}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-medium hover:bg-emerald-200 transition-colors"
              >
                {difficultyOptions.find((item) => item.value === selectedDifficulty)?.label ??
                  selectedDifficulty}
                <X size={12} />
              </button>
            )}

            {selectedTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopics((prev) => prev.filter((item) => item !== topic))}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-2.5 py-1 text-xs font-medium hover:bg-amber-200 transition-colors"
              >
                {topic}
                <X size={12} />
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-slate-200">
        <CardHeader title="Прототипы" subtitle={`Найдено: ${filteredPrototypes.length}`} />

        {loading ? (
          <p className="text-sm text-slate-500">Загрузка задач...</p>
        ) : filteredPrototypes.length === 0 ? (
          <p className="text-sm text-slate-500">По текущим фильтрам задачи не найдены.</p>
        ) : (
          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredPrototypes.map((item) => {
              const active = item.id === selectedPrototypeId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedPrototypeId(item.id);
                    setPreselectedVariationId(null);
                    setDetailOpen(true);
                  }}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    active
                      ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="info" size="sm">
                      ЕГЭ №{item.egeNumber}
                    </Badge>
                    <Badge variant="warning" size="sm">
                      {item.topic}
                    </Badge>
                    <Badge variant={difficultyVariant[item.difficulty]} size="sm">
                      {difficultyLabel[item.difficulty]}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{item.contentLatex}</p>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {detailOpen && selectedPrototype && (
        <>
          <div className="fixed left-0 top-0 z-[100] h-[100dvh] w-screen bg-slate-900/50 backdrop-blur-sm" />
          <div
            className="fixed left-0 top-0 z-[120] h-[100dvh] w-screen p-4 sm:p-6 flex items-center justify-center"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setDetailOpen(false);
              }
            }}
          >
            <div className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex justify-end p-3 border-b border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setDetailOpen(false)}
                  className="p-2 rounded-lg bg-white/90 text-slate-600 hover:bg-white"
                  aria-label="Закрыть окно задачи"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[calc(92vh-64px)] overflow-y-auto p-2">
                <TeacherTaskDetail
                  prototype={selectedPrototype}
                  variations={variations}
                  isLoadingVariations={loadingDetail}
                  initialSelectedVariationId={preselectedVariationId}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <FloatingHomeworkDraft
        underModalBackdrop={detailOpen}
        onCheckout={() => {
          setOpenHomeworkConstructorFromDraft(true);
          setActiveTab('homework');
        }}
        onOpenTask={handleOpenTaskFromDraft}
      />
    </div>
  );
}
