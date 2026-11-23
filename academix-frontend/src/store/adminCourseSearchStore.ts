import { create } from "zustand";

// Text of the "חיפוש קורס" box of the admin dashboard (UI state). DashboardAdminHeader writes it,
// DashboardAdminBody filters its course cards with it. It used to write the search result into
// the shared filtered courses, where it stayed for the other pages until Layout recomputed (#17).
interface AdminCourseSearchState {
  courseSearch: string;
  setCourseSearch: (courseSearch: string) => void;
}

export const useAdminCourseSearchStore = create<AdminCourseSearchState>((set) => ({
  courseSearch: "",
  setCourseSearch: (courseSearch) => set({ courseSearch }),
}));
