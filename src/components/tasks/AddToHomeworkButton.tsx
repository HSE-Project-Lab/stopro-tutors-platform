import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Check, Plus } from 'lucide-react';
import { useHomeworkDraftStore } from '@/store/homeworkDraftStore';
import type { TaskDifficulty } from '@/types/tasks';

interface AddToHomeworkButtonProps {
  taskId: string;
  taskNumber: number;
  isClone: boolean;
  taskLabel: string;
  difficulty?: TaskDifficulty | null;
  taskTopics?: string[];
  taskPreview?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export function AddToHomeworkButton({
  taskId,
  taskNumber,
  isClone,
  taskLabel,
  difficulty = null,
  taskTopics = [],
  taskPreview = '',
  size = 'md',
  fullWidth = false,
  className,
}: AddToHomeworkButtonProps) {
  const { addTask, removeTask, selectedTasks } = useHomeworkDraftStore();
  const [justAdded, setJustAdded] = useState(false);

  const isSelected = useMemo(
    () => selectedTasks.some((task) => task.taskId === taskId),
    [selectedTasks, taskId]
  );

  useEffect(() => {
    if (!isSelected) return;
    setJustAdded(true);
    const timer = window.setTimeout(() => setJustAdded(false), 450);
    return () => window.clearTimeout(timer);
  }, [isSelected]);

  const handleClick = () => {
    if (isSelected) {
      removeTask(taskId);
      return;
    }

    addTask({
      taskId,
      taskNumber,
      isClone,
      taskLabel,
      difficulty,
      taskTopics,
      taskPreview,
    });
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      size={size}
      variant={isSelected ? 'secondary' : 'primary'}
      className={`${fullWidth ? 'w-full' : ''} ${
        isSelected
          ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white shadow-emerald-200'
          : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white'
      } ${justAdded ? 'animate-[bounce_0.45s_ease-in-out_1]' : ''} ${className ?? ''}`}
    >
      {isSelected ? (
        <>
          <Check size={16} className="mr-2" />
          Убрать из ДЗ
        </>
      ) : (
        <>
          <Plus size={16} className="mr-2" />
          Добавить в ДЗ
        </>
      )}
    </Button>
  );
}
