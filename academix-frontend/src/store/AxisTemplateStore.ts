import { create } from "zustand";
import { Axis, AxisTemplate } from "../types/types";

interface AxisTemplateStoreState {
  axisTemplates: AxisTemplate[];
  setAxisTemplates: (axisTemplates: AxisTemplate[]) => void;
}

export const useAxisTemplate = create<AxisTemplateStoreState>((set) => ({
  axisTemplates: [],
  setAxisTemplates: (axisTemplates) => set({ axisTemplates }),
}));
