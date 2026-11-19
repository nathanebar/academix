import { create } from "zustand";

interface SearchNavState {
  taskIds: string[];          // כל המשימות שתואמות לשאילתה (כל הקבוצות)
  currentIndex: number;       // אינדקס של המשימה המסומנת עכשיו
  currentTaskId: string | null; // ה-ID של המשימה המסומנת
  setTasks: (ids: string[]) => void;
  next: () => void;           // חץ ימין → משימה הבאה
  prev: () => void;           // חץ שמאל → משימה קודמת
  reset: () => void;
}

export const useSearchNavStore = create<SearchNavState>((set, get) => ({
  taskIds: [],
  currentIndex: -1,
  currentTaskId: null,

  setTasks: (ids) => {
    set({
      taskIds: ids,
      currentIndex: ids.length ? 0 : -1,
      currentTaskId: ids.length ? ids[0] : null,
    });
  },

  next: () => {
    const { taskIds, currentIndex } = get();
    if (!taskIds.length) return;
    const nextIndex = (currentIndex + 1) % taskIds.length; // לולאה - חוזר להתחלה
    set({ currentIndex: nextIndex, currentTaskId: taskIds[nextIndex] });
  },

  prev: () => {
    const { taskIds, currentIndex } = get();
    if (!taskIds.length) return;
    const prevIndex = (currentIndex - 1 + taskIds.length) % taskIds.length; // לולאה לאחור
    set({ currentIndex: prevIndex, currentTaskId: taskIds[prevIndex] });
  },

  reset: () => set({ taskIds: [], currentIndex: -1, currentTaskId: null }),
}));