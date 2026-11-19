import { create } from "zustand";
import { Course } from "../types/types";



interface CourseStoreState {
  courses: Course[];
  allowCourseIds: number[];
  setCourses: (courses: Course[]) => void;
  setAllowCourseIds: (courseIds: number[]) => void;
  addAllowCourseId: (courseId: number) => void;
  removeAllowCourseId: (courseId: number) => void;
}

export const useCourseStore = create<CourseStoreState>((set) => ({
  courses: [],
  allowCourseIds: [],
  setCourses: (courses) => set({ courses }),
  setAllowCourseIds: (courseIds) => set({ allowCourseIds: courseIds }),
  addAllowCourseId: (courseId) =>
    set((state) => ({
      allowCourseIds: [...state.allowCourseIds, courseId],
    })),
  removeAllowCourseId: (courseId) =>
    set((state) => ({
      allowCourseIds: state.allowCourseIds.filter((id) => id !== courseId),
    })),
}));
