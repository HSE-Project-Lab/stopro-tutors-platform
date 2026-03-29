import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  activeTab: string;
  practiceFocusEgeNumber: number | null;
  practiceDailyChallengeTaskId: string | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  setPracticeFocusEgeNumber: (egeNumber: number | null) => void;
  setPracticeDailyChallengeTaskId: (taskId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  activeTab: 'dashboard',
  practiceFocusEgeNumber: null,
  practiceDailyChallengeTaskId: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPracticeFocusEgeNumber: (egeNumber) => set({ practiceFocusEgeNumber: egeNumber }),
  setPracticeDailyChallengeTaskId: (taskId) => set({ practiceDailyChallengeTaskId: taskId }),
}));
