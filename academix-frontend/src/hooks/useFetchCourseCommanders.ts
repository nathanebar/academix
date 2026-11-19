import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useSelectionsStore } from "../store/selectionStore";

export const useFetchCourseCommanders = (
  allowedCoursesIds: string | number
) => {
  const coursesIdsArray = Array.isArray(allowedCoursesIds)
    ? allowedCoursesIds
    : [allowedCoursesIds];

  const { setSelectedCourseCommanders } = useSelectionsStore();

  return useQuery({
    queryKey: ["roleAssignments", allowedCoursesIds],
    queryFn: async () => {
      if (!coursesIdsArray || coursesIdsArray.length === 0) return [];

      const { data } = await api.get(
        `/roleAssignments/getcourseCommander/${allowedCoursesIds}`
      );
      return data;
      
    },
    meta:{

      onSuccess: (data: any) => {
        setSelectedCourseCommanders(data);
      },
    },
    enabled: !!allowedCoursesIds,
    // staleTime: Infinity,
    // cacheTime: Infinity,
  });
};
