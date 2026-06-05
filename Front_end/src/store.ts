import { create } from 'zustand';
import { View } from './types';

interface AppState {
  currentView: View;
  setView: (view: View) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  aiMode: 'guide' | 'collaborator' | 'mentor' | 'interviewer';
  setAiMode: (mode: 'guide' | 'collaborator' | 'mentor' | 'interviewer') => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  setView: (view) => set({ currentView: view }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  aiMode: 'guide',
  setAiMode: (mode) => set({ aiMode: mode }),
}));
