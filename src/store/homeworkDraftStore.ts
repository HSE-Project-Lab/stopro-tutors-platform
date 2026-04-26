import { create } from 'zustand';
import type { TaskDifficulty } from '@/types/tasks';

export interface HomeworkDraftTask {
  taskId: string;
  taskNumber: number;
  isClone: boolean;
  taskLabel: string;
  difficulty: TaskDifficulty | null;
  taskTopics: string[];
  taskPreview: string;
}

interface HomeworkDraftState {
  selectedTasks: HomeworkDraftTask[];
  addTask: (task: HomeworkDraftTask) => void;
  removeTask: (taskId: string) => void;
  clearDraft: () => void;
  hasTask: (taskId: string) => boolean;
}

export const useHomeworkDraftStore = create<HomeworkDraftState>((set, get) => ({
  selectedTasks: [],
  addTask: (task) =>
    set((state) => {
      if (state.selectedTasks.some((item) => item.taskId === task.taskId)) {
        return state;
      }
      return { selectedTasks: [...state.selectedTasks, task] };
    }),
  removeTask: (taskId) =>
    set((state) => ({
      selectedTasks: state.selectedTasks.filter((task) => task.taskId !== taskId),
    })),
  clearDraft: () => set({ selectedTasks: [] }),
  hasTask: (taskId) => get().selectedTasks.some((task) => task.taskId === taskId),
}));
