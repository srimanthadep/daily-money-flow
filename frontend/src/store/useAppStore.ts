import { create } from 'zustand';
import { supabase, isConfigured } from '@/lib/supabase';

interface AppState {
  isConfigured: boolean;
  userId: string | null;
  setUserId: (id: string | null) => void;
  // Global settings or UI state can go here
  isMenuOpen: boolean;
  toggleMenu: (open?: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isConfigured,
  userId: null,
  setUserId: (id) => set({ userId: id }),
  isMenuOpen: false,
  toggleMenu: (open) => set((state) => ({ isMenuOpen: open ?? !state.isMenuOpen })),
}));
