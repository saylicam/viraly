import { create } from 'zustand';

interface UserState {
  hasSeenIntro: boolean;
  hasOnboarded: boolean;
  setHasSeenIntro: (value: boolean) => void;
  setHasOnboarded: (value: boolean) => void;
  reset: () => void;
}

export const useUser = create<UserState>((set) => ({
  hasSeenIntro: false,
  hasOnboarded: false,
  setHasSeenIntro: (value) => set({ hasSeenIntro: value }),
  setHasOnboarded: (value) => set({ hasOnboarded: value }),
  reset: () => set({ hasSeenIntro: false, hasOnboarded: false }),
}));