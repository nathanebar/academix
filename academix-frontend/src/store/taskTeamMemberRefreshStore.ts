import { create } from "zustand";

interface TaskRefreshState {
  needsRefresh: boolean;
  triggerRefresh: () => void;
  clearRefresh: () => void;
}

export const useTaskTeamMemberRefreshStore = create<TaskRefreshState>((set) => ({
  needsRefresh: false,
  triggerRefresh: () => set({ needsRefresh: true }),
  clearRefresh: () => set({ needsRefresh: false }),
}));