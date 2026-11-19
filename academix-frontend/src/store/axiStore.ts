import { create } from "zustand";
import { Axis } from "../types/types";

interface AxesStoreState {
  axes: Axis[];
  allowAxisIds: number[];
  setAxes: (axes: Axis[]) => void;
  setAllowAxisIds: (axisIds: number[]) => void;
  addAllowAxisId: (axisId: number) => void;
  removeAllowAxisId: (axisId: number) => void;
}

export const useAxesStore = create<AxesStoreState>((set) => ({
  axes: [],
  allowAxisIds: [],
  setAxes: (axes) => set({ axes }),
  setAllowAxisIds: (axisIds) => set({ allowAxisIds: axisIds }),
  addAllowAxisId: (axisId) =>
    set((state) => ({
      allowAxisIds: [...state.allowAxisIds, axisId],
    })),
  removeAllowAxisId: (axisId) =>
    set((state) => ({
      allowAxisIds: state.allowAxisIds.filter((id) => id !== axisId),
    })),
}));
