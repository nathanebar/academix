import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import api from "../api/axios";

import { useCourseBatchStore } from "../store/courseBatchStore";
import { useSelectionsStore } from "../store/selectionStore";

export const useFetchCourseBatches = (
  allowedCourseBatchesIds: number[] | number,
  selectedCourseId?: number,
) => {

  const coursesIdsArray = Array.isArray(allowedCourseBatchesIds)
    ? allowedCourseBatchesIds
    : [allowedCourseBatchesIds];

  const idsParam = coursesIdsArray?.join(",");

  const { setCourseBatches } = useCourseBatchStore();

  const { setSelectedCourseBatch,selectedCourseBatch, selectedCourse } = useSelectionsStore();


  return useQuery({
    queryKey: ["CourseBatch", allowedCourseBatchesIds,selectedCourseId],
    queryFn: async () => {
      if (!coursesIdsArray || coursesIdsArray.length === 0) return [];

      const { data } = await api.get(`/courseBatch/getAllowedCourseBatches`, {
        params: {
          allowedCourseBatcheIds: idsParam,
        },
      });
      return data;
    },

    meta: {
      onSuccess: (data: any) => {
        const isSelectedBatchValid = selectedCourseId
          ? data.some((batch: any) => batch.id === selectedCourseBatch?.id)
          : data.some((batch: any) => batch.id === selectedCourseBatch?.id);
        
        if (!isSelectedBatchValid && data.length > 0) {
          const batchesForCourse = data.filter(
            (batch: any) => batch.courseId === selectedCourseId
          );
          if (batchesForCourse.length > 0) {
            setSelectedCourseBatch(batchesForCourse[batchesForCourse.length - 1]);
          }
        }
      
        setCourseBatches(data);
      },
    },
    enabled: !!allowedCourseBatchesIds && !!selectedCourseId,
    // staleTime: Infinity,
    // cacheTime: Infinity,
  });
};
