import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useSelectionsStore } from "../store/selectionStore";

export const useFetchCourses = (allowedCoursesIds: number[] | number,selectedDomainId:number) => {
  const coursesIdsArray = Array.isArray(allowedCoursesIds)
    ? allowedCoursesIds
    : [allowedCoursesIds];

  const idsParam = coursesIdsArray?.join(",");

  return useQuery({
    queryKey: ["courses", allowedCoursesIds,selectedDomainId],
    queryFn: async () => {
      if (!coursesIdsArray || coursesIdsArray.length === 0) return [];

      const { data } = await api.get(`/courses/getAllowedCourses`, {
        params: {
          allowedCoursesIds: idsParam,
        },
      });

      return data;
    },

    meta: {
      // #17: the courses live only in this query (useCoursesData); only the selection is set here.
      onSuccess: (data: any) => {
        const { selectedCourse, setSelectedCourse } = useSelectionsStore.getState();
        const isSelectedCourseValid = selectedDomainId 
        ? data.some((course: any) => course.id === selectedCourse?.id)
        : data.some((course: any) => course.id === selectedCourse?.id);
      
      if (!isSelectedCourseValid && data.length > 0) {
        const coursesForDomain = data.filter(
          (course: any) => course.domainId === selectedDomainId
        );
        if (coursesForDomain.length > 0) {
          setSelectedCourse(coursesForDomain[coursesForDomain.length - 1]);
        } else {
          setSelectedCourse(data[data.length - 1]);
        }
      }
      },
    },
    enabled: !!allowedCoursesIds && !!selectedDomainId,
    // staleTime: Infinity,
    // cacheTime: Infinity,
  });
};
