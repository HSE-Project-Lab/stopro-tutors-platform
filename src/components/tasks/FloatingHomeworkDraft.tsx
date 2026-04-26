import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useHomeworkDraftStore } from '@/store/homeworkDraftStore';
import { useAppStore } from '@/store/appStore';
import { Check, ChevronUp, ShoppingCart, Trash2 } from 'lucide-react';
import type { TaskDifficulty } from '@/types/tasks';

interface FloatingHomeworkDraftProps {
  onCheckout?: () => void;
  onOpenTask?: (taskId: string) => void;
  underModalBackdrop?: boolean;
}

const difficultyTagStyles: Record<TaskDifficulty, string> = {
  EASY: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-rose-100 text-rose-700',
};

const difficultyLabel: Record<TaskDifficulty, string> = {
  EASY: 'Базовый',
  MEDIUM: 'Средний',
  HARD: 'Сложный',
};

export function FloatingHomeworkDraft({
  onCheckout,
  onOpenTask,
  underModalBackdrop = false,
}: FloatingHomeworkDraftProps) {
  const { selectedTasks, clearDraft, removeTask } = useHomeworkDraftStore();
  const { setActiveTab } = useAppStore();
  const [expanded, setExpanded] = useState(false);

  if (selectedTasks.length === 0) {
    return null;
  }

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
      return;
    }

    setActiveTab('homework');
  };

  return (
    <div
      className={`fixed right-4 bottom-4 w-[min(96vw,500px)] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-xl p-4 animate-in slide-in-from-bottom-4 duration-200 ${
        underModalBackdrop ? 'z-[90]' : 'z-[110]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex items-center gap-2 text-left group"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center transition-colors">
            <ShoppingCart size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Черновик домашнего задания</p>
            <p className="text-xs text-slate-500 mt-0.5">
              В черновике: {selectedTasks.length} задач
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant="info" size="sm">
            {selectedTasks.length}
          </Badge>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label={expanded ? 'Свернуть список задач' : 'Развернуть список задач'}
          >
            <ChevronUp
              size={16}
              className={`transition-transform ${expanded ? 'rotate-0' : 'rotate-180'}`}
            />
          </button>
        </div>
      </div>

      <div
        className={`transition-all duration-200 overflow-hidden ${expanded ? 'max-h-[380px] mt-3' : 'max-h-0'}`}
      >
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {selectedTasks.map((task) => (
            <div
              key={task.taskId}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 flex items-start justify-between gap-2 transition-colors"
            >
              <button
                type="button"
                onClick={() => onOpenTask?.(task.taskId)}
                className="text-left min-w-0 flex-1"
              >
                <p className="text-sm font-medium text-slate-500 line-clamp-2">
                  {task.taskPreview || task.taskLabel}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center rounded-md bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[11px] font-semibold">
                    №{task.taskNumber}
                  </span>
                  {task.difficulty && (
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${difficultyTagStyles[task.difficulty]}`}
                    >
                      {difficultyLabel[task.difficulty]}
                    </span>
                  )}
                  {task.taskTopics.map((topic, index) => (
                    <span
                      key={`${task.taskId}-topic-${topic}-${index}`}
                      className="inline-flex items-center rounded-md bg-amber-100 text-amber-700 px-2 py-0.5 text-[11px] font-semibold"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </button>

              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => removeTask(task.taskId)}
                title="Удалить задачу"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 h-9 whitespace-nowrap rounded-full"
          onClick={handleCheckout}
        >
          <Check size={16} className="mr-2" />
          Оформить ДЗ
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-9 whitespace-nowrap rounded-full text-red-600 border-red-200 hover:bg-red-50"
          onClick={clearDraft}
          title="Очистить корзину"
        >
          <Trash2 size={16} className="mr-2" />
          Очистить корзину
        </Button>
      </div>
    </div>
  );
}
