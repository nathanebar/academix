import { create } from "zustand";
import { TeamMembers } from "../types/types";
import dayjs, { Dayjs } from "dayjs";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

interface SelectionsState {
  selectedCourseBatchId: number | null;
  selectedDomainId: number | null;
  selectedCourseId: number | null;
  selectedTeamId: number | null;
  selectedAxisId: number | null;
  selectedUserIds: number[];
  selectedDate: Dayjs | null;
  selectedCourseBatch: any | null;
  selectedDomain: any | null;
  selectedCourse: any | null;
  selectedTeam: any | null;
  selectedAxis: any | null;
  selectedTeamMember: TeamMembers | null | any;
  activeHeaderType: string | null;
  selectedSystemId: number | null;
  selectedSystem: any | null;

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  setSelectedCourseBatchId: (id: number | null) => void;
  setSelectedDomainId: (id: number | null) => void;
  setSelectedCourseId: (id: number | null) => void;
  setSelectedTeamId: (id: number | null) => void;
  setSelectedAxisId: (id: number | null) => void;
  setSelectedUserIds: (ids: number[]) => void;
  setSelectedDate: (date: Dayjs | null) => void;
  setSelectedCourseBatch: (courseBatch: any | null) => void;
  setSelectedDomain: (domain: any | null) => void;
  setSelectedCourse: (course: any | null) => void;
  setSelectedTeam: (team: any | null) => void;
  setSelectedAxis: (axis: any | null) => void;
  setSelectedTeamMember: (teamMember: TeamMembers | null) => void;
  setActiveHeaderType: (type: string | null) => void;
  setSelectedSystemId: (id: number | null) => void;
  setSelectedSystem: (system: any | null) => void;
  addSelectedUserId: (id: number) => void;
  removeSelectedUserId: (id: number) => void;
  clearSelections: () => void;
}
const dateReviver = (_key: string, value: any) => {
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
  ) {
    return dayjs(value);
  }
  return value;
};

const zustandStorage = createJSONStorage(() => localStorage, {
  reviver: dateReviver,
});
export const useSelectionsStore = create<SelectionsState>()(
  persist(
    (set) => ({
      selectedCourseBatchId: null,
      selectedDomainId: null,
      selectedCourseId: null,
      selectedTeamId: null,
      selectedAxisId: null,
      selectedUserIds: [],
      selectedDate: dayjs(),
      selectedCourseBatch: null,
      selectedDomain: null,
      selectedCourse: null,
      selectedTeam: null,
      selectedAxis: null,
      selectedTeamMember: null,
      activeHeaderType: null,
      selectedSystemId: null,
      selectedSystem: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setSelectedCourseBatchId: (id) => set({ selectedCourseBatchId: id }),
      setSelectedDomainId: (id) => set({ selectedDomainId: id }),
      setSelectedCourseId: (id) => set({ selectedCourseId: id }),
      setSelectedTeamId: (id) => set({ selectedTeamId: id }),
      setSelectedAxisId: (id) => set({ selectedAxisId: id }),
      setSelectedUserIds: (ids) => set({ selectedUserIds: ids }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedCourseBatch: (courseBatch) =>
        set({ selectedCourseBatch: courseBatch }),
      setSelectedDomain: (domain) => set({ selectedDomain: domain }),
      setSelectedCourse: (course) => set({ selectedCourse: course }),
      setSelectedTeam: (team) => set({ selectedTeam: team }),
      setSelectedAxis: (axis) => set({ selectedAxis: axis }),
      setSelectedTeamMember: (teamMember) =>
        set({ selectedTeamMember: teamMember }),
      setActiveHeaderType: (type) => set({ activeHeaderType: type }),
      setSelectedSystemId: (id) => set({ selectedSystemId: id }),
      setSelectedSystem: (system) => set({ selectedSystem: system }),

      addSelectedUserId: (id) =>
        set((state) => ({
          selectedUserIds: [...state.selectedUserIds, id],
        })),
      removeSelectedUserId: (id) =>
        set((state) => ({
          selectedUserIds: state.selectedUserIds.filter(
            (userId) => userId !== id
          ),
        })),

      clearSelections: () =>
        set({
          selectedCourseBatchId: null,
          selectedDomainId: null,
          selectedCourseId: null,
          selectedTeamId: null,
          selectedAxisId: null,
          selectedUserIds: [],
          selectedCourseBatch: null,
          selectedDomain: null,
          selectedCourse: null,
          selectedTeam: null,
          selectedAxis: null,
          selectedTeamMember: null,
          selectedDate: null,
          selectedSystemId: null,
          selectedSystem: null,
        }),
    }),
    {
      name: "selections-storage",
      storage: zustandStorage,
      partialize: (state) => {
        const { _hasHydrated, setHasHydrated, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
export const useHasHydrated = () => {
  return useSelectionsStore((s) => s._hasHydrated);
};

interface RefreshState {
  refreshKey: number;
  triggerRefresh: () => void;
}

export const useRefreshStore = create<RefreshState>((set) => ({
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));