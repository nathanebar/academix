import { create } from "zustand";

export type viewMode =
  | "dayGridMonth"
  | "timeGridWeek"
  | "timeGridDay"
  | "twoWeeks";
  
interface CalendarStore {
  viewMode: viewMode;
  setViewMode: (view: viewMode) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  viewMode: "timeGridDay",
  setViewMode: (view) => set({ viewMode: view }),
}));