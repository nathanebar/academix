import { create } from "zustand";

interface BlockColorState {
  isBlockColorEnabled: boolean;
  isLoading: boolean;
  error: string | null;

  setBlockColor: (isEnabled: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useBlockColorStore = create<BlockColorState>((set) => ({
  isBlockColorEnabled: false,
  isLoading: false,
  error: null,

  setBlockColor: (isEnabled) => set({ isBlockColorEnabled: isEnabled }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
