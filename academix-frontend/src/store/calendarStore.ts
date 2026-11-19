import { create } from "zustand";

export type viewMode =
  | "dayGridMonth"
  | "timeGridWeek"
  | "timeGridDay"
  | "twoWeeks";
  
interface CalendarStore {
  viewMode: viewMode;
  setViewMode: (view: viewMode) => void;
  tasks: CalendarTask[];
  setTasks: (tasks: CalendarTask[]) => void;
}

interface CalendarTask {
  id: number;
  name: string;
  due_date: string;
  status: string;
  taskGroup?: {
    axis?: {
      courseBatch?: {
        name: string;
        course?: { name: string; domain?: { name: string } };
      };
    };
  };
  taskAssignments?: Array<{
    user?: { id: number; name: string };
    team?: { id: number; name: string };
  }>;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  viewMode: "timeGridDay",
  setViewMode: (view) => set({ viewMode: view }),
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
}));