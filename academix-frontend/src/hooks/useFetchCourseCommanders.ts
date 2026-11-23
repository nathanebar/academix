import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export const useFetchCourseCommanders = (
  allowedCoursesIds: string | number
) => {
  const coursesIdsArray = Array.isArray(allowedCoursesIds)
    ? allowedCoursesIds
    : [allowedCoursesIds];

  // #17: the components read the commanders from this query. They used to read a copy in the
  // (persisted) selection store, filled only where this hook was mounted (CourseSetting).
  // Key unchanged: useSelectionHandler / DashboardAdminBody / EditPermissionsModal refresh it.
  return useQuery<any>({
    queryKey: ["roleAssignments", allowedCoursesIds],
    queryFn: async () => {
      if (!coursesIdsArray || coursesIdsArray.length === 0) return [];

      const { data } = await api.get(
        `/roleAssignments/getcourseCommander/${allowedCoursesIds}`
      );
      return data;
      
    },
    enabled: !!allowedCoursesIds,
    // staleTime: Infinity,
    // cacheTime: Infinity,
  });
};
