import { create } from 'zustand';

export type AppTab =
  | 'admin'
  | 'dashboard'
  | 'tasks'
  | 'practice'
  | 'students'
  | 'ai-assistant'
  | 'analytics'
  | 'homework'
  | 'crm'
  | 'settings';

interface AppState {
  sidebarOpen: boolean;
  activeTab: AppTab;
  practiceFocusEgeNumber: number | null;
  practiceDailyChallengeTaskId: string | null;
  openHomeworkConstructorFromDraft: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: AppTab) => void;
  setPracticeFocusEgeNumber: (egeNumber: number | null) => void;
  setPracticeDailyChallengeTaskId: (taskId: string | null) => void;
  setOpenHomeworkConstructorFromDraft: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  activeTab: 'dashboard',
  practiceFocusEgeNumber: null,
  practiceDailyChallengeTaskId: null,
  openHomeworkConstructorFromDraft: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPracticeFocusEgeNumber: (egeNumber) => set({ practiceFocusEgeNumber: egeNumber }),
  setPracticeDailyChallengeTaskId: (taskId) => set({ practiceDailyChallengeTaskId: taskId }),
  setOpenHomeworkConstructorFromDraft: (open) => set({ openHomeworkConstructorFromDraft: open }),
}));
