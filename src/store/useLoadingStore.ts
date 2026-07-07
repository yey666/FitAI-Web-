import { create } from 'zustand';

interface LoadingState {
  isLoading: boolean;
  loadingCount: number;
  showLoading: () => void;
  hideLoading: () => void;
  resetLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  isLoading: false,
  loadingCount: 0,

  showLoading: () => {
    const { loadingCount } = get();
    set({ loadingCount: loadingCount + 1, isLoading: true });
  },

  hideLoading: () => {
    const { loadingCount } = get();
    const newCount = Math.max(loadingCount - 1, 0);
    set({ loadingCount: newCount, isLoading: newCount > 0 });
  },

  resetLoading: () => {
    set({ loadingCount: 0, isLoading: false });
  },
}));