import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import { LaTeX } from '@/components/ui/LaTeX';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import {
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Hash,
  BookOpen,
  Trash2,
  Eye,
  X,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import type { EgeTask, EgeTaskCreateRequest, EgeTaskPage, TaskDifficulty } from '@/types';
import { EGE_TOPICS, DIFFICULTY_LABELS } from '@/types';

const NUMBER_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Задание ${i + 1}`,
}));

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Лёгкая' },
  { value: 'MEDIUM', label: 'Средняя' },
  { value: 'HARD', label: 'Сложная' },
];

const DIFFICULTY_CHIP_COLORS: Record<string, string> = {
  EASY: 'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HARD: 'bg-red-50 text-red-700',
};

const ALL_UNIQUE_TOPICS = Array.from(new Set(Object.values(EGE_TOPICS).flat())).sort((a, b) =>
  a.localeCompare(b)
);

const getAvailableTopics = (numbers: string[]) => {
  if (numbers.length === 0) return ALL_UNIQUE_TOPICS;

  const topicsPerNumber = numbers.map((num) => new Set(EGE_TOPICS[parseInt(num)] || []));
  const intersection = topicsPerNumber.reduce(
    (acc, currentSet) => new Set([...acc].filter((topic) => currentSet.has(topic)))
  );

  return Array.from(intersection).sort((a, b) => a.localeCompare(b));
};

function TaskCard({
  task,
  onClick,
  onDelete,
  isAdmin,
}: {
  task: EgeTask;
  onClick: () => void;
  onDelete?: () => void;
  isAdmin: boolean;
}) {
  const difficultyVariant: Record<TaskDifficulty, 'success' | 'warning' | 'danger'> = {
    EASY: 'success',
    MEDIUM: 'warning',
    HARD: 'danger',
  };

  return (
    <Card
      className="hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
          {task.egeNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="default" size="sm">
              <Tag size={12} className="mr-1" />
              {task.topic}
            </Badge>
            <Badge variant={difficultyVariant[task.difficulty]} size="sm">
              {DIFFICULTY_LABELS[task.difficulty]}
            </Badge>
          </div>
          <div className="text-slate-900 line-clamp-2">
            <LaTeX>{task.content}</LaTeX>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Hash size={14} />
              Задание {task.egeNumber}
            </span>
            {task.solution && (
              <span className="flex items-center gap-1">
                <BookOpen size={14} />
                Есть решение
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          )}
          <ChevronRight
            size={20}
            className="text-slate-300 group-hover:text-indigo-400 transition-colors"
          />
        </div>
      </div>
    </Card>
  );
}

function TaskDetail({
  task,
  onBack,
  isAdmin,
}: {
  task: EgeTask;
  onBack: () => void;
  isAdmin: boolean;
}) {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const isCorrect = userAnswer.trim() === task.answer.trim();

  const handleCheck = () => setShowResult(true);
  const handleRetry = () => {
    setUserAnswer('');
    setShowResult(false);
    setShowSolution(false);
  };

  const difficultyVariant: Record<TaskDifficulty, 'success' | 'warning' | 'danger'> = {
    EASY: 'success',
    MEDIUM: 'warning',
    HARD: 'danger',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft size={18} className="mr-1" />
          Назад к списку
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={difficultyVariant[task.difficulty]}>
            {DIFFICULTY_LABELS[task.difficulty]}
          </Badge>
          <Badge>Задание {task.egeNumber}</Badge>
        </div>
      </div>

      <Card padding="lg">
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="default">
              <Tag size={12} className="mr-1" />
              {task.topic}
            </Badge>
          </div>
          <LaTeX className="text-lg text-slate-900 leading-relaxed">{task.content}</LaTeX>
        </div>

        {task.imageUrls && task.imageUrls.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-4">
            {task.imageUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Иллюстрация ${i + 1}`}
                className="max-h-64 rounded-xl border border-slate-200 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/400x200/f8fafc/94a3b8?text=Image+Not+Found';
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Input
            label="Ваш ответ"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Введите ответ..."
            disabled={showResult}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !showResult) handleCheck();
            }}
          />

          {!showResult ? (
            <Button
              onClick={handleCheck}
              className="w-full"
              size="lg"
              disabled={!userAnswer.trim()}
            >
              Проверить ответ
            </Button>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl ${
                  isCorrect
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <p
                  className={`font-semibold text-lg ${
                    isCorrect ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {isCorrect ? '✓ Правильно!' : '✗ Неправильно'}
                </p>
                {!isCorrect && (
                  <div className="mt-2">
                    <span className="text-slate-600">Правильный ответ: </span>
                    <LaTeX className="inline font-semibold text-slate-900">
                      {`$${task.answer}$`}
                    </LaTeX>
                  </div>
                )}
              </div>

              {task.solution && (
                <div>
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mb-2"
                  >
                    <Eye size={14} />
                    {showSolution ? 'Скрыть решение' : 'Показать решение'}
                  </button>
                  {showSolution && (
                    <Card className="bg-slate-50 mt-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                        Решение
                      </p>
                      <LaTeX className="text-slate-700 leading-relaxed">{task.solution}</LaTeX>
                    </Card>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onBack} className="flex-1">
                  К списку задач
                </Button>
                <Button onClick={handleRetry} className="flex-1">
                  Попробовать ещё
                </Button>
              </div>
            </div>
          )}
        </div>

        {isAdmin && !showResult && (
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            <p className="text-xs text-slate-400">
              🔑 Ответ (видно только админу): <span className="font-mono">{task.answer}</span>
            </p>
          </div>
        )}
      </Card>

      {task.variants && task.variants.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-bold text-slate-900 pb-2 border-b border-slate-200">
            Аналогичные задания ({task.variants.length})
          </h3>
          {task.variants.map((variant, idx) => (
            <Card key={variant.id} className="bg-slate-50/50 border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="bg-white">
                  Вариант {idx + 1}
                </Badge>
                {isAdmin && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-indigo-600">
                    <Plus size={14} className="mr-1" /> В ДЗ
                  </Button>
                )}
              </div>

              <LaTeX className="text-slate-800 leading-relaxed">{variant.content}</LaTeX>

              {variant.imageUrls && variant.imageUrls.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {variant.imageUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Иллюстрация варианта ${i + 1}`}
                      className="max-h-48 rounded-lg border border-slate-200 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/400x200/f8fafc/94a3b8?text=Image+Not+Found';
                      }}
                    />
                  ))}
                </div>
              )}

              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                  <p className="text-sm text-slate-600">
                    🔑 Ответ:{' '}
                    <span className="font-mono font-medium text-slate-900">{variant.answer}</span>
                  </p>
                  {variant.solution && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                        Решение
                      </p>
                      <LaTeX className="text-sm text-slate-600">{variant.solution}</LaTeX>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {(p as number) + 1}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export function TasksPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [tasks, setTasks] = useState<EgeTask[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);

  const [selectedTask, setSelectedTask] = useState<EgeTask | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const topicOptions = useMemo(() => {
    return getAvailableTopics(selectedNumbers).map((topic) => ({ value: topic, label: topic }));
  }, [selectedNumbers]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size: 20 };
      if (searchQuery) params.search = searchQuery;
      if (selectedNumbers.length === 1) params.egeNumber = parseInt(selectedNumbers[0]);
      if (selectedNumbers.length > 1) params.egeNumbers = selectedNumbers.join(',');
      if (selectedDifficulties.length === 1) params.difficulty = selectedDifficulties[0];
      if (selectedDifficulties.length > 1) params.difficulties = selectedDifficulties.join(',');
      if (selectedTopics.length > 0) params.topics = selectedTopics.join(',');

      const response = await api.get<EgeTaskPage>('/ege-tasks', { params });
      setTasks(response.data.content);
      setTotalElements(response.data.totalElements);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setTasks([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedNumbers, selectedTopics, selectedDifficulties]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedNumbers, selectedTopics, selectedDifficulties]);

  useEffect(() => {
    if (selectedNumbers.length > 0) {
      const validTopics = new Set(getAvailableTopics(selectedNumbers));
      setSelectedTopics((prev) => prev.filter((topic) => validTopics.has(topic)));
    }
  }, [selectedNumbers]);

  const handleOpenTask = async (task: EgeTask) => {
    setSelectedTask(task);
    try {
      const response = await api.get<EgeTask>(`/ege-tasks/${task.id}`);
      setSelectedTask(response.data);
    } catch (error) {
      console.error('Ошибка загрузки вариантов:', error);
    }
  };

  const handleCreateTask = async (taskData: EgeTaskCreateRequest) => {
    await api.post('/ege-tasks', taskData);
    fetchTasks();
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/ege-tasks/${taskToDelete}`);
      setTaskToDelete(null);
      fetchTasks();
    } catch (error) {}
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedNumbers([]);
    setSelectedTopics([]);
    setSelectedDifficulties([]);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedNumbers.length > 0 ||
    selectedTopics.length > 0 ||
    selectedDifficulties.length > 0;

  if (selectedTask) {
    return (
      <TaskDetail task={selectedTask} onBack={() => setSelectedTask(null)} isAdmin={isAdmin} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">База задач ЕГЭ</h1>
          <p className="text-slate-500 mt-1">
            Профильная математика · Задания 1–12
            {totalElements > 0 && (
              <span className="text-slate-400"> · {totalElements} прототипов</span>
            )}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={18} className="mr-2" />
            Добавить задачу
          </Button>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Поиск по тексту задачи..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={18} />}
            />
          </div>

          <FilterDropdown
            options={NUMBER_OPTIONS}
            selected={selectedNumbers}
            onChange={setSelectedNumbers}
            placeholder="Задание"
            multiple
            className="w-auto"
          />

          <FilterDropdown
            options={topicOptions}
            selected={selectedTopics}
            onChange={setSelectedTopics}
            placeholder="Тема"
            multiple
            searchable
            className="w-auto"
          />

          <FilterDropdown
            options={DIFFICULTY_OPTIONS}
            selected={selectedDifficulties}
            onChange={setSelectedDifficulties}
            placeholder="Сложность"
            multiple
            className="w-auto"
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} className="mr-1" />
              Сбросить
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            {selectedNumbers.map((num) => (
              <span
                key={`n-${num}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
              >
                <Hash size={11} />
                Задание {num}
                <button onClick={() => setSelectedNumbers((prev) => prev.filter((n) => n !== num))}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {selectedTopics.map((topic) => (
              <span
                key={`t-${topic}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-medium"
              >
                <Tag size={11} />
                {topic}
                <button
                  onClick={() => setSelectedTopics((prev) => prev.filter((t) => t !== topic))}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {selectedDifficulties.map((difficulty) => (
              <span
                key={`d-${difficulty}`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${DIFFICULTY_CHIP_COLORS[difficulty]}`}
              >
                {DIFFICULTY_LABELS[difficulty as TaskDifficulty]}
                <button
                  onClick={() =>
                    setSelectedDifficulties((prev) => prev.filter((d) => d !== difficulty))
                  }
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">
            {hasActiveFilters ? 'Задачи не найдены' : 'База задач пуста'}
          </h3>
          <p className="text-slate-500 mb-4">
            {hasActiveFilters
              ? 'Попробуйте изменить параметры фильтрации'
              : 'Зайдите в Админ-панель и загрузите файл .md'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Сбросить фильтры
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => handleOpenTask(task)}
              onDelete={() => setTaskToDelete(task.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
      />

      {taskToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Удалить задачу?</h3>
              <p className="text-slate-500 mb-6">
                Это действие необратимо. Задача и все её варианты будут навсегда удалены из базы.
              </p>
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setTaskToDelete(null)}>
                  Отмена
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDeleteTask}
                >
                  Удалить
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
